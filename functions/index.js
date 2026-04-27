const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");

if (!getApps().length) initializeApp();
const db = getFirestore();

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULER: cada minuto — cierra subastas por fecha O por timer de 10 min
// ─────────────────────────────────────────────────────────────────────────────
exports.actualizarEstadoProductos = onSchedule('* * * * *', async () => {
  const ahora = new Date();
  const snapshot = await db.collection('products')
    .where('estado', '==', 'Disponible')
    .get();

  for (const docSnapshot of snapshot.docs) {
    const productoId = docSnapshot.id;
    const data = docSnapshot.data();
    const fechaCierre = new Date(data.fechaCierre);

    // ── Si hay ofertas: solo importa el timer dinámico ──────────────────
    if (data.ultimaOfertaAt) {
      const ultimaOferta = data.ultimaOfertaAt.toDate
        ? data.ultimaOfertaAt.toDate()
        : new Date(data.ultimaOfertaAt);
      const minutosTranscurridos = (ahora - ultimaOferta) / 60000;
      if (minutosTranscurridos >= 1) { // PRUEBA: 1 min (cambiar a 10 en producción)
        logger.info(`Producto ${productoId}: timer dinámico expirado. Cerrando.`);
        await cerrarSubasta(docSnapshot, productoId, 'timer_dinamico');
      }
      // Si hay ofertas, ignorar fechaCierre original — no hacer nada más
      continue;
    }

    // ── Sin ofertas: usar fechaCierre original del vendedor ──────────────
    if (fechaCierre <= ahora) {
      logger.info(`Producto ${productoId}: fecha de cierre alcanzada sin ofertas.`);
      await cerrarSubasta(docSnapshot, productoId, 'fecha_cierre');
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: cerrar subasta y notificar
// ─────────────────────────────────────────────────────────────────────────────
async function cerrarSubasta(docSnapshot, productoId, motivo) {
  const data = docSnapshot.data();

  await docSnapshot.ref.update({
    estado: 'Finalizada',
    motivoCierre: motivo,
    fechaCierreReal: new Date().toISOString()
  });

  logger.info(`Producto ${productoId} cerrado por: ${motivo}`);

  try {
    const ofertaSnap = await db.collection('ofertas')
      .where('producto_id', '==', productoId)
      .where('es_mas_alta', '==', true)
      .where('estado', '==', 'activa')
      .get();

    if (!ofertaSnap.empty) {
      const oferta = ofertaSnap.docs[0].data();
      const ganadorId = oferta.usuario_id;
      const precioFinal = Number(oferta.cantidad).toLocaleString('es-CO');
      const motivoTexto = motivo === 'buynow' ? 'por Cierre Inmediato' : 'por puja ganadora';

      // ── Guardar notificación en Firestore para el ganador ──────────────
      await db.collection('notificaciones').add({
        userId: ganadorId,
        tipo: 'ganaste',
        titulo: '¡Ganaste la Subasta!',
        mensaje: `¡Eres el ganador de "${data.nombre}" ${motivoTexto}! Monto: $${precioFinal} COP. Tienes 24 horas para completar el pago.`,
        productoId,
        cantidad: oferta.cantidad,
        timestamp: new Date().toISOString(),
        leida: false
      });

      // ── Guardar notificación en Firestore para el vendedor ─────────────
      await db.collection('notificaciones').add({
        userId: data.userId,
        tipo: 'venta',
        titulo: '¡Tu subasta ha sido vendida!',
        mensaje: `"${data.nombre}" fue vendido ${motivoTexto} por $${precioFinal} COP.`,
        productoId,
        cantidad: oferta.cantidad,
        timestamp: new Date().toISOString(),
        leida: false
      });

      // ── Enviar push notification al ganador ────────────────────────────
      try {
        const ganadorSnap = await db.collection('users').doc(ganadorId).get();
        const ganadorData = ganadorSnap.data();
        if (ganadorData?.fcmToken) {
          await getMessaging().send({
            token: ganadorData.fcmToken,
            notification: {
              title: '🏆 ¡Ganaste la Subasta!',
              body: `Ganaste "${data.nombre}" por $${precioFinal} COP. Tienes 24h para pagar.`
            },
            data: {
              tipo: 'ganaste',
              productoId: productoId,
              click_action: 'FLUTTER_NOTIFICATION_CLICK'
            }
          });
          logger.info(`Push enviada al ganador: ${ganadorId}`);
        }
      } catch (e) {
        logger.error('Error enviando push al ganador:', e);
      }

      // ── Enviar push notification al vendedor ───────────────────────────
      try {
        const vendedorSnap = await db.collection('users').doc(data.userId).get();
        const vendedorData = vendedorSnap.data();
        if (vendedorData?.fcmToken) {
          await getMessaging().send({
            token: vendedorData.fcmToken,
            notification: {
              title: '💰 ¡Tu subasta fue vendida!',
              body: `"${data.nombre}" se vendió por $${precioFinal} COP.`
            },
            data: {
              tipo: 'venta',
              productoId: productoId,
              click_action: 'FLUTTER_NOTIFICATION_CLICK'
            }
          });
          logger.info(`Push enviada al vendedor: ${data.userId}`);
        }
      } catch (e) {
        logger.error('Error enviando push al vendedor:', e);
      }

    } else {
      // ── Sin ofertas — notificar solo al vendedor ───────────────────────
      await db.collection('notificaciones').add({
        userId: data.userId,
        tipo: 'sin_ofertas',
        titulo: 'Subasta sin ofertas',
        mensaje: `Tu subasta "${data.nombre}" finalizó sin recibir ofertas.`,
        productoId,
        timestamp: new Date().toISOString(),
        leida: false
      });

      // Push al vendedor
      try {
        const vendedorSnap = await db.collection('users').doc(data.userId).get();
        const vendedorData = vendedorSnap.data();
        if (vendedorData?.fcmToken) {
          await getMessaging().send({
            token: vendedorData.fcmToken,
            notification: {
              title: 'Subasta finalizada sin ofertas',
              body: `Tu subasta "${data.nombre}" cerró sin recibir pujas.`
            },
            data: { tipo: 'sin_ofertas', productoId }
          });
        }
      } catch (e) {
        logger.error('Error enviando push sin ofertas:', e);
      }
    }
  } catch (e) {
    logger.error('Error al notificar cierre:', e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER: oferta creada → actualizar timer + es_mas_alta + notificar
// ─────────────────────────────────────────────────────────────────────────────
exports.ofertaCreada = onDocumentCreated("ofertas/{ofertaId}", async (event) => {
  const oferta = event.data?.data();
  logger.info("Oferta creada:", oferta);

  if (!oferta?.producto_id) {
    logger.warn("Falta producto_id en oferta creada");
    return;
  }

  const productoId = oferta.producto_id;

  // 1. Guardar ultimaOfertaAt en el producto (activa el timer de 10 min)
  await db.collection('products').doc(productoId).update({
    ultimaOfertaAt: FieldValue.serverTimestamp(),
    tieneOfertas: true
  });

  // 2. Recalcular oferta más alta
  await actualizarEsMasAlta(productoId);

  // 3. Verificar BuyNow — si oferta >= precioVentaInmediata cerrar inmediatamente
  try {
    const productoSnap = await db.collection('products').doc(productoId).get();
    const productoData = productoSnap.data();
    const precioVentaInmediata = Number(productoData?.precioVentaInmediata || 0);
    const cantidadOferta = Number(oferta.cantidad || 0);

    if (precioVentaInmediata > 0 && cantidadOferta >= precioVentaInmediata) {
      logger.info(`BuyNow activado. Oferta: ${cantidadOferta} >= BuyNow: ${precioVentaInmediata}`);
      await cerrarSubasta(productoSnap, productoId, 'buynow');
      return; // Subasta cerrada, no notificar superados
    }
  } catch (e) {
    logger.error('Error verificando BuyNow:', e);
  }

  // 4. Notificar a postores superados
  try {
    const ofertasSnap = await db.collection('ofertas')
      .where('producto_id', '==', productoId)
      .where('estado', '==', 'activa')
      .get();

    const productoSnap = await db.collection('products').doc(productoId).get();
    const nombreProducto = productoSnap.data()?.nombre || 'el producto';

    for (const doc of ofertasSnap.docs) {
      const o = doc.data();
      if (o.usuario_id !== oferta.usuario_id && !o.es_mas_alta) {
        const precioNuevo = Number(oferta.cantidad).toLocaleString('es-CO');

        await db.collection('notificaciones').add({
          userId: o.usuario_id,
          tipo: 'superado',
          titulo: 'Actualización de Subasta',
          mensaje: `¡Te han superado! Tu oferta para "${nombreProducto}" ya no es la más alta. Alguien ofreció $${precioNuevo} COP.`,
          productoId,
          cantidad: oferta.cantidad,
          timestamp: new Date().toISOString(),
          leida: false
        });

        // Push al postor superado
        try {
          const postorSnap = await db.collection('users').doc(o.usuario_id).get();
          const postorData = postorSnap.data();
          if (postorData?.fcmToken) {
            await getMessaging().send({
              token: postorData.fcmToken,
              notification: {
                title: '⚠️ ¡Te han superado!',
                body: `Alguien ofreció $${precioNuevo} COP por "${nombreProducto}". ¡Contraoferta ahora!`
              },
              data: { tipo: 'superado', productoId }
            });
          }
        } catch (e) {
          logger.error('Error push postor superado:', e);
        }
      }
    }
  } catch (e) {
    logger.error('Error al notificar postores superados:', e);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER: oferta actualizada → recalcular es_mas_alta
// ─────────────────────────────────────────────────────────────────────────────
exports.ofertaActualizada = onDocumentUpdated("ofertas/{ofertaId}", async (event) => {
  const oferta = event.data?.after.data();
  if (!oferta?.producto_id) {
    logger.warn("Datos incompletos o falta producto_id");
    return;
  }
  await actualizarEsMasAlta(oferta.producto_id);
});

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER: producto finalizado → transferir saldo y crear compra
// ─────────────────────────────────────────────────────────────────────────────
exports.finalizarProductoYActualizarSaldo = onDocumentUpdated("products/{productoId}", async (event) => {
  logger.info("finalizarProductoYActualizarSaldo ejecutado.");

  const antes = event.data?.before.data();
  const producto = event.data?.after.data();
  const productoId = event.params.productoId;

  // Solo cuando cambia A Finalizada (evitar loops)
  if (antes?.estado === 'Finalizada' || producto?.estado !== 'Finalizada') {
    return null;
  }

  const ofertaSnapshot = await db.collection('ofertas')
    .where('producto_id', '==', productoId)
    .where('es_mas_alta', '==', true)
    .where('estado', '==', 'activa')
    .get();

  if (ofertaSnapshot.empty) {
    logger.info(`Sin oferta ganadora para producto ${productoId}`);
    return null;
  }

  const oferta = ofertaSnapshot.docs[0].data();
  const compradorId = oferta.usuario_id;
  const cantidad = oferta.cantidad;

  const compradorSnap = await db.collection('users').doc(compradorId).get();
  const vendedorSnap = await db.collection('users').doc(producto.userId).get();

  if (!compradorSnap.exists || !vendedorSnap.exists) {
    logger.warn('No se encontraron datos del comprador o vendedor');
    return null;
  }

  const comprador = compradorSnap.data();
  const vendedor = vendedorSnap.data();

  if (comprador.saldo < cantidad) {
    logger.warn('Saldo insuficiente del comprador');
    await db.collection('notificaciones').add({
      userId: compradorId,
      tipo: 'saldo_insuficiente',
      titulo: 'Saldo insuficiente',
      mensaje: `No pudimos procesar tu pago para "${producto.nombre}". Por favor recarga tu saldo.`,
      productoId,
      timestamp: new Date().toISOString(),
      leida: false
    });
    return null;
  }

  const batch = db.batch();

  batch.update(db.collection('users').doc(compradorId), {
    saldo: comprador.saldo - cantidad
  });
  batch.update(db.collection('users').doc(producto.userId), {
    saldo: vendedor.saldo + cantidad
  });
  batch.update(ofertaSnapshot.docs[0].ref, { estado: 'finalizada' });

  // Crear registro de compra
  const compraRef = db.collection('compras').doc();
  batch.set(compraRef, {
    userId: compradorId,
    productoId,
    precioTotal: cantidad,
    fechaCompra: FieldValue.serverTimestamp(),
    estado: 'En proceso',
    vendedorId: producto.userId
  });

  try {
    await batch.commit();
    logger.info(`Saldo transferido — comprador: ${compradorId}, vendedor: ${producto.userId}`);
  } catch (error) {
    logger.error("Error en batch de saldo:", error);
  }

  return null;
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: recalcular oferta más alta
// ─────────────────────────────────────────────────────────────────────────────
async function actualizarEsMasAlta(productoId) {
  if (!productoId) return;

  const ofertasSnap = await db.collection("ofertas")
    .where("producto_id", "==", productoId)
    .where("estado", "==", "activa")
    .get();

  if (ofertasSnap.empty) return;

  let maxCantidad = -Infinity;
  let ofertaMasAltaId = '';

  ofertasSnap.forEach(doc => {
    const data = doc.data();
    if (data.cantidad > maxCantidad) {
      maxCantidad = data.cantidad;
      ofertaMasAltaId = doc.id;
    }
  });

  const batch = db.batch();
  ofertasSnap.docs.forEach(doc => {
    batch.update(doc.ref, { es_mas_alta: doc.id === ofertaMasAltaId });
  });
  await batch.commit();

  // Actualizar precioBase del producto
  await db.collection('products').doc(productoId).update({
    precioBase: maxCantidad
  });

  logger.info(`es_mas_alta actualizado. Ganador: ${ofertaMasAltaId} con $${maxCantidad}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICACIONES PUSH: nueva subasta
// ─────────────────────────────────────────────────────────────────────────────
exports.nuevaSubastaV2 = onDocumentCreated("subastas/{subastaId}", async (event) => {
  if (!event.data?.exists) return null;
  const nuevaSubasta = event.data.data();

  try {
    await getMessaging().send({
      notification: {
        title: '¡Nueva subasta disponible!',
        body: `${nuevaSubasta.titulo} — Precio inicial: ${nuevaSubasta.precioInicial}`
      },
      topic: 'nuevas-subastas'
    });
    return { success: true };
  } catch (error) {
    logger.error('Error nuevaSubastaV2:', error);
    return { error: error.message };
  }
});

exports.actualizacionSubastaV2 = onDocumentUpdated("subastas/{subastaId}", async (event) => {
  if (!event.data) return null;
  const despues = event.data.after.data();

  try {
    await getMessaging().send({
      notification: {
        title: '¡Subasta actualizada!',
        body: `${despues.titulo} tiene un nuevo precio.`
      },
      topic: 'nuevas-subastas'
    });
    return { success: true };
  } catch (error) {
    logger.error('Error actualizacionSubastaV2:', error);
    return { error: error.message };
  }
});

exports.helloWorldV2 = onRequest((req, res) => {
  res.send("¡Hola desde Firebase Functions v2 modular!");
});