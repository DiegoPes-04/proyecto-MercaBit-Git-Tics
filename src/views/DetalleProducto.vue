<template>
  <ion-page>
    <ion-content class="detalle-content" :scroll-events="true">

      <!-- Imagen / Swiper hero -->
      <div class="hero-media" v-if="producto">
        <swiper
          v-if="producto.imagenes && producto.imagenes.length"
          :slides-per-view="1"
          :space-between="0"
          :pagination="{ clickable: true }"
          :loop="true"
          class="hero-swiper"
        >
          <swiper-slide v-for="(img, i) in producto.imagenes" :key="i">
            <img :src="img.url" class="hero-img" />
          </swiper-slide>
        </swiper>
        <img v-else :src="producto.imgUrl || '/img/imagen-prueba.jpg'" class="hero-img" />

        <!-- Botón back flotante -->
        <button class="back-btn" @click="$router.back()">
          <ion-icon :icon="arrowBackOutline" />
        </button>

        <!-- Badge estado -->
        <div class="hero-badge">EN SUBASTA</div>
      </div>

      <!-- Skeleton si carga -->
      <div class="hero-skeleton" v-else>
        <div class="skeleton-shine" />
      </div>

      <div class="body-wrap" v-if="producto">

        <!-- Título y categoría -->
        <div class="title-section">
          <h1 class="product-title">{{ producto.nombre }}</h1>
          <span class="product-cat">{{ producto.categoria || 'Sin categoría' }}</span>
        </div>

        <!-- Countdown HOT -->
        <div class="countdown-card">
          <div class="cd-left">
            <ion-icon :icon="timerOutline" class="cd-icon" />
            <div>
              <p class="cd-label">CIERRA EN</p>
              <p class="cd-time">{{ tiempoRestante }}</p>
            </div>
          </div>
          <div class="cd-dates">
            <div class="cd-date-row">
              <span class="cd-date-label">Apertura</span>
              <span class="cd-date-val">{{ formatoFechaSeguro(producto.fechaApertura) }}</span>
            </div>
            <div class="cd-date-row">
              <span class="cd-date-label">Cierre</span>
              <span class="cd-date-val">{{ formatoFechaSeguro(producto.fechaCierre) }}</span>
            </div>
          </div>
        </div>

        <!-- Stats row -->
        <div class="stats-row">
          <div class="stat-box">
            <span class="stat-val">{{ numeroOfertas }}</span>
            <span class="stat-lbl">OFERTAS</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-box">
            <span class="stat-val">{{ formatoMoneda(producto.precioBase) }}</span>
            <span class="stat-lbl">OFERTA ACTUAL</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-box orange">
            <span class="stat-val">{{ formatoMoneda(producto.precioVentaInmediata) }}</span>
            <span class="stat-lbl">CIERRE INMEDIATO</span>
          </div>
        </div>

        <!-- Descripción -->
        <div class="section-card">
          <h3 class="section-title">Descripción</h3>
          <p class="desc-text">{{ producto.descripcion || 'Sin descripción.' }}</p>
        </div>

        <!-- Hacer oferta -->
        <div class="section-card oferta-card">
          <h3 class="section-title">Hacer una oferta</h3>

          <div class="oferta-display">
            <span class="oferta-currency">COP</span>
            <span class="oferta-value">{{ formatoMonedaInput(ofertaSugerida) }}</span>
          </div>

          <div class="oferta-controls">
            <button class="ctrl-btn minus" @click="decrementarOferta">
              <ion-icon :icon="removeOutline" />
            </button>
            <div class="incremento-info">
              <span class="inc-label">Incremento</span>
              <span class="inc-val">{{ formatoMoneda(incremento) }}</span>
            </div>
            <button class="ctrl-btn plus" @click="incrementarOferta">
              <ion-icon :icon="addOutline" />
            </button>
          </div>

          <button class="oferta-btn" @click="CrearOferta">
            <ion-icon :icon="hammerOutline" />
            Habilitar Oferta
          </button>
        </div>

        <div style="height: 30px" />
      </div>

      <!-- Loading state -->
      <div class="loading-state" v-if="!producto">
        <div class="loading-spinner" />
        <p>Cargando producto...</p>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import { doc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase/FirebaseConfig'
import { getAuth } from 'firebase/auth'
import { actualizarProducto, actualizarCamposProducto } from '@/services/productoService'
import { IonPage, IonContent, IonIcon } from '@ionic/vue'
import {
  arrowBackOutline, timerOutline, addOutline,
  removeOutline, hammerOutline
} from 'ionicons/icons'
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import 'swiper/css/pagination'
import SwiperCore from 'swiper'
import { Pagination } from 'swiper/modules'

SwiperCore.use([Pagination])

const route = useRoute()
const router = useRouter()
const producto = ref(null)
const ofertaSugerida = ref(0)
const incremento = ref(100000)
const tiempoRestante = ref('')
const numeroOfertas = ref(0)

onMounted(async () => {
  const id = route.params.id
  const docSnap = await getDoc(doc(db, 'products', id))
  if (docSnap.exists()) {
    producto.value = docSnap.data()
    ofertaSugerida.value = Number(producto.value.precioBase || 0) + Number(incremento.value)
    actualizarTiempoRestante()
    setInterval(actualizarTiempoRestante, 60000)
    numeroOfertas.value = await obtenerNumeroDeOfertas(id)
  }
})

function incrementarOferta() {
  ofertaSugerida.value = Number(ofertaSugerida.value) + Number(incremento.value)
}

function decrementarOferta() {
  const min = Number(producto.value?.precioBase || 0)
  const nueva = Number(ofertaSugerida.value) - Number(incremento.value)
  ofertaSugerida.value = nueva > min ? nueva : min
}

function obtenerFecha(fecha) {
  if (fecha?.toDate) return fecha.toDate()
  return new Date(fecha)
}

function formatoFechaSeguro(fecha) {
  if (!fecha) return 'No disponible'
  return obtenerFecha(fecha).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function formatoMoneda(valor) {
  if (!valor && valor !== 0) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(valor)
}

function formatoMonedaInput(valor) {
  if (!valor && valor !== 0) return '$0'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(Number(valor))
}

function actualizarTiempoRestante() {
  if (!producto.value?.fechaCierre) return
  const fin = obtenerFecha(producto.value.fechaCierre)
  const diff = fin - new Date()
  if (diff <= 0) { tiempoRestante.value = 'Finalizada'; return }
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  tiempoRestante.value = `${d}d ${h}h ${m}m`
}

async function CrearOferta() {
  const auth = getAuth()
  const user = auth.currentUser
  if (!user) { alert('Debes estar autenticado para hacer una oferta.'); return }
  if (!producto.value) { alert('No se encontró el producto.'); return }
  try {
    await addDoc(collection(db, 'ofertas'), {
      producto_id: route.params.id,
      usuario_id: user.uid,
      cantidad: ofertaSugerida.value,
      fecha_hora: Timestamp.now(),
      estado: 'activa',
      es_mas_alta: false
    })
    await actualizarProducto(route.params.id, ofertaSugerida.value)
    const docSnap = await getDoc(doc(db, 'products', route.params.id))
    if (docSnap.exists()) {
      const actual = parseInt(docSnap.data().numero_ofertas || 0)
      await actualizarCamposProducto(route.params.id, { numero_ofertas: actual + 1 })
      numeroOfertas.value = actual + 1
    }
    // Redirigir a pantalla de confirmación
    const img = producto.value?.imagenes?.[0]?.url
      || producto.value?.imgUrl
      || ''
    router.push({
      path: '/oferta-exitosa',
      query: {
        cantidad:       ofertaSugerida.value,
        nombreProducto: producto.value?.nombre || '',
        imagenProducto: img,
        productoId:     route.params.id
      }
    })
  } catch (error) {
    console.error('Error al registrar la oferta:', error)
    alert('Ocurrió un error al guardar la oferta.')
  }
}

async function obtenerNumeroDeOfertas(productoId) {
  const snap = await getDoc(doc(db, 'products', productoId))
  return snap.exists() ? snap.data().numero_ofertas || 0 : 0
}
</script>

<style scoped>
.detalle-content { --background: #F5F5F5; }

/* ── Hero media ────────────────────────────────────── */
.hero-media {
  position: relative;
  width: 100%;
  height: 300px;
  background: #111;
}

.hero-swiper { width: 100%; height: 100%; }

.hero-img {
  width: 100%; height: 100%;
  object-fit: cover;
}

.hero-skeleton {
  width: 100%; height: 300px;
  background: #e0e0e0; overflow: hidden;
}
.skeleton-shine {
  width: 100%; height: 100%;
  background: linear-gradient(90deg,#e0e0e0 25%,#f0f0f0 50%,#e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* Back button flotante */
.back-btn {
  position: absolute; top: 16px; left: 16px;
  width: 38px; height: 38px;
  background: rgba(255,255,255,0.9);
  border: none; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; z-index: 10;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.back-btn ion-icon { font-size: 1.1rem; color: #111; }

.hero-badge {
  position: absolute; top: 16px; right: 16px;
  background: #F5A623; color: #000;
  font-size: 0.6rem; font-weight: 800;
  letter-spacing: 0.08em;
  padding: 4px 10px; border-radius: 20px;
  z-index: 10;
}

/* ── Body ──────────────────────────────────────────── */
.body-wrap { padding: 0 0 20px; }

.title-section {
  background: #fff;
  padding: 18px 20px 16px;
  margin-bottom: 10px;
}
.product-title {
  font-size: 1.3rem; font-weight: 900; color: #111;
  margin: 0 0 4px;
}
.product-cat {
  font-size: 0.75rem; color: #aaa; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.06em;
}

/* ── Countdown ─────────────────────────────────────── */
.countdown-card {
  background: #1A1D2E;
  margin: 0 16px 10px;
  border-radius: 18px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.cd-left {
  display: flex; align-items: center; gap: 10px;
}
.cd-icon { font-size: 1.3rem; color: #F5A623; }
.cd-label { font-size: 0.6rem; font-weight: 700; color: #888; letter-spacing: 0.08em; margin: 0 0 2px; }
.cd-time { font-size: 1rem; font-weight: 900; color: #fff; margin: 0; }

.cd-dates { display: flex; flex-direction: column; gap: 4px; }
.cd-date-row { display: flex; gap: 6px; align-items: center; }
.cd-date-label { font-size: 0.6rem; color: #666; font-weight: 600; min-width: 44px; }
.cd-date-val { font-size: 0.65rem; color: #aaa; }

/* ── Stats ─────────────────────────────────────────── */
.stats-row {
  background: #fff;
  margin: 0 16px 10px;
  border-radius: 18px;
  padding: 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.stat-box {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; gap: 3px;
}
.stat-val { font-size: 0.85rem; font-weight: 900; color: #111; text-align: center; }
.stat-lbl { font-size: 0.5rem; font-weight: 700; color: #aaa; letter-spacing: 0.05em; text-align: center; }
.stat-box.orange .stat-val { color: #F5A623; }
.stat-divider { width: 1px; height: 32px; background: #F0F0F0; }

/* ── Cards ─────────────────────────────────────────── */
.section-card {
  background: #fff;
  border-radius: 18px;
  margin: 0 16px 10px;
  padding: 18px 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.section-title {
  font-size: 0.85rem; font-weight: 800; color: #111;
  margin: 0 0 12px;
}
.desc-text {
  font-size: 0.85rem; color: #555;
  line-height: 1.6; margin: 0;
}

/* ── Oferta ────────────────────────────────────────── */
.oferta-card { }

.oferta-display {
  background: #F5F5F5;
  border-radius: 14px;
  padding: 16px;
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
}
.oferta-currency { font-size: 0.8rem; font-weight: 700; color: #aaa; }
.oferta-value { font-size: 1.4rem; font-weight: 900; color: #111; flex: 1; }

.oferta-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.ctrl-btn {
  width: 44px; height: 44px;
  border-radius: 50%; border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 1.2rem;
  flex-shrink: 0;
}
.ctrl-btn.minus { background: #F5F5F5; color: #555; }
.ctrl-btn.plus  { background: #F5A623; color: #fff; }

.incremento-info {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; gap: 2px;
}
.inc-label { font-size: 0.62rem; color: #aaa; font-weight: 600; }
.inc-val { font-size: 0.88rem; font-weight: 800; color: #111; }

.oferta-btn {
  width: 100%; padding: 16px;
  background: #111; color: #fff;
  border: none; border-radius: 14px;
  font-size: 0.95rem; font-weight: 800;
  display: flex; align-items: center;
  justify-content: center; gap: 8px;
  cursor: pointer; letter-spacing: 0.02em;
  transition: background 0.2s;
}
.oferta-btn:active { background: #333; }
.oferta-btn ion-icon { font-size: 1.1rem; }

/* ── Loading ───────────────────────────────────────── */
.loading-state {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 80px 20px; color: #aaa;
}
.loading-spinner {
  width: 36px; height: 36px;
  border: 3px solid #F5F5F5;
  border-top-color: #F5A623;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>