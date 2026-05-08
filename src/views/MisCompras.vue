<template>
  <ion-page>
    <ion-header class="compras-header">
      <ion-toolbar class="compras-toolbar">
        <ion-buttons slot="start">
          <ion-back-button text="" default-href="/home" class="back-btn" />
        </ion-buttons>
        <ion-title class="compras-title">MercaBit</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="compras-content">

      <!-- Hero -->
      <div class="hero-section">
        <h1 class="hero-title">Mis Compras</h1>
        <p class="hero-sub">Gestiona y rastrea tus pedidos activos</p>
      </div>

      <!-- Empty state -->
      <div class="empty-state" v-if="compras.length === 0 && !loading">
        <div class="empty-icon-wrap">
          <ion-icon :icon="bagOutline" class="empty-icon" />
        </div>
        <h3 class="empty-title">Sin compras aún</h3>
        <p class="empty-sub">Cuando ganes una subasta, tus compras aparecerán aquí.</p>
        <button class="explore-btn" @click="navigate('/explorar')">Explorar productos</button>
      </div>

      <!-- Loading -->
      <div class="loading-state" v-if="loading">
        <div class="loading-spinner" />
      </div>

      <!-- Compra activa (la más reciente) -->
      <div v-if="compraActiva && !loading">
        <div class="compra-activa-card">
          <div class="estado-badge" :class="getEstadoClass(compraActiva.estado)">
            {{ (compraActiva.estado || 'EN PROCESO').toUpperCase() }}
          </div>
          <div class="card-row">
            <div class="card-img-wrap">
              <img :src="compraActiva.imagen || '/img/imagen-prueba.jpg'" class="card-img" @error="onImgError" />
            </div>
            <div class="card-info">
              <span class="card-cat">{{ compraActiva.categoria || 'PRODUCTO' }}</span>
              <h2 class="card-nombre">{{ compraActiva.nombreProducto }}</h2>
              <p class="card-desc">{{ compraActiva.descripcion || '' }}</p>
              <p class="card-precio">${{ formatPrice(compraActiva.precioTotal) }} <span class="cop">COP</span></p>
            </div>
          </div>

          <!-- Botón calificar si ya fue entregado -->
          <div class="calificar-wrap" v-if="esEntregado(compraActiva.estado)">
            <button class="calificar-btn-full" @click="navigate(`/add-calification/${compraActiva.id}`)">
              ⭐ Calificar al vendedor
            </button>
          </div>

          <!-- Rastreo -->
          <div class="tracking-section">
            <div class="tracking-header">
              <span class="tracking-label">RASTREO DE PEDIDO</span>
              <span class="tracking-id">#MB-{{ compraActiva.id?.slice(-7).toUpperCase() }}</span>
            </div>
            <div class="tracking-steps">
              <div
                v-for="(step, i) in trackingSteps"
                :key="i"
                class="step-wrap"
              >
                <div class="step-circle" :class="{ done: i <= getStepIndex(compraActiva.estado), active: i === getStepIndex(compraActiva.estado) }">
                  <ion-icon v-if="i < getStepIndex(compraActiva.estado)" :icon="checkmarkOutline" />
                  <ion-icon v-else-if="i === getStepIndex(compraActiva.estado)" :icon="step.icon" />
                </div>
                <span class="step-label" :class="{ done: i <= getStepIndex(compraActiva.estado) }">{{ step.label }}</span>
                <div v-if="i < trackingSteps.length - 1" class="step-line" :class="{ done: i < getStepIndex(compraActiva.estado) }" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Historial -->
      <div v-if="historial.length > 0 && !loading">
        <div class="section-header">
          <h2 class="section-title">Historial</h2>
          <span class="filtrar-btn">FILTRAR <ion-icon :icon="optionsOutline" /></span>
        </div>

        <div class="historial-list">
          <div class="historial-item" v-for="compra in historial" :key="compra.id">
            <div class="hist-img-wrap" @click="navigate(`/producto/${compra.productoId}`)">
              <img :src="compra.imagen || '/img/imagen-prueba.jpg'" class="hist-img" @error="onImgError" />
            </div>
            <div class="hist-info" @click="navigate(`/producto/${compra.productoId}`)">
              <h3 class="hist-nombre">{{ compra.nombreProducto }}</h3>
              <p class="hist-fecha">ENTREGADO EL {{ formatFecha(compra.fechaCompra) }}</p>
              <p class="hist-precio">${{ formatPrice(compra.precioTotal) }} <span class="cop">COP</span></p>
            </div>
            <div class="hist-right">
              <span class="hist-estado">ENTREGADO</span>
              <button class="calificar-btn" @click="navigate(`/add-calification/${compra.id}`)">
                ⭐ Calificar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Soporte -->
      <div class="soporte-card" v-if="!loading">
        <div class="soporte-left">
          <h3 class="soporte-title">¿Problemas con tu pedido?</h3>
          <p class="soporte-sub">Nuestro equipo de soporte está disponible 24/7 para ayudarte con garantías y devoluciones.</p>
          <button class="soporte-btn" @click="navigate('/soporte')">CONTACTAR SOPORTE</button>
        </div>
        <div class="soporte-circle" />
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
      <div class="nav-item active" @click="navigate('/Miscompras')">
        <ion-icon :icon="layersSharp" /><span>MIS TRATOS</span>
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
  IonButtons, IonBackButton, IonIcon
} from '@ionic/vue'
import {
  bagOutline, checkmarkOutline, optionsOutline,
  cubeOutline, bicycleOutline, homeOutline,
  gridOutline, layersSharp, searchOutline,
  notificationsOutline, personOutline
} from 'ionicons/icons'
import { ref, computed, onMounted } from 'vue'
import { db } from '../firebase/FirebaseConfig'
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const navigate = (path) => router.push(path)
const compras = ref([])
const loading = ref(true)

const trackingSteps = [
  { label: 'PREPARANDO', icon: cubeOutline },
  { label: 'EN CAMINO',  icon: bicycleOutline },
  { label: 'ENTREGADO',  icon: checkmarkOutline }
]

// PREPARANDO  = ganaste la subasta        (estado: 'En proceso')
// EN CAMINO   = pago procesado            (estado: 'pagado')
// ENTREGADO   = vendedor marcó vendido    (estado: 'Vendido')
const getStepIndex = (estado) => {
  if (!estado) return 0
  const e = estado.toLowerCase()
  if (e.includes('vendido') || e.includes('entreg')) return 2
  if (e.includes('pagado') || e.includes('camino')) return 1
  return 0
}

const getEstadoClass = (estado) => {
  if (!estado) return 'estado-proceso'
  const e = estado.toLowerCase()
  if (e.includes('vendido') || e.includes('entreg')) return 'estado-entregado'
  if (e.includes('pagado') || e.includes('camino')) return 'estado-camino'
  return 'estado-proceso'
}

// La compra más reciente va arriba como "activa"
const esEntregado = (estado) => {
  const e = (estado || '').toLowerCase()
  return e.includes('vendido') || e.includes('entreg')
}

const compraActiva = computed(() =>
  compras.value.find(c => !esEntregado(c.estado)) || compras.value[0] || null
)
const historial = computed(() =>
  compras.value.filter(c => esEntregado(c.estado))
)

const formatPrice = (val) => {
  if (!val) return '0'
  return Number(val).toLocaleString('es-CO')
}

const formatFecha = (ts) => {
  if (!ts) return ''
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }).toUpperCase()
}

const onImgError = (e) => { e.target.src = '/img/imagen-prueba.jpg' }

const obtenerNombreProducto = async (productoId) => {
  if (!productoId) return 'Producto'
  const snap = await getDoc(doc(db, 'products', productoId))
  return snap.exists() ? snap.data().nombre || 'Sin nombre' : 'Producto'
}

const obtenerImagenProducto = async (productoId) => {
  if (!productoId) return ''
  const snap = await getDoc(doc(db, 'products', productoId))
  if (snap.exists()) {
    const d = snap.data()
    return d.imagenes?.[0]?.url || d.imgUrl || ''
  }
  return ''
}

onMounted(() => {
  const auth = getAuth()
  const user = auth.currentUser
  if (!user) { loading.value = false; return }

  const q = query(collection(db, 'compras'), where('userId', '==', user.uid))
  onSnapshot(q, async (snapshot) => {
    const result = await Promise.all(snapshot.docs.map(async (d) => {
      const data = d.data()
      const nombreProducto = await obtenerNombreProducto(data.productoId)
      const imagen = await obtenerImagenProducto(data.productoId)
      return { id: d.id, ...data, nombreProducto, imagen }
    }))
    compras.value = result.sort((a, b) => (b.fechaCompra?.seconds || 0) - (a.fechaCompra?.seconds || 0))
    loading.value = false
  })
})
</script>

<style scoped>
.compras-header { --background: #fff; border-bottom: 1px solid #eee; }
.compras-toolbar { --background: #fff; --color: #111; --min-height: 60px; padding: 0 8px; }
.compras-title { font-size: 1.05rem; font-weight: 900; color: #111; }
.back-btn { --color: #111; }
.compras-content { --background: #F5F5F5; }

.hero-section { background: #fff; padding: 20px 20px 18px; margin-bottom: 10px; }
.hero-title { font-size: 1.6rem; font-weight: 900; color: #111; margin: 0 0 4px; }
.hero-sub { font-size: 0.82rem; color: #aaa; margin: 0; }

/* Empty */
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 30px; text-align: center; }
.empty-icon-wrap { width: 72px; height: 72px; background: #FFF3E0; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
.empty-icon { font-size: 2rem; color: #F5A623; }
.empty-title { font-size: 1rem; font-weight: 800; color: #111; margin: 0 0 6px; }
.empty-sub { font-size: 0.82rem; color: #aaa; margin: 0 0 20px; }
.explore-btn { background: #F5A623; border: none; border-radius: 20px; padding: 10px 24px; font-size: 0.85rem; font-weight: 700; cursor: pointer; }

/* Loading */
.loading-state { display: flex; justify-content: center; padding: 60px; }
.loading-spinner { width: 36px; height: 36px; border: 3px solid #F5F5F5; border-top-color: #F5A623; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Compra activa */
.compra-activa-card { background: #fff; margin: 0 16px 10px; border-radius: 20px; padding: 16px; box-shadow: 0 2px 14px rgba(0,0,0,0.07); position: relative; overflow: hidden; }
.estado-badge { position: absolute; top: 14px; right: 14px; background: #111; color: #fff; font-size: 0.6rem; font-weight: 800; letter-spacing: 0.06em; padding: 4px 10px; border-radius: 20px; }
.estado-entregado { background: #27AE60; }
.estado-camino { background: #F5A623; color: #000; }
.estado-proceso { background: #4A90D9; }

.card-row { display: flex; gap: 12px; margin-bottom: 16px; }
.card-img-wrap { width: 80px; height: 80px; border-radius: 12px; overflow: hidden; background: #f0f0f0; flex-shrink: 0; }
.card-img { width: 100%; height: 100%; object-fit: cover; }
.card-info { flex: 1; }
.card-cat { font-size: 0.6rem; font-weight: 700; color: #F5A623; letter-spacing: 0.08em; }
.card-nombre { font-size: 0.95rem; font-weight: 800; color: #111; margin: 2px 0 4px; }
.card-desc { font-size: 0.72rem; color: #aaa; margin: 0 0 6px; }
.card-precio { font-size: 1rem; font-weight: 900; color: #111; margin: 0; }
.cop { font-size: 0.65rem; color: #aaa; font-weight: 500; }

/* Tracking */
.tracking-section { background: #F9F9F9; border-radius: 14px; padding: 14px; }
.tracking-header { display: flex; justify-content: space-between; margin-bottom: 16px; }
.tracking-label { font-size: 0.6rem; font-weight: 700; color: #aaa; letter-spacing: 0.08em; }
.tracking-id { font-size: 0.65rem; font-weight: 700; color: #111; }
.tracking-steps { display: flex; align-items: flex-start; position: relative; }
.step-wrap { display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; }
.step-circle { width: 28px; height: 28px; border-radius: 50%; background: #e0e0e0; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: #fff; z-index: 1; }
.step-circle.done { background: #27AE60; }
.step-circle.active { background: #F5A623; }
.step-label { font-size: 0.48rem; font-weight: 700; color: #ccc; margin-top: 4px; text-align: center; letter-spacing: 0.04em; }
.step-label.done { color: #27AE60; }
.step-line { position: absolute; top: 14px; left: 50%; width: 100%; height: 2px; background: #e0e0e0; z-index: 0; }
.step-line.done { background: #27AE60; }

/* Historial */
.section-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px 10px; }
.section-title { font-size: 1.1rem; font-weight: 900; color: #111; margin: 0; }
.filtrar-btn { font-size: 0.7rem; font-weight: 700; color: #aaa; display: flex; align-items: center; gap: 4px; cursor: pointer; }

.historial-list { display: flex; flex-direction: column; gap: 2px; margin: 0 16px; }
.historial-item { background: #fff; border-radius: 14px; padding: 14px; display: flex; align-items: center; gap: 12px; cursor: pointer; }
.hist-img-wrap { width: 56px; height: 56px; border-radius: 10px; overflow: hidden; background: #f0f0f0; flex-shrink: 0; }
.hist-img { width: 100%; height: 100%; object-fit: cover; }
.hist-info { flex: 1; }
.hist-nombre { font-size: 0.88rem; font-weight: 700; color: #111; margin: 0 0 2px; }
.hist-fecha { font-size: 0.62rem; color: #aaa; margin: 0 0 4px; }
.hist-precio { font-size: 0.88rem; font-weight: 800; color: #111; margin: 0; }
.hist-estado { font-size: 0.6rem; font-weight: 800; color: #27AE60; letter-spacing: 0.06em; flex-shrink: 0; }

/* Soporte */
.soporte-card { background: #111; border-radius: 20px; margin: 16px 16px 0; padding: 24px 20px; position: relative; overflow: hidden; }
.soporte-title { font-size: 1.2rem; font-weight: 900; color: #fff; margin: 0 0 8px; }
.soporte-sub { font-size: 0.78rem; color: #aaa; line-height: 1.5; margin: 0 0 16px; }
.soporte-btn { background: #F5A623; border: none; border-radius: 20px; padding: 10px 20px; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.08em; cursor: pointer; color: #000; }
.soporte-circle { position: absolute; right: -30px; bottom: -30px; width: 120px; height: 120px; border-radius: 50%; background: rgba(255,255,255,0.05); }

/* Bottom Nav */
.bottom-nav { position: absolute; bottom: 0; left: 0; right: 0; height: 64px; background: #fff; border-top: 1px solid #eee; display: flex; align-items: center; justify-content: space-around; z-index: 999; box-shadow: 0 -4px 20px rgba(0,0,0,0.07); }
.nav-item { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; flex: 1; height: 100%; color: #aaa; cursor: pointer; -webkit-tap-highlight-color: transparent; user-select: none; }
.nav-item ion-icon { font-size: 1.3rem; pointer-events: none; }
.nav-item span { font-size: 0.48rem; font-weight: 700; letter-spacing: 0.06em; pointer-events: none; }
.nav-item.active { color: #F5A623; }
</style>