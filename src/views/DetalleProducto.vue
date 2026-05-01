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
            <img :src="img.url" class="hero-img" @error="onImgError" />
          </swiper-slide>
        </swiper>
        <img v-else :src="producto.imgUrl || '/img/imagen-prueba.jpg'" class="hero-img" @error="onImgError" />

        <!-- Botón back flotante -->
        <button class="back-btn" @click="$router.back()">
          <ion-icon :icon="arrowBackOutline" />
        </button>

        <!-- Badge estado -->
        <div class="hero-badge" :class="subastaFinalizada ? 'badge-cerrada' : 'badge-activa'">
          {{ subastaFinalizada ? 'FINALIZADA' : 'EN SUBASTA' }}
        </div>
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

        <!-- Vendedor clickeable -->
        <div class="vendedor-section" @click="irAlPerfil">
          <div class="vendedor-avatar-sm">
            <img v-if="vendedor?.photoURL" :src="vendedor.photoURL" class="vend-avatar-img" />
            <span v-else>{{ getIniciales(vendedor?.name) }}</span>
          </div>
          <div class="vendedor-info-sm">
            <p class="vendedor-label-sm">PUBLICADO POR</p>
            <p class="vendedor-nombre-sm">{{ vendedor?.name || 'Vendedor' }}</p>
          </div>
          <div class="vendedor-arrow">
            <ion-icon :icon="chevronForwardOutline" />
          </div>
        </div>

        <!-- Countdown principal + Timer dinámico -->
        <div class="countdown-card" :class="{ 'timer-urgente': esUrgente }">
          <div class="cd-left">
            <ion-icon :icon="timerOutline" class="cd-icon" />
            <div>
              <p class="cd-label">CIERRA EN</p>
              <!-- Si hay ofertas mostrar timer dinámico, si no la fecha original -->
              <p class="cd-time">{{ (tieneOfertas && timerActivo) ? timerDinamico : tiempoRestante }}</p>
            </div>
          </div>

          <!-- Timer dinámico 10 min -->
          <div class="timer-box" v-if="tieneOfertas">
            <p class="timer-label">{{ subastaFinalizada ? 'CERRADA' : '⚡ CIERRA PRONTO' }}</p>
            <p class="timer-value" :class="{ 'timer-red': esUrgente }">
              {{ subastaFinalizada ? '—' : timerDinamico }}
            </p>
          </div>
          <div class="timer-box sin-ofertas" v-else>
            <p class="timer-label">SIN PUJAS AÚN</p>
            <p class="timer-hint">Timer arranca con la 1ª oferta</p>
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

        <!-- Bloqueo si es el vendedor -->
        <div class="section-card vendedor-block" v-if="esVendedor && !subastaFinalizada">
          <ion-icon :icon="lockClosedOutline" class="cerrada-icon" />
          <h3 class="cerrada-title">Esta es tu publicación</h3>
          <p class="cerrada-sub">No puedes pujar en tus propios productos.</p>
        </div>

        <!-- Hacer oferta — solo si NO es el vendedor -->
        <div class="section-card oferta-card" v-if="!subastaFinalizada && !esVendedor">
          <h3 class="section-title">Hacer una oferta</h3>

          <div class="oferta-display">
            <span class="oferta-currency">COP</span>
            <span class="oferta-value">{{ formatoMonedaInput(ofertaSugerida) }}</span>
          </div>

          <!-- Advertencia BuyNow -->
          <div class="buynow-alert" v-if="ofertaSugerida >= Number(producto.precioVentaInmediata)">
            <ion-icon :icon="flashOutline" class="buynow-icon" />
            <span>¡Esta oferta activará el <strong>Cierre Inmediato</strong> y ganarás la subasta!</span>
          </div>
          <div class="buynow-hint" v-else-if="producto.precioVentaInmediata">
            <span>Cierre inmediato a {{ formatoMoneda(producto.precioVentaInmediata) }}</span>
          </div>

          <div class="oferta-controls">
            <button class="ctrl-btn minus" type="button" @click="decrementarOferta">
              <ion-icon :icon="removeOutline" />
            </button>
            <div class="incremento-info">
              <span class="inc-label">Incremento</span>
              <span class="inc-val">{{ formatoMoneda(incremento) }}</span>
            </div>
            <button class="ctrl-btn plus" type="button" @click="incrementarOferta">
              <ion-icon :icon="addOutline" />
            </button>
          </div>

          <button class="oferta-btn" @click="CrearOferta">
            <ion-icon :icon="hammerOutline" />
            Habilitar Oferta
          </button>
        </div>

        <!-- Subasta cerrada -->
        <div class="section-card cerrada-card" v-else>
          <ion-icon :icon="lockClosedOutline" class="cerrada-icon" />
          <h3 class="cerrada-title">Subasta Finalizada</h3>
          <p class="cerrada-sub">Esta subasta ya no acepta nuevas ofertas.</p>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, getDoc, onSnapshot, collection, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase/FirebaseConfig'
import { getAuth } from 'firebase/auth'
import { actualizarProducto, actualizarCamposProducto } from '@/services/productoService'
import { IonPage, IonContent, IonIcon } from '@ionic/vue'
import {
  arrowBackOutline, timerOutline, addOutline,
  removeOutline, hammerOutline, lockClosedOutline, flashOutline,
  chevronForwardOutline
} from 'ionicons/icons'
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import 'swiper/css/pagination'
import SwiperCore from 'swiper'
import { Pagination } from 'swiper/modules'

SwiperCore.use([Pagination])

const route = useRoute()
const router = useRouter()

// ── Estado del producto ───────────────────────────────
const producto = ref(null)
const ofertaSugerida = ref(0)
const incremento = ref(100000)
const tiempoRestante = ref('')
const numeroOfertas = ref(0)

// ── Timer dinámico 10 min ─────────────────────────────
const timerDinamico = ref('10:00')
const timerActivo = ref(false)
const tieneOfertas = ref(false)
const subastaFinalizada = ref(false)
const esUrgente = ref(false)

// ── Refs para cleanup ─────────────────────────────────
let timerInterval = null
let countdownInterval = null
let unsubscribeProducto = null

// ── Vendedor ──────────────────────────────────────────
const vendedor = ref(null)

// ── Rol del usuario actual ────────────────────────────
const currentUserId = ref(null)
const esVendedor = computed(() => {
  return producto.value && currentUserId.value &&
    producto.value.userId === currentUserId.value
})

// ── Lifecycle ─────────────────────────────────────────
onMounted(() => {
  const id = route.params.id

  // Obtener usuario actual
  const auth = getAuth()
  currentUserId.value = auth.currentUser?.uid || null

  // Escuchar cambios en tiempo real
  unsubscribeProducto = onSnapshot(doc(db, 'products', id), async (docSnap) => {
    if (!docSnap.exists()) return

    const data = docSnap.data()
    producto.value = data
    ofertaSugerida.value = Number(data.precioBase || 0) + Number(incremento.value)

    // Cargar datos del vendedor si no los tenemos aún
    if (data.userId && !vendedor.value) {
      getDoc(doc(db, 'users', data.userId)).then(snap => {
        if (snap.exists()) vendedor.value = snap.data()
      }).catch(() => {})
    }
    numeroOfertas.value = data.numero_ofertas || 0
    // tieneOfertas si hay ultimaOfertaAt O si hay ofertas registradas
    tieneOfertas.value = !!data.ultimaOfertaAt || (data.numero_ofertas > 0) || data.tieneOfertas

    // Verificar si ya finalizó
    if (data.estado === 'Finalizada') {
      subastaFinalizada.value = true
      timerActivo.value = false
      timerDinamico.value = '—'
      limpiarIntervals()
      return
    }

    subastaFinalizada.value = false

    // Iniciar timer dinámico si hay ultimaOfertaAt
    if (data.ultimaOfertaAt) {
      iniciarTimerDinamico(data.ultimaOfertaAt)
    }

    // Countdown fecha cierre
    actualizarTiempoRestante()
    if (countdownInterval) clearInterval(countdownInterval)
    countdownInterval = setInterval(actualizarTiempoRestante, 1000)
  })
})

onUnmounted(() => {
  if (unsubscribeProducto) unsubscribeProducto()
  limpiarIntervals()
})

const limpiarIntervals = () => {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null }
}

// ── Timer dinámico 10 minutos ─────────────────────────
const iniciarTimerDinamico = (ultimaOfertaAt) => {
  if (timerInterval) clearInterval(timerInterval)

  timerActivo.value = true

  const calcular = () => {
    const ultima = ultimaOfertaAt?.toDate ? ultimaOfertaAt.toDate() : new Date(ultimaOfertaAt)
    const expira = new Date(ultima.getTime() + 1 * 60 * 1000) // PRUEBA: 1 min (cambiar a 10 en producción)
    const diff = expira - new Date()

    if (diff <= 0) {
      timerDinamico.value = '00:00'
      timerActivo.value = false
      esUrgente.value = false
      clearInterval(timerInterval)
      timerInterval = null
      return
    }

    const m = Math.floor(diff / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    timerDinamico.value = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    esUrgente.value = diff <= 2 * 60 * 1000 // últimos 2 minutos
  }

  calcular()
  timerInterval = setInterval(calcular, 1000)
}

// ── Countdown fecha cierre ────────────────────────────
const actualizarTiempoRestante = () => {
  if (!producto.value?.fechaCierre) return
  const fin = obtenerFecha(producto.value.fechaCierre)
  const diff = fin - new Date()
  if (diff <= 0) { tiempoRestante.value = 'Finalizada'; return }
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  tiempoRestante.value = `${d}d ${h}h ${m}m`
}

// ── Helpers ───────────────────────────────────────────
const obtenerFecha = (fecha) => {
  if (fecha?.toDate) return fecha.toDate()
  return new Date(fecha)
}

const formatoFechaSeguro = (fecha) => {
  if (!fecha) return 'No disponible'
  return obtenerFecha(fecha).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const formatoMoneda = (valor) => {
  if (!valor && valor !== 0) return '—'
  if (typeof valor === 'object') {
    const inner = valor.valor || valor.value || Object.values(valor)[0]
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(inner || 0)
  }
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor)
}

const formatoMonedaInput = (valor) => {
  if (!valor && valor !== 0) return '$0'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Number(valor))
}

const onImgError = (e) => { e.target.src = '/img/imagen-prueba.jpg' }

// ── Navegación al perfil ─────────────────────────────
const irAlPerfil = () => {
  if (producto.value?.userId) {
    router.push(`/perfil/${producto.value.userId}`)
  }
}

const getIniciales = (nombre) => {
  if (!nombre) return '?'
  return nombre.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

// ── Controles oferta ──────────────────────────────────
const incrementarOferta = () => {
  ofertaSugerida.value = Number(ofertaSugerida.value) + Number(incremento.value)
}

const decrementarOferta = () => {
  const min = Number(producto.value?.precioBase || 0)
  const nueva = Number(ofertaSugerida.value) - Number(incremento.value)
  ofertaSugerida.value = nueva > min ? nueva : min
}

// ── Crear oferta ──────────────────────────────────────
const CrearOferta = async () => {
  const auth = getAuth()
  const user = auth.currentUser
  if (!user) { alert('Debes estar autenticado para hacer una oferta.'); return }
  if (!producto.value) { alert('No se encontró el producto.'); return }
  if (producto.value.userId === user.uid) {
    alert('No puedes pujar en tu propio producto.')
    return
  }

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
    const img = producto.value?.imagenes?.[0]?.url || producto.value?.imgUrl || ''
    router.push({
      path: '/oferta-exitosa',
      query: {
        cantidad: ofertaSugerida.value,
        nombreProducto: producto.value?.nombre || '',
        imagenProducto: img,
        productoId: route.params.id
      }
    })
  } catch (error) {
    console.error('Error al registrar la oferta:', error)
    alert('Ocurrió un error al guardar la oferta.')
  }
}
</script>

<style scoped>
.detalle-content { --background: #F5F5F5; }

/* ── Hero ──────────────────────────────────────────── */
.hero-media { position: relative; width: 100%; height: 300px; background: #111; }
.hero-swiper { width: 100%; height: 100%; }
.hero-img { width: 100%; height: 100%; object-fit: cover; }
.hero-skeleton { width: 100%; height: 300px; background: #e0e0e0; overflow: hidden; }
.skeleton-shine {
  width: 100%; height: 100%;
  background: linear-gradient(90deg,#e0e0e0 25%,#f0f0f0 50%,#e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

.back-btn {
  position: absolute; top: 16px; left: 16px;
  width: 38px; height: 38px;
  background: rgba(255,255,255,0.9); border: none; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; z-index: 10;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.back-btn ion-icon { font-size: 1.1rem; color: #111; }

.hero-badge {
  position: absolute; top: 16px; right: 16px;
  font-size: 0.6rem; font-weight: 800; letter-spacing: 0.08em;
  padding: 4px 10px; border-radius: 20px; z-index: 10;
}
.badge-activa  { background: #F5A623; color: #000; }
.badge-cerrada { background: #E53935; color: #fff; }

/* ── Body ──────────────────────────────────────────── */
.body-wrap { padding: 0 0 20px; }

.title-section { background: #fff; padding: 18px 20px 16px; margin-bottom: 10px; }
.product-title { font-size: 1.3rem; font-weight: 900; color: #111; margin: 0 0 4px; }
.product-cat { font-size: 0.75rem; color: #aaa; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }

/* ── Countdown card ────────────────────────────────── */
.countdown-card {
  background: #1A1D2E;
  margin: 0 16px 10px; border-radius: 18px;
  padding: 16px 14px;
  display: flex; align-items: center;
  justify-content: space-between; gap: 8px;
  transition: background 0.3s;
}

.countdown-card.timer-urgente { background: #C0392B; animation: pulse 1s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.85} }

.cd-left { display: flex; align-items: center; gap: 10px; }
.cd-icon { font-size: 1.3rem; color: #F5A623; }
.cd-label { font-size: 0.55rem; font-weight: 700; color: #888; letter-spacing: 0.08em; margin: 0 0 2px; }
.cd-time { font-size: 0.9rem; font-weight: 900; color: #fff; margin: 0; }

/* Timer dinámico */
.timer-box {
  display: flex; flex-direction: column; align-items: center;
  background: rgba(255,255,255,0.1); border-radius: 10px;
  padding: 6px 10px; min-width: 68px; text-align: center;
}
.timer-box.sin-ofertas { min-width: 80px; }
.timer-label { font-size: 0.45rem; font-weight: 800; color: #F5A623; letter-spacing: 0.06em; margin: 0 0 2px; }
.timer-value { font-size: 1rem; font-weight: 900; color: #fff; margin: 0; font-variant-numeric: tabular-nums; }
.timer-value.timer-red { color: #FF5252; }
.timer-hint { font-size: 0.45rem; color: rgba(255,255,255,0.4); margin: 0; line-height: 1.3; }

.cd-dates { display: flex; flex-direction: column; gap: 3px; }
.cd-date-row { display: flex; gap: 4px; align-items: center; }
.cd-date-label { font-size: 0.55rem; color: #666; font-weight: 600; min-width: 40px; }
.cd-date-val { font-size: 0.58rem; color: #aaa; }

/* ── Stats ─────────────────────────────────────────── */
.stats-row {
  background: #fff; margin: 0 16px 10px; border-radius: 18px;
  padding: 16px; display: flex; align-items: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.stat-box { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; }
.stat-val { font-size: 0.85rem; font-weight: 900; color: #111; text-align: center; }
.stat-lbl { font-size: 0.5rem; font-weight: 700; color: #aaa; letter-spacing: 0.05em; text-align: center; }
.stat-box.orange .stat-val { color: #F5A623; }
.stat-divider { width: 1px; height: 32px; background: #F0F0F0; }

/* ── Cards ─────────────────────────────────────────── */
.section-card {
  background: #fff; border-radius: 18px;
  margin: 0 16px 10px; padding: 18px 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.section-title { font-size: 0.85rem; font-weight: 800; color: #111; margin: 0 0 12px; }
.desc-text { font-size: 0.85rem; color: #555; line-height: 1.6; margin: 0; }

/* ── Oferta ────────────────────────────────────────── */
.oferta-display {
  background: #F5F5F5; border-radius: 14px; padding: 16px;
  display: flex; align-items: baseline; gap: 8px; margin-bottom: 16px;
}
.oferta-currency { font-size: 0.8rem; font-weight: 700; color: #aaa; }
.oferta-value { font-size: 1.4rem; font-weight: 900; color: #111; flex: 1; }

.oferta-controls { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.ctrl-btn {
  width: 44px; height: 44px; border-radius: 50%; border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 1.2rem; flex-shrink: 0;
}
.ctrl-btn.minus { background: #F5F5F5; color: #555; }
.ctrl-btn.plus  { background: #F5A623; color: #fff; }
.incremento-info { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.inc-label { font-size: 0.62rem; color: #aaa; font-weight: 600; }
.inc-val { font-size: 0.88rem; font-weight: 800; color: #111; }

.oferta-btn {
  width: 100%; padding: 16px; background: #111; color: #fff;
  border: none; border-radius: 14px; font-size: 0.95rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  cursor: pointer;
}
.oferta-btn:active { background: #333; }
.oferta-btn ion-icon { font-size: 1.1rem; pointer-events: none; }

/* ── Vendedor ──────────────────────────────────────── */
.vendedor-section {
  background: #fff; margin: 0 16px 10px;
  border-radius: 14px; padding: 14px 16px;
  display: flex; align-items: center; gap: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  cursor: pointer; transition: background 0.15s;
}
.vendedor-section:active { background: #fafafa; }

.vendedor-avatar-sm {
  width: 42px; height: 42px;
  background: #1A1D2E; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem; font-weight: 800; color: #fff;
  flex-shrink: 0; overflow: hidden;
}
.vend-avatar-img { width: 100%; height: 100%; object-fit: cover; }

.vendedor-info-sm { flex: 1; }
.vendedor-label-sm { font-size: 0.58rem; font-weight: 700; color: #aaa; letter-spacing: 0.08em; margin: 0 0 2px; }
.vendedor-nombre-sm { font-size: 0.9rem; font-weight: 700; color: #111; margin: 0; }

.vendedor-arrow { color: #ccc; font-size: 1rem; }

/* ── BuyNow ────────────────────────────────────────── */
.buynow-alert {
  background: #FFF8EE;
  border: 1.5px solid #F5A623;
  border-radius: 12px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  font-size: 0.78rem;
  color: #111;
  line-height: 1.4;
}

.buynow-alert strong { color: #F5A623; }
.buynow-icon { font-size: 1.1rem; color: #F5A623; flex-shrink: 0; }

.buynow-hint {
  text-align: center;
  font-size: 0.7rem;
  color: #aaa;
  margin-bottom: 10px;
}

/* ── Bloque vendedor ───────────────────────────────── */
.vendedor-block {
  text-align: center;
  padding: 24px 20px;
  border: 2px dashed #F5A623;
  background: #FFFBF0;
}

/* ── Subasta cerrada ───────────────────────────────── */
.cerrada-card { text-align: center; padding: 30px 20px; }
.cerrada-icon { font-size: 2.5rem; color: #ddd; display: block; margin-bottom: 12px; }
.cerrada-title { font-size: 1rem; font-weight: 800; color: #111; margin: 0 0 6px; }
.cerrada-sub { font-size: 0.82rem; color: #aaa; margin: 0; }

/* ── Loading ───────────────────────────────────────── */
.loading-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 80px 20px; color: #aaa;
}
.loading-spinner {
  width: 36px; height: 36px;
  border: 3px solid #F5F5F5; border-top-color: #F5A623;
  border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>