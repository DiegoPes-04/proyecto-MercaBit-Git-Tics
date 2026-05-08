const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { getAuth: adminAuth } = require("firebase-admin/auth");
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
  // Transacción atómica: solo cierra si sigue en Disponible (evita doble cierre)
  let data;
  try {
    await db.runTransaction(async (tx) => {
      const fresh = await tx.get(docSnapshot.ref);
      if (!fresh.exists || fresh.data().estado !== 'Disponible') {
        throw new Error('ya_cerrada');
      }
      data = fresh.data();
      tx.update(docSnapshot.ref, {
        estado: 'Finalizada',
        motivoCierre: motivo,
        fechaCierreReal: new Date().toISOString()
      });
    });
  } catch (e) {
    if (e.message === 'ya_cerrada') {
      logger.info(`Producto ${productoId} ya estaba cerrado, se omite.`);
      return;
    }
    throw e;
  }

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
exports.ofertaCreada = onDocumentCreated(
  { document: "ofertas/{ofertaId}", region: "us-east1" },
  async (event) => {
  const oferta = event.data?.data();
  logger.info("Oferta creada:", oferta);

  if (!oferta?.producto_id) {
    logger.warn("Falta producto_id en oferta creada");
    return;
  }

  const productoId = oferta.producto_id;

  // 0. Validar que el ofertante NO sea el vendedor
  try {
    const prodSnap = await db.collection('products').doc(productoId).get();
    if (prodSnap.exists()) {
      const prodData = prodSnap.data();
      if (prodData.userId === oferta.usuario_id) {
        logger.warn(`Usuario ${oferta.usuario_id} intentó pujar en su propio producto ${productoId}. Bloqueado.`);
        // Eliminar la oferta inválida
        await event.data.ref.delete();
        return;
      }
    }
  } catch (e) {
    logger.error('Error validando vendedor vs comprador:', e);
  }

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

  if (antes?.estado === 'Finalizada' || producto?.estado !== 'Finalizada') return null;

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
  const precioFinal = Number(cantidad).toLocaleString('es-CO');

  // Notificar al vendedor que el ganador tiene pendiente el pago
  await db.collection('notificaciones').add({
    userId: producto.userId,
    tipo: 'pago_pendiente',
    titulo: '⏳ Pago en proceso',
    mensaje: `El ganador de "${producto.nombre}" tiene 24 horas para completar el pago de $${precioFinal} COP.`,
    productoId,
    productoNombre: producto.nombre,
    compradorId,
    timestamp: new Date().toISOString(),
    leida: false
  });

  return null;
});

// ─────────────────────────────────────────────────────────────────────────────
// CALLABLE: comprador realiza el pago manualmente
// ─────────────────────────────────────────────────────────────────────────────
exports.realizarPago = onRequest({ cors: true }, async (req, res) => {
  // Verificar auth token manualmente
  const idToken = (req.headers.authorization || '').replace('Bearer ', '');
  if (!idToken) { res.status(401).json({ success: false, error: 'No autenticado' }); return; }

  let compradorId;
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    compradorId = decoded.uid;
  } catch (e) {
    res.status(401).json({ success: false, error: 'Token inválido' });
    return;
  }

  const { productoId } = req.body;
  if (!productoId) { res.status(400).json({ success: false, error: 'Falta productoId' }); return; }

  try {
    const productoSnap = await db.collection('products').doc(productoId).get();
    if (!productoSnap.exists) { res.status(404).json({ success: false, error: 'Producto no encontrado' }); return; }
    const producto = productoSnap.data();
    const vendedorId = producto.vendedorId || producto.userId;

    if (producto.estado !== 'Finalizada') { res.status(400).json({ success: false, error: 'Subasta no finalizada' }); return; }

    // Idempotencia
    const compraExistente = await db.collection('compras')
      .where('userId', '==', compradorId)
      .where('productoId', '==', productoId)
      .get();
    if (!compraExistente.empty) {
      res.json({ success: true, compraId: compraExistente.docs[0].id, yaRealizado: true });
      return;
    }

    const ofertaSnapshot = await db.collection('ofertas')
      .where('producto_id', '==', productoId)
      .where('es_mas_alta', '==', true)
      .where('estado', '==', 'activa')
      .get();
    if (ofertaSnapshot.empty) { res.status(404).json({ success: false, error: 'Sin oferta ganadora' }); return; }

    const oferta = ofertaSnapshot.docs[0].data();
    if (oferta.usuario_id !== compradorId) { res.status(403).json({ success: false, error: 'No eres el ganador' }); return; }

    const cantidad = oferta.cantidad;

    // ── Comisión por categoría ────────────────────────────────────────────
    const COMISIONES = {
      'Inmuebles': 0.03, 'Autos y Motos': 0.025, 'Industrial y Maquinaria': 0.02,
      'Tecnología': 0.015, 'Ropa': 0.01, 'Hogar y Decoracion': 0.005,
    };
    const comisionRate = COMISIONES[producto.categoria] ?? 0.01;
    const comision = Math.round(cantidad * comisionRate);
    const totalConComision = cantidad + comision;

    const compradorSnap = await db.collection('users').doc(compradorId).get();
    if (!compradorSnap.exists) { res.status(404).json({ success: false, error: 'Comprador no encontrado' }); return; }

    const comprador = compradorSnap.data();
    const precioFinal = Number(totalConComision).toLocaleString('es-CO');
    const precioOferta = Number(cantidad).toLocaleString('es-CO');

    // ── Saldo insuficiente ────────────────────────────────────────────────
    if (comprador.saldo < totalConComision) {
      logger.warn(`Saldo insuficiente — comprador: ${compradorId}`);
      try { await db.collection('notificaciones').add({ userId: compradorId, tipo: 'saldo_insuficiente', titulo: '❌ Saldo insuficiente', mensaje: `No pudimos procesar tu pago de $${precioFinal} COP (incluye ${(comisionRate*100)}% comisión) para "${producto.nombre}". Por favor recarga tu saldo.`, productoId, productoNombre: producto.nombre, timestamp: new Date().toISOString(), leida: false }); } catch (e) { logger.error('Error notif comprador:', e); }
      try { await db.collection('notificaciones').add({ userId: vendedorId, tipo: 'pago_fallido', titulo: '⚠️ Pago no completado', mensaje: `Un comprador no pudo completar el pago de $${precioFinal} COP por "${producto.nombre}" por saldo insuficiente. Puedes reportar el incumplimiento.`, productoId, productoNombre: producto.nombre, compradorId, timestamp: new Date().toISOString(), leida: false }); } catch (e) { logger.error('Error notif vendedor:', e); }
      res.json({ success: false, reason: 'saldo_insuficiente' });
      return;
    }

    // ── Pago exitoso ──────────────────────────────────────────────────────
    const vendedorSnap = await db.collection('users').doc(vendedorId).get();
    if (!vendedorSnap.exists) { res.status(404).json({ success: false, error: 'Vendedor no encontrado' }); return; }
    const vendedor = vendedorSnap.data();

    const batch = db.batch();
    // Comprador paga precio + comisión; vendedor recibe solo precio de oferta
    batch.update(db.collection('users').doc(compradorId), { saldo: comprador.saldo - totalConComision });
    batch.update(db.collection('users').doc(vendedorId), { saldo: vendedor.saldo + cantidad });
    batch.update(ofertaSnapshot.docs[0].ref, { estado: 'finalizada' });

    const compraRef = db.collection('compras').doc();
    batch.set(compraRef, { userId: compradorId, productoId, productoNombre: producto.nombre, precioOferta: cantidad, comision, comisionRate, precioTotal: totalConComision, fechaCompra: FieldValue.serverTimestamp(), estado: 'pagado', vendedorId });

    await batch.commit();
    logger.info(`Pago procesado — comprador: ${compradorId}, vendedor: ${vendedorId}, comisión: ${comision}`);

    try { await db.collection('notificaciones').add({ userId: vendedorId, tipo: 'pago_recibido', titulo: '💰 Pago recibido', mensaje: `Recibiste $${precioOferta} COP por "${producto.nombre}". El pedido está en camino al comprador.`, productoId, timestamp: new Date().toISOString(), leida: false }); } catch (e) { logger.error('Error notif vendedor recibido:', e); }
    try { await db.collection('notificaciones').add({ userId: compradorId, tipo: 'pago_procesado', titulo: '✅ Pago procesado', mensaje: `Tu pago de $${precioFinal} COP por "${producto.nombre}" fue exitoso (incluye ${(comisionRate*100)}% comisión MercaBit). ¡Pronto recibirás tu pedido!`, productoId, compraId: compraRef.id, timestamp: new Date().toISOString(), leida: false }); } catch (e) { logger.error('Error notif comprador procesado:', e); }

    res.json({ success: true, compraId: compraRef.id });

  } catch (error) {
    logger.error('Error en realizarPago:', error);
    res.status(500).json({ success: false, error: 'Error interno al procesar el pago' });
  }
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