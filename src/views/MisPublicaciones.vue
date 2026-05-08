<template>
  <ion-page>
    <ion-header class="pub-header">
      <ion-toolbar class="pub-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button class="menu-btn" />
        </ion-buttons>
        <ion-title class="pub-title">Mis Publicaciones</ion-title>
        <ion-buttons slot="end">
          <ion-button class="add-btn" @click="navigate('/agregar-producto')">
            <ion-icon :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="pub-content">

      <!-- Hero -->
      <div class="hero-section">
        <h1 class="hero-title">Mis<br /><span class="hero-accent">Publicaciones</span></h1>
        <p class="hero-sub">{{ productos.length }} producto{{ productos.length !== 1 ? 's' : '' }} publicado{{ productos.length !== 1 ? 's' : '' }}</p>
      </div>

      <!-- Empty state -->
      <div class="empty-state" v-if="productos.length === 0">
        <div class="empty-icon-wrap">
          <ion-icon :icon="bagAddOutline" class="empty-icon" />
        </div>
        <h3 class="empty-title">Sin publicaciones</h3>
        <p class="empty-sub">Aún no has publicado ningún producto en subasta.</p>
        <button class="pub-new-btn" @click="navigate('/agregar-producto')">
          <ion-icon :icon="addOutline" /> Agregar producto
        </button>
      </div>

      <!-- Lista de productos -->
      <div class="productos-list" v-else>
        <div class="producto-card" v-for="producto in productos" :key="producto.id">

          <!-- Imagen -->
          <div class="card-img-wrap">
            <img
              :src="producto.imagenes?.[0]?.url || '/img/imagen-prueba.jpg'"
              class="card-img"
              @error="onImgError"
            />
            <!-- Badge estado -->
            <span class="estado-badge" :class="badgeClass(producto.estado)">
              {{ badgeTexto(producto.estado) }}
            </span>
          </div>

          <!-- Info -->
          <div class="card-body">
            <div class="card-top">
              <span class="card-cat">{{ producto.categoria || 'Sin categoría' }}</span>
              <span class="card-fecha">{{ formatearFechaPublicacion(producto.creadoEn) }}</span>
            </div>
            <h2 class="card-nombre">{{ producto.nombre }}</h2>

            <!-- Precios -->
            <div class="precios-row">
              <div class="precio-item">
                <span class="precio-label">Precio base</span>
                <span class="precio-val">${{ formatearPrecio(producto.precioBase) }}</span>
              </div>
              <div class="precio-divider" />
              <div class="precio-item">
                <span class="precio-label">Cierre inmediato</span>
                <span class="precio-val orange">${{ formatearPrecio(producto.precioVentaInmediata) }}</span>
              </div>
            </div>

            <!-- Fechas -->
            <div class="fechas-row">
              <div class="fecha-item">
                <ion-icon :icon="calendarOutline" class="fecha-icon" />
                <div>
                  <span class="fecha-label">Apertura</span>
                  <span class="fecha-val">{{ formatearFechaHora(producto.fechaApertura) }}</span>
                </div>
              </div>
              <div class="fecha-item">
                <ion-icon :icon="timeOutline" class="fecha-icon" />
                <div>
                  <span class="fecha-label">Cierre</span>
                  <span class="fecha-val">{{ formatearFechaHora(producto.fechaCierre) }}</span>
                </div>
              </div>
            </div>

            <!-- Motivo de rechazo -->
            <div v-if="producto.estado === 'Rechazado'" class="rechazo-notice">
              <div class="rechazo-header">
                <ion-icon :icon="closeCircleOutline" />
                <span>Publicación rechazada</span>
              </div>
              <p class="rechazo-motivo">{{ producto.motivoRechazo || 'El administrador no especificó un motivo.' }}</p>
            </div>

            <!-- Acciones -->
            <div class="acciones-row">
              <button
                v-if="producto.estado !== 'Vendido' && producto.estado !== 'PendienteAprobacion' && producto.estado !== 'Rechazado'"
                class="btn-vendido"
                @click="marcarComoVendido(producto.id)"
              >
                <ion-icon :icon="checkmarkCircleOutline" />
                Marcar Vendido
              </button>
              <div v-if="producto.estado === 'PendienteAprobacion'" class="pending-notice">
                <ion-icon :icon="timeOutline" /> En revisión por el administrador
              </div>
              <button
                v-if="producto.estado === 'Rechazado'"
                class="btn-reenviar"
                @click="reenviarProducto(producto.id)"
              >
                <ion-icon :icon="refreshOutline" />
                Corregir y reenviar
              </button>
              <button class="btn-borrar" @click="eliminarProducto(producto.id)">
                <ion-icon :icon="trashOutline" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style="height: 80px" />
    </ion-content>

    <!-- Bottom Nav -->
    <div class="bottom-nav">
      <div class="nav-item" @click="navigate('/home')">
        <ion-icon :icon="homeOutline" /><span>INICIO</span>
      </div>
      <div class="nav-item" @click="navigate('/categorias')">
        <ion-icon :icon="gridOutline" /><span>CATEGORÍAS</span>
      </div>
      <div class="nav-item" @click="navigate('/ofertas-realizadas')">
        <ion-icon :icon="layersOutline" /><span>MIS TRATOS</span>
      </div>
      <div class="nav-item" @click="navigate('/explorar')">
        <ion-icon :icon="searchOutline" /><span>EXPLORAR</span>
      </div>
      <div class="nav-item" @click="navigate('/Notification')">
        <ion-icon :icon="notificationsOutline" /><span>ALERTS</span>
      </div>
      <div class="nav-item" @click="navigate('/mi-cuenta')">
        <ion-icon :icon="personOutline" /><span>CUENTA</span>
      </div>
    </div>
  </ion-page>
</template>

<script setup>
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton, IonButton, IonIcon
} from '@ionic/vue'
import {
  addOutline, bagAddOutline, calendarOutline, timeOutline,
  checkmarkCircleOutline, trashOutline, closeCircleOutline, refreshOutline,
  homeOutline, gridOutline, layersOutline,
  searchOutline, notificationsOutline, personOutline
} from 'ionicons/icons'
import { ref, onMounted } from 'vue'
import { db, auth, storage } from '../firebase/FirebaseConfig'
import { collection, query, where, getDocs, getDoc, updateDoc, doc, deleteDoc, deleteField } from 'firebase/firestore'
import { ref as storageRef, deleteObject } from 'firebase/storage'
import { useRouter } from 'vue-router'

const router = useRouter()
const navigate = (path) => router.push(path)
const productos = ref([])

const onImgError = (e) => { e.target.src = '/img/imagen-prueba.jpg' }

const badgeClass = (estado) => ({
  'vendido':    estado === 'Vendido',
  'disponible': estado === 'Disponible',
  'pendiente':  estado === 'PendienteAprobacion',
  'finalizada': estado === 'Finalizada',
  'rechazado':  estado === 'Rechazado',
})

const badgeTexto = (estado) => {
  const map = {
    Vendido:             'VENDIDO',
    Disponible:          'DISPONIBLE',
    PendienteAprobacion: 'EN REVISIÓN',
    Finalizada:          'FINALIZADA',
    Rechazado:           'RECHAZADO',
  }
  return map[estado] || estado.toUpperCase()
}

const formatearPrecio = (precio) => {
  if (!precio && precio !== 0) return 'N/A'
  // Si es objeto (map de Firestore)
  if (typeof precio === 'object') {
    const val = precio.valor || precio.value || Object.values(precio)[0]
    return new Intl.NumberFormat('es-CO').format(val || 0)
  }
  return new Intl.NumberFormat('es-CO').format(precio)
}

const formatearFechaHora = (fechaStr) => {
  if (!fechaStr) return 'N/A'
  try {
    const fecha = fechaStr?.toDate ? fechaStr.toDate() : new Date(fechaStr)
    if (isNaN(fecha.getTime())) return 'N/A'
    return fecha.toLocaleString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  } catch { return 'N/A' }
}

const formatearFechaPublicacion = (fechaStr) => {
  if (!fechaStr) return ''
  try {
    const fecha = fechaStr?.toDate ? fechaStr.toDate() : new Date(fechaStr)
    if (isNaN(fecha.getTime())) return ''
    return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return '' }
}

const cargarMisProductos = async () => {
  const user = auth.currentUser
  if (!user) return
  try {
    const q = query(collection(db, 'products'), where('userId', '==', user.uid))
    const snap = await getDocs(q)
    productos.value = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.creadoEn > a.creadoEn ? 1 : -1))
  } catch (e) {
    console.error('Error al cargar productos:', e)
  }
}

const eliminarProducto = async (id) => {
  try {
    const productoRef = doc(db, 'products', id)
    const snap = await getDoc(productoRef)
    if (snap.exists()) {
      const data = snap.data()
      if (data.imagenes?.length > 0) {
        for (const img of data.imagenes) {
          await deleteObject(storageRef(storage, img.path))
        }
      }
      await deleteDoc(productoRef)
      productos.value = productos.value.filter(p => p.id !== id)
    }
  } catch (e) {
    console.error('Error al eliminar:', e)
  }
}

const reenviarProducto = async (id) => {
  try {
    await updateDoc(doc(db, 'products', id), {
      estado: 'PendienteAprobacion',
      motivoRechazo: deleteField()
    })
    productos.value = productos.value.map(p =>
      p.id === id ? { ...p, estado: 'PendienteAprobacion', motivoRechazo: undefined } : p
    )
  } catch (e) {
    console.error('Error al reenviar:', e)
  }
}

const marcarComoVendido = async (id) => {
  try {
    await updateDoc(doc(db, 'products', id), { estado: 'Vendido' })

    // Actualizar la compra relacionada → mueve el tracker a ENTREGADO
    const comprasSnap = await getDocs(
      query(collection(db, 'compras'), where('productoId', '==', id))
    )
    for (const compraDoc of comprasSnap.docs) {
      await updateDoc(compraDoc.ref, { estado: 'Vendido' })
    }

    productos.value = productos.value.map(p =>
      p.id === id ? { ...p, estado: 'Vendido' } : p
    )
  } catch (e) {
    console.error('Error al marcar vendido:', e)
  }
}

onMounted(cargarMisProductos)
</script>

<style scoped>
.pub-header { --background: #fff; border-bottom: 1px solid #eee; }
.pub-toolbar { --background: #fff; --color: #111; --min-height: 60px; padding: 0 8px; }
.pub-title { font-size: 1rem; font-weight: 800; color: #111; }
.menu-btn { --color: #111; }
.add-btn { --color: #F5A623; }
.pub-content { --background: #F5F5F5; }

/* Hero */
.hero-section { background: #fff; padding: 20px 20px 18px; margin-bottom: 10px; }
.hero-title { font-size: 1.6rem; font-weight: 900; color: #111; line-height: 1.2; margin: 0 0 4px; }
.hero-accent { color: #F5A623; }
.hero-sub { font-size: 0.8rem; color: #aaa; margin: 0; }

/* Empty */
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 30px; text-align: center; }
.empty-icon-wrap { width: 72px; height: 72px; background: #FFF3E0; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
.empty-icon { font-size: 2rem; color: #F5A623; }
.empty-title { font-size: 1rem; font-weight: 800; color: #111; margin: 0 0 6px; }
.empty-sub { font-size: 0.82rem; color: #aaa; margin: 0 0 20px; }
.pub-new-btn { background: #F5A623; border: none; border-radius: 20px; padding: 10px 24px; font-size: 0.85rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; }

/* Lista */
.productos-list { padding: 0 16px; display: flex; flex-direction: column; gap: 14px; }

.producto-card { background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 2px 14px rgba(0,0,0,0.07); }

/* Imagen */
.card-img-wrap { position: relative; width: 100%; height: 200px; background: #f0f0f0; }
.card-img { width: 100%; height: 100%; object-fit: cover; }
.estado-badge { position: absolute; top: 12px; right: 12px; font-size: 0.6rem; font-weight: 800; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 20px; }
.estado-badge.vendido    { background: #27AE60; color: #fff; }
.estado-badge.disponible { background: #F5A623; color: #000; }
.estado-badge.pendiente  { background: #E3F2FD; color: #1565C0; }
.estado-badge.finalizada { background: #EEEEEE; color: #555; }
.estado-badge.rechazado  { background: #FFEBEE; color: #E53935; }

.pending-notice {
  flex: 1; background: #E3F2FD;
  border-radius: 12px; padding: 12px;
  font-size: 0.78rem; font-weight: 700; color: #1565C0;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
.pending-notice ion-icon { font-size: 1rem; pointer-events: none; }

.rechazo-notice {
  background: #FFEBEE; border-left: 3px solid #E53935;
  border-radius: 12px; padding: 12px 14px; margin-bottom: 12px;
}
.rechazo-header {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.75rem; font-weight: 800; color: #E53935; margin-bottom: 6px;
}
.rechazo-header ion-icon { font-size: 1rem; pointer-events: none; }
.rechazo-motivo {
  font-size: 0.78rem; color: #555; line-height: 1.5; margin: 0;
}

.btn-reenviar {
  flex: 1; background: #FFF8EE; border: none; border-radius: 12px;
  padding: 12px; font-size: 0.8rem; font-weight: 700; color: #E07010;
  display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer;
}
.btn-reenviar ion-icon { font-size: 1rem; pointer-events: none; }

/* Body */
.card-body { padding: 16px; }
.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.card-cat { font-size: 0.65rem; font-weight: 700; color: #F5A623; letter-spacing: 0.08em; text-transform: uppercase; }
.card-fecha { font-size: 0.65rem; color: #aaa; }
.card-nombre { font-size: 1.1rem; font-weight: 900; color: #111; margin: 0 0 14px; }

/* Precios */
.precios-row { display: flex; align-items: center; background: #F9F9F9; border-radius: 12px; padding: 12px; margin-bottom: 12px; }
.precio-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.precio-label { font-size: 0.6rem; color: #aaa; font-weight: 600; }
.precio-val { font-size: 0.9rem; font-weight: 900; color: #111; }
.precio-val.orange { color: #F5A623; }
.precio-divider { width: 1px; height: 30px; background: #eee; }

/* Fechas */
.fechas-row { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
.fecha-item { display: flex; align-items: center; gap: 10px; }
.fecha-icon { font-size: 1rem; color: #F5A623; flex-shrink: 0; }
.fecha-label { font-size: 0.6rem; color: #aaa; font-weight: 600; display: block; }
.fecha-val { font-size: 0.78rem; font-weight: 700; color: #111; }

/* Acciones */
.acciones-row { display: flex; gap: 10px; }
.btn-vendido { flex: 1; background: #E8F5E9; border: none; border-radius: 12px; padding: 12px; font-size: 0.8rem; font-weight: 700; color: #27AE60; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; }
.btn-borrar { flex: 1; background: #FFF0F0; border: none; border-radius: 12px; padding: 12px; font-size: 0.8rem; font-weight: 700; color: #E53935; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; }
.btn-vendido ion-icon, .btn-borrar ion-icon { font-size: 1rem; pointer-events: none; }

/* Bottom Nav */
.bottom-nav { position: absolute; bottom: 0; left: 0; right: 0; height: 64px; background: #fff; border-top: 1px solid #eee; display: flex; align-items: center; justify-content: space-around; z-index: 999; box-shadow: 0 -4px 20px rgba(0,0,0,0.07); }
.nav-item { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; flex: 1; height: 100%; color: #aaa; cursor: pointer; -webkit-tap-highlight-color: transparent; user-select: none; }
.nav-item ion-icon { font-size: 1.3rem; pointer-events: none; }
.nav-item span { font-size: 0.48rem; font-weight: 700; letter-spacing: 0.06em; pointer-events: none; }
.nav-item.active { color: #F5A623; }
</style>