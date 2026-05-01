<template>
  <ion-page>
    <!-- Header moderno -->
    <ion-header class="modern-header">
      <ion-toolbar class="modern-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button class="menu-btn" />
        </ion-buttons>
        <ion-title class="page-title">INICIO</ion-title>
        <ion-buttons slot="end">
          <ion-button class="notif-btn" router-link="/Notification">
            <ion-icon :icon="notificationsOutline" class="notif-icon" />
            <span class="notif-badge" v-if="hasNotifications"></span>
          </ion-button>
          <div class="user-avatar-header" @click="goToAccount">
            <img :src="userPhoto" alt="usuario" />
          </div>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="modern-content" :fullscreen="true">

      <!-- Carrusel de productos destacados -->
      <div class="hero-carousel" v-if="productsOrdenados.length > 0">
        <div class="carousel-track" :style="{ transform: `translateX(-${carouselIndex * 100}%)` }">
          <div
            class="carousel-slide"
            v-for="product in productsOrdenados.slice(0, 5)"
            :key="'hero-' + product.id"
          >
            <img :src="getProductImage(product)" class="carousel-img" @error="onImgError" />
            <div class="carousel-overlay">
              <span class="badge-novedad" v-if="isNuevo(product)">NOVEDAD</span>
              <h2 class="carousel-title">{{ product.nombre || product.name || 'Sin nombre' }}</h2>
              <p class="carousel-price">${{ formatPrice(getPrecio(product)) }} COP</p>
            </div>
          </div>
        </div>
        <!-- Controles del carrusel -->
        <div class="carousel-controls">
          <button class="carousel-btn" @click="prevSlide">
            <ion-icon :icon="chevronBackOutline" />
          </button>
          <button class="carousel-btn" @click="nextSlide">
            <ion-icon :icon="chevronForwardOutline" />
          </button>
        </div>
        <!-- Dots -->
        <div class="carousel-dots">
          <span
            v-for="(_, i) in productsOrdenados.slice(0, 5)"
            :key="i"
            class="dot"
            :class="{ active: carouselIndex === i }"
            @click="carouselIndex = i"
          />
        </div>
      </div>

      <!-- Banner HOT: cierra pronto -->
      <div class="hot-banner" v-if="hotProduct">
        <div class="hot-left">
          <div class="hot-header">
            <ion-icon :icon="timerOutline" class="hot-clock" />
            <span class="hot-label">HOT: CIERRA PRONTO</span>
          </div>
          <h3 class="hot-title">{{ hotProduct.nombre || hotProduct.name || 'Sin nombre' }}</h3>
          <p class="hot-offer">Oferta actual: ${{ formatPrice(getPrecio(hotProduct)) }} COP</p>
        </div>
        <div class="hot-timer">
          <span class="timer-text">{{ countdown }}</span>
        </div>
        <ion-icon :icon="flashOutline" class="hot-flash" />
      </div>

      <!-- Sección: Tratos Activos -->
      <div class="section-header">
        <h2 class="section-title">Tratos Activos</h2>
        <span class="ver-todo" router-link="/home">VER TODO</span>
      </div>

      <div class="products-grid">
        <div
          class="product-card"
          v-for="product in productsOrdenados"
          :key="product.id"
          @click="goToProduct(product)"
        >
          <div class="card-image-wrap">
            <img :src="getProductImage(product)" class="card-img" :alt="product.nombre || product.name" @error="onImgError" />
            <span class="mi-pub-badge" v-if="product.userId === currentUserId">
              MÍA
            </span>
            <span class="verified-badge" v-else-if="product.verificado">
              <ion-icon :icon="checkmarkCircle" /> VERIFICADO
            </span>
          </div>
          <div class="card-body">
            <p class="seller-name">{{ maskName(product.vendedor || product.nombre || '') }} <ion-icon :icon="shieldCheckmark" class="shield-icon" /></p>
            <h3 class="card-title">{{ product.nombre || product.name || 'Sin nombre' }}</h3>
            <p class="card-price">${{ formatPrice(getPrecio(product)) }} <span class="currency">COP</span></p>
          </div>
        </div>
      </div>

      <!-- Padding para bottom nav -->
      <div style="height: 80px" />
    </ion-content>

    <!-- Bottom Navigation Bar - fuera de ion-content, dentro de ion-page -->
    <div class="bottom-nav">
      <div class="nav-item active" @click="navigate('/home')">
        <ion-icon :icon="homeSharp" />
        <span>INICIO</span>
      </div>
      <div class="nav-item" @click="navigate('/categorias')">
        <ion-icon :icon="gridOutline" />
        <span>CATEGORÍAS</span>
      </div>
      <div class="nav-item" @click="navigate('/ofertas-realizadas')">
        <ion-icon :icon="layersOutline" />
        <span>MIS TRATOS</span>
      </div>
      <div class="nav-item" @click="navigate('/explorar')">
        <ion-icon :icon="searchOutline" />
        <span>EXPLORAR</span>
      </div>
      <div class="nav-item" @click="navigate('/Notification')">
        <ion-icon :icon="notificationsOutline" />
        <span>ALERTS</span>
      </div>
      <div class="nav-item" @click="navigate('/mi-cuenta')">
        <ion-icon :icon="personOutline" />
        <span>CUENTA</span>
      </div>
    </div>
  </ion-page>
</template>

<script setup>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonMenuButton,
  IonButtons,
  IonButton,
  IonIcon,
  loadingController,
  toastController
} from '@ionic/vue'

import {
  notificationsOutline,
  chevronBackOutline,
  chevronForwardOutline,
  timerOutline,
  flashOutline,
  homeSharp,
  gridOutline,
  layersOutline,
  searchOutline,
  personOutline,
  checkmarkCircle,
  shieldCheckmark
} from 'ionicons/icons'

import { onMounted, onUnmounted, ref, computed } from 'vue'
import { collection, getDocs, onSnapshot, getFirestore, doc } from 'firebase/firestore'
import { db } from '@/firebase/FirebaseConfig'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

import { useRouter } from 'vue-router'

const router = useRouter()
const products = ref([])
const carouselIndex = ref(0)
const countdown = ref('00:00:00')
const hasNotifications = ref(false)
const userPhoto = ref('/img/User.jpg')
const currentUserId = ref(null)
let countdownInterval = null

// ── Helpers ──────────────────────────────────────────
const formatPrice = (val) => {
  if (!val) return '0'
  // Si es un objeto (map de Firestore), buscar valor numérico dentro
  if (typeof val === 'object') {
    const inner = val.valor || val.value || val.precio || Object.values(val)[0]
    return Number(inner || 0).toLocaleString('es-CO')
  }
  return Number(val).toLocaleString('es-CO')
}

// Obtiene el precio real del producto según su estructura en Firestore
const getPrecio = (product) => {
  // precioBase puede ser un map o un número
  if (product.precioBase && typeof product.precioBase === 'object') {
    return product.precioVentaInmediata || product.precioBase.valor || 0
  }
  return product.precioBase || product.precio || product.precioVentaInmediata || 0
}

const maskName = (name) => {
  if (!name) return 'Vendedor'
  const parts = name.split(' ')
  return parts.map(p => p.length > 2 ? p[0] + '***' + p[p.length - 1] + '.' : p).join(' ')
}

// Resuelve el campo de imagen — estructura real: imagenes[0].url
const getProductImage = (product) => {
  if (product.imagenes && product.imagenes.length > 0) {
    return product.imagenes[0].url || ''
  }
  return product.imagen
    || product.imageUrl
    || product.foto
    || product.imgUrl
    || product.image
    || ''
}

// Fallback si la URL falla
const onImgError = (e) => {
  e.target.src = '/img/placeholder.png'
  e.target.style.objectFit = 'contain'
  e.target.style.padding = '12px'
  e.target.style.background = '#f0f0f0'
}

const isNuevo = (product) => {
  const created = product.createdAt?.toDate ? product.createdAt.toDate() : new Date(product.createdAt)
  const diff = Date.now() - created.getTime()
  return diff < 7 * 24 * 60 * 60 * 1000 // menos de 7 días
}

// ── Usuario autenticado ───────────────────────────────
onMounted(() => {
  const auth = getAuth()
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUserId.value = user.uid
      const firestoreDb = getFirestore()
      const userRef = doc(firestoreDb, 'users', user.uid)
      onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          if (data.photoURL) {
            userPhoto.value = `${data.photoURL}?t=${Date.now()}`
          }
        }
      })
    }
  })
})

// ── Cargar productos ──────────────────────────────────
let unsubProducts = null

onMounted(async () => {
  try {
    const loading = await loadingController.create({ message: 'Cargando...', duration: 8000 })
    await loading.present()
    await loading.dismiss()

    // onSnapshot para actualización en tiempo real
    unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      products.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    })
    startCountdown()
  } catch (error) {
    console.error('Error al cargar productos:', error)
  }
})

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
  if (unsubProducts) unsubProducts()
})

// ── Productos filtrados ───────────────────────────────
const productsOrdenados = computed(() => {
  const ahora = new Date()
  return products.value
    .filter(p => {
      const fechaCierre = p.fechaCierre?.toDate
        ? p.fechaCierre.toDate()
        : new Date(p.fechaCierre)
      const estadoOk = p.estado === 'Disponible' || p.estado === 'disponible'
      return estadoOk && fechaCierre > ahora
    })
    .sort((a, b) => {
      const fa = a.fechaCierre?.toDate ? a.fechaCierre.toDate() : new Date(a.fechaCierre)
      const fb = b.fechaCierre?.toDate ? b.fechaCierre.toDate() : new Date(b.fechaCierre)
      return fa - fb
    })
})

// Producto que cierra más pronto (HOT)
const hotProduct = computed(() => productsOrdenados.value[0] || null)

// ── Countdown ─────────────────────────────────────────
const startCountdown = () => {
  const update = () => {
    if (!hotProduct.value) return
    const fc = hotProduct.value.fechaCierre?.toDate
      ? hotProduct.value.fechaCierre.toDate()
      : new Date(hotProduct.value.fechaCierre)
    const diff = fc - new Date()
    if (diff <= 0) { countdown.value = '00:00:00'; return }
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    countdown.value = [h, m, s].map(n => String(n).padStart(2, '0')).join(':')
  }
  update()
  countdownInterval = setInterval(update, 1000)
}

// ── Carousel ──────────────────────────────────────────
const nextSlide = () => {
  const max = Math.min(productsOrdenados.value.length, 5)
  carouselIndex.value = (carouselIndex.value + 1) % max
}
const prevSlide = () => {
  const max = Math.min(productsOrdenados.value.length, 5)
  carouselIndex.value = (carouselIndex.value - 1 + max) % max
}

// ── Navegación ────────────────────────────────────────
const goToProduct = (product) => {
  router.push(`/producto/${product.id}`)
}
// Navegación segura sin conflicto con Ionic
const navigate = (path) => {
  router.push(path)
}

const goToAccount = () => {
  router.push('/mi-cuenta')
}
</script>

<style scoped>
/* ── Reset & Variables ─────────────────────────────── */
:root {
  --orange: #F5A623;
  --orange-dark: #E09010;
  --green: #27AE60;
  --bg: #F5F5F5;
  --white: #FFFFFF;
  --text-dark: #111111;
  --text-muted: #888888;
  --radius: 16px;
  --shadow: 0 4px 20px rgba(0,0,0,0.08);
}

/* ── Header ────────────────────────────────────────── */
.modern-header {
  --background: #ffffff;
  border-bottom: 1px solid #eeeeee;
}

.modern-toolbar {
  --background: #ffffff;
  --color: #111111;
  --min-height: 60px;
  padding: 0 8px;
}

.page-title {
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #111111;
  text-align: center;
}

.menu-btn {
  --color: #111111;
}

.notif-btn {
  --color: #111111;
  position: relative;
}

.notif-icon {
  font-size: 1.4rem;
}

.notif-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  background: #F5A623;
  border-radius: 50%;
}

.user-avatar-header {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  margin-left: 6px;
  margin-right: 4px;
  cursor: pointer;
  border: 2px solid #F5A623;
}

.user-avatar-header img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ── Content ───────────────────────────────────────── */
.modern-content {
  --background: #F5F5F5;
}

/* ── Hero Carousel ─────────────────────────────────── */
.hero-carousel {
  position: relative;
  overflow: hidden;
  margin: 16px 16px 0;
  border-radius: 20px;
  height: 220px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}

.carousel-track {
  display: flex;
  height: 100%;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.carousel-slide {
  min-width: 100%;
  position: relative;
}

.carousel-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px 16px 16px;
  background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%);
}

.badge-novedad {
  display: inline-block;
  background: #F5A623;
  color: #000;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 2px 8px;
  border-radius: 4px;
  margin-bottom: 6px;
}

.carousel-title {
  color: #fff;
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 4px;
}

.carousel-price {
  color: rgba(255,255,255,0.85);
  font-size: 0.85rem;
  margin: 0;
}

/* Carousel controls */
.carousel-controls {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  gap: 8px;
  z-index: 10;
}

.carousel-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255,255,255,0.25);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(4px);
  font-size: 1rem;
}

.carousel-dots {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 5px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.45);
  cursor: pointer;
  transition: background 0.3s;
}

.dot.active {
  background: #F5A623;
  width: 18px;
  border-radius: 3px;
}

/* ── HOT Banner ────────────────────────────────────── */
.hot-banner {
  margin: 14px 16px 0;
  background: #F5A623;
  border-radius: 18px;
  padding: 16px 16px 16px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.hot-left {
  flex: 1;
}

.hot-header {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 4px;
}

.hot-clock {
  font-size: 0.85rem;
  color: #000;
}

.hot-label {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #000;
}

.hot-title {
  font-size: 1.25rem;
  font-weight: 900;
  color: #000;
  margin: 0 0 3px;
}

.hot-offer {
  font-size: 0.8rem;
  color: rgba(0,0,0,0.7);
  margin: 0;
}

.hot-timer {
  background: #fff;
  border-radius: 12px;
  padding: 10px 14px;
  z-index: 1;
}

.timer-text {
  font-size: 1rem;
  font-weight: 900;
  color: #111;
  letter-spacing: 0.05em;
  font-variant-numeric: tabular-nums;
}

.hot-flash {
  position: absolute;
  right: 14px;
  bottom: -4px;
  font-size: 4rem;
  color: rgba(255,255,255,0.25);
  pointer-events: none;
}

/* ── Section header ────────────────────────────────── */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px 12px;
}

.section-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #111;
  margin: 0;
}

.ver-todo {
  font-size: 0.75rem;
  font-weight: 700;
  color: #888;
  letter-spacing: 0.05em;
  cursor: pointer;
}

/* ── Products Grid ─────────────────────────────────── */
.products-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  padding: 0 16px;
}

.product-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(0,0,0,0.07);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.product-card:active {
  transform: scale(0.97);
  box-shadow: 0 1px 8px rgba(0,0,0,0.1);
}

.card-image-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f0f0f0;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mi-pub-badge {
  position: absolute; top: 8px; left: 8px;
  background: #1A1D2E; color: #F5A623;
  font-size: 0.52rem; font-weight: 800;
  letter-spacing: 0.08em; padding: 3px 8px;
  border-radius: 5px;
}

.verified-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #27AE60;
  color: #fff;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 3px 7px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 3px;
}

.card-body {
  padding: 10px 12px 12px;
}

.seller-name {
  font-size: 0.7rem;
  color: #888;
  margin: 0 0 3px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.shield-icon {
  font-size: 0.75rem;
  color: #27AE60;
}

.card-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #111;
  margin: 0 0 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-price {
  font-size: 1rem;
  font-weight: 900;
  color: #111;
  margin: 0;
}

.currency {
  font-size: 0.7rem;
  font-weight: 500;
  color: #888;
}

/* ── Bottom Navigation ─────────────────────────────── */
.bottom-nav {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: #ffffff;
  border-top: 1px solid #eeeeee;
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 999;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.07);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  flex: 1;
  height: 100%;
  color: #aaaaaa;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.nav-item ion-icon {
  font-size: 1.3rem;
  pointer-events: none;
}

.nav-item span {
  font-size: 0.48rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  pointer-events: none;
}

.nav-item.active {
  color: #F5A623;
}
</style>