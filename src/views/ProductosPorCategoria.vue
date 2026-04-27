<template>
  <ion-page>
    <ion-header class="cat-header">
      <ion-toolbar class="cat-toolbar">
        <ion-buttons slot="start">
          <ion-back-button text="" default-href="/categorias" class="back-btn" />
        </ion-buttons>
        <ion-title class="cat-title">{{ categoria?.nombre_categoria || 'Categoría' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="cat-content">

      <!-- Hero -->
      <div class="hero-section">
        <div class="hero-img-wrap" v-if="categoria?.foto_categoria">
          <img :src="categoria.foto_categoria" class="hero-img" @error="onImgError" />
          <div class="hero-overlay" />
        </div>
        <div class="hero-text">
          <span class="hero-badge">EXPLORAR</span>
          <h1 class="hero-title">{{ categoria?.nombre_categoria || 'Categoría' }}</h1>
          <p class="hero-sub">{{ productosDisponibles.length }} subasta{{ productosDisponibles.length !== 1 ? 's' : '' }} activa{{ productosDisponibles.length !== 1 ? 's' : '' }}</p>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-state" v-if="isLoading">
        <div class="loading-spinner" />
        <p>Cargando productos...</p>
      </div>

      <!-- Empty -->
      <div class="empty-state" v-else-if="productosDisponibles.length === 0">
        <div class="empty-icon-wrap">
          <ion-icon :icon="cubeOutline" class="empty-icon" />
        </div>
        <h3 class="empty-title">Sin productos activos</h3>
        <p class="empty-sub">No hay subastas disponibles en esta categoría por ahora.</p>
      </div>

      <!-- Grid productos -->
      <div class="productos-grid" v-else>
        <TarjetaProducto
          v-for="producto in productosDisponibles"
          :key="producto.id"
          :producto="producto"
        />
      </div>

      <div style="height: 80px" />
    </ion-content>

    <!-- Bottom Nav -->
    <div class="bottom-nav">
      <div class="nav-item" @click="navigate('/home')">
        <ion-icon :icon="homeOutline" /><span>INICIO</span>
      </div>
      <div class="nav-item active" @click="navigate('/categorias')">
        <ion-icon :icon="gridSharp" /><span>CATEGORÍAS</span>
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
  IonButtons, IonBackButton, IonIcon
} from '@ionic/vue'
import {
  cubeOutline, homeOutline, gridSharp, layersOutline,
  searchOutline, notificationsOutline, personOutline
} from 'ionicons/icons'
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TarjetaProducto from '@/components/TarjetaProducto.vue'
import { obtenerProductosPorCategoria } from '@/services/productoService'
import { obtenerCategoriaPorId } from '@/services/categoriaService'

const route = useRoute()
const router = useRouter()
const navigate = (path) => router.push(path)
const categoria = ref(null)
const productos = ref([])
const isLoading = ref(true)

const onImgError = (e) => { e.target.src = '/img/imagen-prueba.jpg' }

const productosDisponibles = computed(() => {
  const ahora = new Date()
  return productos.value.filter(p => {
    const fc = p.fechaCierre?.toDate ? p.fechaCierre.toDate() : new Date(p.fechaCierre)
    return p.estado === 'Disponible' && fc > ahora
  })
})

onMounted(async () => {
  const categoriaId = route.params.categoriaId
  try {
    categoria.value = await obtenerCategoriaPorId(categoriaId)
    productos.value = await obtenerProductosPorCategoria(categoria.value.nombre_categoria)
  } catch (e) {
    console.error('Error al obtener productos:', e)
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.cat-header { --background: #fff; border-bottom: 1px solid #eee; }
.cat-toolbar { --background: #fff; --color: #111; --min-height: 60px; padding: 0 8px; }
.cat-title { font-size: 1rem; font-weight: 800; color: #111; }
.back-btn { --color: #111; }
.cat-content { --background: #F5F5F5; }

/* Hero */
.hero-section { position: relative; height: 160px; overflow: hidden; margin-bottom: 16px; }
.hero-img-wrap { position: absolute; inset: 0; }
.hero-img { width: 100%; height: 100%; object-fit: cover; }
.hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 100%); }
.hero-text { position: absolute; bottom: 0; left: 0; right: 0; padding: 16px 20px; }
.hero-badge { display: inline-block; background: #F5A623; color: #000; font-size: 0.58rem; font-weight: 800; letter-spacing: 0.08em; padding: 2px 8px; border-radius: 4px; margin-bottom: 4px; }
.hero-title { font-size: 1.3rem; font-weight: 900; color: #fff; margin: 0 0 2px; }
.hero-sub { font-size: 0.72rem; color: rgba(255,255,255,0.7); margin: 0; }

/* No hero fallback */
.hero-section:not(:has(.hero-img-wrap)) { background: #1A1D2E; display: flex; align-items: flex-end; padding: 16px 20px; }

/* Loading / Empty */
.loading-state { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #aaa; gap: 12px; }
.loading-spinner { width: 36px; height: 36px; border: 3px solid #F5F5F5; border-top-color: #F5A623; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 30px; text-align: center; }
.empty-icon-wrap { width: 72px; height: 72px; background: #FFF3E0; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
.empty-icon { font-size: 2rem; color: #F5A623; }
.empty-title { font-size: 1rem; font-weight: 800; color: #111; margin: 0 0 6px; }
.empty-sub { font-size: 0.82rem; color: #aaa; margin: 0; line-height: 1.5; }

/* Grid */
.productos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 0 16px; }

/* Bottom Nav */
.bottom-nav { position: absolute; bottom: 0; left: 0; right: 0; height: 64px; background: #fff; border-top: 1px solid #eee; display: flex; align-items: center; justify-content: space-around; z-index: 999; box-shadow: 0 -4px 20px rgba(0,0,0,0.07); }
.nav-item { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; flex: 1; height: 100%; color: #aaa; cursor: pointer; -webkit-tap-highlight-color: transparent; user-select: none; }
.nav-item ion-icon { font-size: 1.3rem; pointer-events: none; }
.nav-item span { font-size: 0.48rem; font-weight: 700; letter-spacing: 0.06em; pointer-events: none; }
.nav-item.active { color: #F5A623; }
</style>