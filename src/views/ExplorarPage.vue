<template>
  <ion-page>
    <!-- Header -->
    <ion-header class="explorar-header">
      <ion-toolbar class="explorar-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button class="menu-btn" />
        </ion-buttons>
        <ion-title class="page-title-text">MercaBit</ion-title>
        <ion-buttons slot="end">
          <ion-button router-link="/Notification" class="notif-btn">
            <ion-icon :icon="notificationsOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="explorar-content">

      <!-- Buscador -->
      <div class="search-wrap">
        <div class="search-box">
          <ion-icon :icon="searchOutline" class="search-icon" />
          <input
            v-model="searchQuery"
            class="search-input"
            placeholder="¿Qué estás buscando hoy?"
            @input="onSearch"
          />
          <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
            <ion-icon :icon="closeOutline" />
          </button>
        </div>
      </div>

      <!-- Chips de búsqueda rápida -->
      <div class="chips-wrap">
        <button
          v-for="chip in quickChips"
          :key="chip"
          class="chip"
          :class="{ active: searchQuery === chip }"
          @click="searchQuery = chip; onSearch()"
        >
          {{ chip }}
        </button>
      </div>

      <!-- Resultados de búsqueda (cuando hay query) -->
      <div v-if="searchQuery && searchResults.length > 0">
        <div class="section-header">
          <h2 class="section-title">Resultados</h2>
          <span class="results-count">{{ searchResults.length }} encontrados</span>
        </div>
        <div class="products-grid">
          <div
            class="product-card"
            v-for="product in searchResults"
            :key="product.id"
            @click="goToProduct(product)"
          >
            <div class="card-image-wrap">
              <img
                :src="getProductImage(product)"
                class="card-img"
                :alt="product.nombre || product.name"
                @error="onImgError"
              />
              <span class="estado-badge" :class="getEstadoClass(product.estadoProducto || product.estado2)">
                ESTADO: {{ (product.estadoProducto || product.estado2 || 'NUEVO').toUpperCase() }}
              </span>
            </div>
            <div class="card-body">
              <h3 class="card-title">{{ product.nombre || product.name }}</h3>
              <p class="card-price">COP ${{ formatPrice(getPrecio(product)) }}</p>
            </div>
            <button class="add-btn" @click.stop="goToProduct(product)">
              <ion-icon :icon="addOutline" />
            </button>
          </div>
        </div>
      </div>

      <!-- Sin resultados -->
      <div v-else-if="searchQuery && searchResults.length === 0" class="empty-state">
        <ion-icon :icon="searchOutline" class="empty-icon" />
        <p>No se encontraron productos para <strong>"{{ searchQuery }}"</strong></p>
      </div>

      <!-- Vista por defecto (sin búsqueda) -->
      <div v-else>

        <!-- Explorar Categorías -->
        <div class="section-label">EXPLORAR CATEGORÍAS</div>

        <!-- Categoría destacada (hero) -->
        <div class="cat-hero" v-if="categorias[0]" @click="goToCategoria(categorias[0])">
          <div class="cat-hero-bg" :style="{ background: categorias[0].color || '#111' }">
            <img v-if="categorias[0].imagen" :src="categorias[0].imagen" class="cat-hero-img" />
          </div>
          <div class="cat-hero-overlay">
            <h2 class="cat-hero-title">{{ categorias[0].nombre }}</h2>
            <p class="cat-hero-sub">{{ categorias[0].slogan || 'Descúbrela' }}</p>
          </div>
        </div>

        <!-- Grid de categorías secundarias -->
        <div class="cat-grid">
          <div
            class="cat-item"
            v-for="cat in categorias.slice(1, 3)"
            :key="cat.id || cat.nombre"
            @click="goToCategoria(cat)"
          >
            <div class="cat-icon-wrap">
              <ion-icon :icon="getCatIcon(cat.nombre)" />
            </div>
            <span class="cat-name">{{ cat.nombre }}</span>
          </div>
        </div>

        <!-- Categoría tipo fila (accesorios, etc.) -->
        <div
          class="cat-row-item"
          v-for="cat in categorias.slice(3, 5)"
          :key="'row-' + (cat.id || cat.nombre)"
          @click="goToCategoria(cat)"
        >
          <div class="cat-row-icon">
            <ion-icon :icon="getCatIcon(cat.nombre)" />
          </div>
          <div class="cat-row-text">
            <p class="cat-row-name">{{ cat.nombre }}</p>
            <p class="cat-row-sub">{{ cat.slogan || 'Ver productos' }}</p>
          </div>
          <ion-icon :icon="chevronForwardOutline" class="cat-row-arrow" />
        </div>

        <!-- Ofertas destacadas -->
        <div class="section-header" style="margin-top: 24px;">
          <div>
            <p class="section-overline">OFERTAS DESTACADAS</p>
            <h2 class="section-title">Visto recientemente</h2>
          </div>
          <span class="ver-todo" @click="$router.push('/home')">Ver todo</span>
        </div>

        <div class="products-grid">
          <div
            class="product-card"
            v-for="product in productosRecientes"
            :key="'rec-' + product.id"
            @click="goToProduct(product)"
          >
            <div class="card-image-wrap">
              <img
                :src="getProductImage(product)"
                class="card-img"
                :alt="product.nombre || product.name"
                @error="onImgError"
              />
              <span class="estado-badge" :class="getEstadoClass(product.estadoProducto || product.estado2)">
                ESTADO: {{ (product.estadoProducto || product.estado2 || 'NUEVO').toUpperCase() }}
              </span>
            </div>
            <div class="card-body">
              <h3 class="card-title">{{ product.nombre || product.name }}</h3>
              <p class="card-price">COP ${{ formatPrice(getPrecio(product)) }}</p>
            </div>
            <button class="add-btn" @click.stop="goToProduct(product)">
              <ion-icon :icon="addOutline" />
            </button>
          </div>
        </div>

      </div>

      <!-- Padding bottom nav -->
      <div style="height: 90px" />
    </ion-content>

    <!-- Bottom Navigation Bar -->
    <div class="bottom-nav">
      <div class="nav-item" @click="navigate('/home')">
        <ion-icon :icon="homeOutline" />
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
      <div class="nav-item active">
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
  loadingController
} from '@ionic/vue'

import {
  searchOutline,
  closeOutline,
  addOutline,
  notificationsOutline,
  homeOutline,
  gridOutline,
  layersOutline,
  personOutline,
  chevronForwardOutline,
  phonePortraitOutline,
  laptopOutline,
  gameControllerOutline,
  headsetOutline,
  tvOutline,
  watchOutline,
  cubeOutline
} from 'ionicons/icons'

import { ref, computed, onMounted } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/FirebaseConfig'
import { useRouter } from 'vue-router'

const router = useRouter()
const products = ref([])
const searchQuery = ref('')
const searchResults = ref([])

// Chips de búsqueda rápida — ajusta a tus categorías reales
const quickChips = ['PS5', 'MacBook', 'iPhone 15', 'Samsung', 'iPad', 'Nintendo']

// Categorías — si las tienes en Firestore, cárgalas; si no, usa estáticas
const categorias = ref([
  { nombre: 'Laptops', slogan: 'POTENCIA SIN LÍMITES', color: '#1a1a2e', id: 'laptops' },
  { nombre: 'Celulares', id: 'celulares' },
  { nombre: 'Consolas', id: 'consolas' },
  { nombre: 'Accesorios', slogan: 'LO ÚLTIMO EN PERIFÉRICOS', id: 'accesorios' },
  { nombre: 'Televisores', slogan: 'IMAGEN EN GRANDE', id: 'televisores' }
])

// ── Helpers ───────────────────────────────────────────
const formatPrice = (val) => {
  if (!val) return '0'
  if (typeof val === 'object') {
    const inner = val.valor || val.value || Object.values(val)[0]
    return Number(inner || 0).toLocaleString('es-CO')
  }
  return Number(val).toLocaleString('es-CO')
}

const getPrecio = (product) => {
  if (product.precioBase && typeof product.precioBase === 'object') {
    return product.precioVentaInmediata || product.precioBase.valor || 0
  }
  return product.precioBase || product.precio || product.precioVentaInmediata || 0
}

const getProductImage = (product) => {
  if (product.imagenes && product.imagenes.length > 0) {
    return product.imagenes[0].url || ''
  }
  return product.imagen || product.imageUrl || product.foto || ''
}

const onImgError = (e) => {
  e.target.src = '/img/placeholder.png'
  e.target.style.objectFit = 'contain'
  e.target.style.padding = '12px'
  e.target.style.background = '#f0f0f0'
}

const getEstadoClass = (estado) => {
  if (!estado) return 'estado-nuevo'
  const e = estado.toLowerCase()
  if (e.includes('us') || e.includes('usado')) return 'estado-usado'
  if (e.includes('ref') || e.includes('reac')) return 'estado-reac'
  return 'estado-nuevo'
}

const getCatIcon = (nombre) => {
  if (!nombre) return cubeOutline
  const n = nombre.toLowerCase()
  if (n.includes('celular') || n.includes('phone')) return phonePortraitOutline
  if (n.includes('laptop') || n.includes('mac') || n.includes('computador')) return laptopOutline
  if (n.includes('consol') || n.includes('game') || n.includes('gaming')) return gameControllerOutline
  if (n.includes('acces') || n.includes('audio') || n.includes('headset')) return headsetOutline
  if (n.includes('tv') || n.includes('televi')) return tvOutline
  if (n.includes('watch') || n.includes('reloj')) return watchOutline
  return cubeOutline
}

// ── Cargar productos ──────────────────────────────────
onMounted(async () => {
  try {
    const loading = await loadingController.create({ message: 'Cargando...', duration: 8000 })
    await loading.present()
    const snap = await getDocs(collection(db, 'products'))
    products.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    await loading.dismiss()

    // Cargar categorías con campos reales de Firestore
    try {
      const catSnap = await getDocs(collection(db, 'categorias'))
      if (!catSnap.empty) {
        categorias.value = catSnap.docs.map(doc => {
          const d = doc.data()
          return {
            id: doc.id,
            nombre: d.nombre_categoria || d.nombre || '',
            imagen: d.foto_categoria || d.imagen || '',
            slogan: d.slogan || '',
            color: d.color || '#1a1a2e'
          }
        })
      }
    } catch (e) {
      console.log('Usando categorías estáticas:', e)
    }
  } catch (error) {
    console.error('Error al cargar:', error)
  }
})

// ── Productos recientes (últimos 6 disponibles) ───────
const productosRecientes = computed(() => {
  const ahora = new Date()
  return products.value
    .filter(p => {
      const fc = p.fechaCierre?.toDate ? p.fechaCierre.toDate() : new Date(p.fechaCierre)
      return (p.estado === 'Disponible' || p.estado === 'disponible') && fc > ahora
    })
    .slice(0, 6)
})

// ── Búsqueda ──────────────────────────────────────────
const onSearch = () => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) { searchResults.value = []; return }
  searchResults.value = products.value.filter(p => {
    const nombre = (p.nombre || p.name || '').toLowerCase()
    const categoria = (p.categoria || '').toLowerCase()
    const desc = (p.descripcion || p.description || '').toLowerCase()
    return nombre.includes(q) || categoria.includes(q) || desc.includes(q)
  })
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
}

// ── Navegación ────────────────────────────────────────
const navigate = (path) => {
  router.push(path)
}

const goToProduct = (product) => {
  router.push(`/producto/${product.id}`)
}

const goToCategoria = (cat) => {
  router.push(`/categorias/${cat.id || cat.nombre}`)
}
</script>

<style scoped>
/* ── Base ──────────────────────────────────────────── */
.explorar-header {
  --background: #ffffff;
  border-bottom: 1px solid #eeeeee;
}

.explorar-toolbar {
  --background: #ffffff;
  --color: #111;
  --min-height: 60px;
  padding: 0 8px;
}

.page-title-text {
  font-size: 1.1rem;
  font-weight: 900;
  color: #111;
  letter-spacing: -0.01em;
}

.menu-btn { --color: #111; }
.notif-btn { --color: #111; }

.explorar-content {
  --background: #F5F5F5;
}

/* ── Search ────────────────────────────────────────── */
.search-wrap {
  padding: 16px 16px 8px;
}

.search-box {
  display: flex;
  align-items: center;
  background: #ffffff;
  border-radius: 14px;
  padding: 0 14px;
  height: 48px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  gap: 10px;
}

.search-icon {
  font-size: 1.1rem;
  color: #aaa;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.9rem;
  color: #111;
  font-family: inherit;
}

.search-input::placeholder { color: #bbb; }

.clear-btn {
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  padding: 0;
  font-size: 1rem;
  display: flex;
  align-items: center;
}

/* ── Chips ─────────────────────────────────────────── */
.chips-wrap {
  display: flex;
  gap: 8px;
  padding: 4px 16px 16px;
  overflow-x: auto;
  scrollbar-width: none;
}

.chips-wrap::-webkit-scrollbar { display: none; }

.chip {
  flex-shrink: 0;
  background: #ffffff;
  border: 1.5px solid #e8e8e8;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #444;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.chip.active,
.chip:active {
  background: #F5A623;
  border-color: #F5A623;
  color: #000;
}

/* ── Section label ─────────────────────────────────── */
.section-label {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #999;
  padding: 0 16px 10px;
}

.section-overline {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #999;
  margin: 0 0 2px;
}

.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 16px 12px;
}

.section-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #111;
  margin: 0;
}

.results-count {
  font-size: 0.75rem;
  color: #999;
  font-weight: 600;
}

.ver-todo {
  font-size: 0.78rem;
  font-weight: 700;
  color: #555;
  cursor: pointer;
}

/* ── Category Hero ─────────────────────────────────── */
.cat-hero {
  margin: 0 16px 12px;
  border-radius: 18px;
  overflow: hidden;
  height: 150px;
  position: relative;
  cursor: pointer;
}

.cat-hero-bg {
  width: 100%;
  height: 100%;
  position: relative;
}

.cat-hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.6;
}

.cat-hero-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 20px;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
}

.cat-hero-title {
  color: #fff;
  font-size: 1.3rem;
  font-weight: 900;
  margin: 0 0 2px;
}

.cat-hero-sub {
  color: rgba(255,255,255,0.7);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  margin: 0;
}

/* ── Category Grid (2 columnas) ────────────────────── */
.cat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 0 16px 10px;
}

.cat-item {
  background: #fff;
  border-radius: 16px;
  padding: 20px 12px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  transition: transform 0.2s;
}

.cat-item:active { transform: scale(0.96); }

.cat-icon-wrap {
  width: 52px;
  height: 52px;
  background: #F5F5F5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  color: #333;
}

.cat-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: #111;
}

/* ── Category Row ──────────────────────────────────── */
.cat-row-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: #fff;
  margin: 0 16px 8px;
  border-radius: 14px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.cat-row-icon {
  width: 44px;
  height: 44px;
  background: #F5F5F5;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #333;
  flex-shrink: 0;
}

.cat-row-text {
  flex: 1;
}

.cat-row-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: #111;
  margin: 0 0 2px;
}

.cat-row-sub {
  font-size: 0.68rem;
  color: #aaa;
  font-weight: 600;
  letter-spacing: 0.05em;
  margin: 0;
}

.cat-row-arrow {
  color: #ccc;
  font-size: 1rem;
}

/* ── Products Grid ─────────────────────────────────── */
.products-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 0 16px;
}

.product-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  cursor: pointer;
  position: relative;
  transition: transform 0.2s;
}

.product-card:active { transform: scale(0.97); }

.card-image-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  background: #f0f0f0;
  overflow: hidden;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Badge estado (NUEVO / USADO) */
.estado-badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
  font-size: 0.55rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  padding: 3px 7px;
  border-radius: 5px;
}

.estado-nuevo  { background: #E8F5E9; color: #27AE60; }
.estado-usado  { background: #FFF3E0; color: #E07010; }
.estado-reac   { background: #E3F2FD; color: #1565C0; }

.card-body {
  padding: 10px 10px 36px;
}

.card-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #111;
  margin: 0 0 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-price {
  font-size: 0.88rem;
  font-weight: 900;
  color: #111;
  margin: 0;
}

/* Botón + */
.add-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #111;
  border: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
}

/* ── Empty state ───────────────────────────────────── */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #aaa;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 12px;
  display: block;
}

.empty-state p {
  font-size: 0.9rem;
  color: #888;
}

/* ── Bottom Nav ────────────────────────────────────── */
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

.nav-item.active { color: #F5A623; }
</style>