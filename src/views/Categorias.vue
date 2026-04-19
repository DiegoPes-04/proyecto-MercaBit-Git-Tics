<template>
  <ion-page>
    <!-- Header moderno -->
    <ion-header class="cat-header">
      <ion-toolbar class="cat-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button class="menu-btn" />
        </ion-buttons>
        <ion-title class="cat-title">MercaBit</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="cat-content">

      <!-- Hero title -->
      <div class="hero-section">
        <span class="hero-badge">EXPLORAR BAZAR</span>
        <h1 class="hero-title">Categorías de<br /><span class="hero-accent">MercaBit</span></h1>
        <div class="hero-line" />
      </div>

      <!-- Grid de categorías -->
      <div class="cat-grid" v-if="categorias.length > 0">
        <TarjetaCategoria
          v-for="categoria in categorias"
          :key="categoria.id"
          :categoria="categoria"
        />
      </div>

      <!-- Skeleton loader -->
      <div class="cat-grid" v-else>
        <div class="skeleton-card" v-for="n in 6" :key="n">
          <div class="skeleton-img" />
          <div class="skeleton-text" />
          <div class="skeleton-sub" />
        </div>
      </div>

      <div style="height: 80px" />
    </ion-content>

    <!-- Bottom Nav -->
    <div class="bottom-nav">
      <div class="nav-item" @click="navigate('/home')">
        <ion-icon :icon="homeOutline" />
        <span>INICIO</span>
      </div>
      <div class="nav-item active">
        <ion-icon :icon="gridSharp" />
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
import { ref, onMounted } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonButtons, IonMenuButton, IonIcon
} from '@ionic/vue'
import {
  homeOutline, gridSharp, layersOutline,
  searchOutline, notificationsOutline, personOutline
} from 'ionicons/icons'
import TarjetaCategoria from '@/components/TarjetaCategoria.vue'
import { obtenerCategorias } from '@/services/categoriaService'
import { useRouter } from 'vue-router'

const router = useRouter()
const categorias = ref([])

const navigate = (path) => router.push(path)

onMounted(async () => {
  try {
    categorias.value = await obtenerCategorias()
  } catch (err) {
    console.error('Error al obtener las categorías:', err)
  }
})
</script>

<style scoped>
/* ── Header ────────────────────────────────────────── */
.cat-header {
  --background: #ffffff;
  border-bottom: 1px solid #eeeeee;
}
.cat-toolbar {
  --background: #ffffff;
  --color: #111;
  --min-height: 60px;
  padding: 0 8px;
}
.cat-title {
  font-size: 1.1rem;
  font-weight: 900;
  color: #111;
  letter-spacing: -0.01em;
}
.menu-btn { --color: #111; }

/* ── Content ───────────────────────────────────────── */
.cat-content { --background: #F5F5F5; }

/* ── Hero ──────────────────────────────────────────── */
.hero-section {
  padding: 24px 20px 20px;
  background: #fff;
}
.hero-badge {
  display: inline-block;
  border: 1.5px solid #27AE60;
  color: #27AE60;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 4px 10px;
  border-radius: 20px;
  margin-bottom: 12px;
}
.hero-title {
  font-size: 1.7rem;
  font-weight: 900;
  color: #111;
  line-height: 1.2;
  margin: 0 0 12px;
}
.hero-accent {
  color: #8E8EA0;
  font-weight: 900;
}
.hero-line {
  width: 36px;
  height: 3px;
  background: #F5A623;
  border-radius: 2px;
}

/* ── Grid ──────────────────────────────────────────── */
.cat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  padding: 16px;
}

/* ── Skeleton ──────────────────────────────────────── */
.skeleton-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
}
.skeleton-img {
  width: 100%;
  aspect-ratio: 1;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}
.skeleton-text {
  height: 14px;
  background: #eee;
  border-radius: 4px;
  margin: 12px 12px 6px;
  animation: shimmer 1.2s infinite;
}
.skeleton-sub {
  height: 10px;
  background: #f5f5f5;
  border-radius: 4px;
  margin: 0 12px 12px;
  width: 60%;
  animation: shimmer 1.2s infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
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