<template>
  <ion-page>
    <ion-content class="confirm-content">

      <!-- Header -->
      <div class="confirm-header">
        <button class="close-btn" @click="navigate('/home')">
          <ion-icon :icon="closeOutline" />
        </button>
        <span class="confirm-label">Confirmación</span>
      </div>

      <!-- Hero check -->
      <div class="hero-section">
        <div class="check-wrap">
          <div class="check-circle">
            <ion-icon :icon="checkmarkOutline" class="check-icon" />
          </div>
          <div class="dot dot-orange" />
          <div class="dot dot-green-sm" />
          <div class="dot dot-green-lg" />
        </div>

        <h1 class="confirm-title">¡Puja Realizada con<br />Éxito!</h1>
        <p class="confirm-sub">
          Tu oferta de <strong>${{ formatPrice(oferta.cantidad) }} COP</strong> ha sido procesada.
        </p>

        <!-- Badge mejor postor -->
        <div class="best-badge">
          <ion-icon :icon="trophyOutline" class="trophy-icon" />
          <span>ERES EL MEJOR POSTOR ACTUAL</span>
        </div>
      </div>

      <!-- Resumen producto -->
      <div class="resumen-card">
        <p class="resumen-label">RESUMEN DE SUBASTA</p>
        <div class="resumen-row">
          <div class="resumen-img-wrap">
            <img :src="oferta.imagenProducto || '/img/imagen-prueba.jpg'" class="resumen-img" @error="onImgError" />
          </div>
          <div class="resumen-info">
            <h3 class="resumen-nombre">{{ oferta.nombreProducto || 'Producto' }}</h3>
            <div class="resumen-precio-row">
              <span class="resumen-precio-label">OFERTA<br/>ACTUAL</span>
              <span class="resumen-precio">${{ formatPrice(oferta.cantidad) }}.000</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Notificación info -->
      <div class="notif-info">
        <ion-icon :icon="notificationsOutline" class="notif-info-icon" />
        <span>Te notificaremos si alguien supera tu puja.</span>
      </div>

      <!-- Acciones -->
      <div class="actions-wrap">
        <button class="btn-primary" @click="navigate('/ofertas-realizadas')">
          Ver Pujas Realizadas
        </button>
        <button class="btn-secondary" @click="navigate('/explorar')">
          Seguir Explorando
        </button>
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
      <div class="nav-item active" @click="navigate('/ofertas-realizadas')">
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
import { IonPage, IonContent, IonIcon } from '@ionic/vue'
import {
  closeOutline, checkmarkOutline, trophyOutline,
  notificationsOutline, homeOutline, gridOutline,
  layersSharp, searchOutline, personOutline
} from 'ionicons/icons'
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()

// Datos pasados por query params desde DetalleProducto
const oferta = computed(() => ({
  cantidad:        route.query.cantidad        || 0,
  nombreProducto:  route.query.nombreProducto  || 'Producto',
  imagenProducto:  route.query.imagenProducto  || '',
  productoId:      route.query.productoId      || ''
}))

const navigate = (path) => router.push(path)

const verDetalle = () => {
  if (oferta.value.productoId) {
    router.push(`/producto/${oferta.value.productoId}`)
  } else {
    router.push('/home')
  }
}

const formatPrice = (val) => {
  if (!val) return '0'
  return Number(val).toLocaleString('es-CO')
}

const onImgError = (e) => {
  e.target.src = '/img/imagen-prueba.jpg'
}
</script>

<style scoped>
.confirm-content { --background: #ffffff; }

/* ── Header ────────────────────────────────────────── */
.confirm-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 56px 20px 0;
  position: relative;
}
.close-btn {
  position: absolute; left: 16px;
  width: 36px; height: 36px;
  background: #F5F5F5; border: none;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 1.1rem; color: #555;
}
.confirm-label {
  font-size: 0.95rem; font-weight: 700; color: #111;
}

/* ── Hero ──────────────────────────────────────────── */
.hero-section {
  display: flex; flex-direction: column;
  align-items: center;
  padding: 32px 24px 0;
  text-align: center;
}

.check-wrap {
  position: relative;
  width: 90px; height: 90px;
  margin-bottom: 24px;
}

.check-circle {
  width: 80px; height: 80px;
  background: #27AE60;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 24px rgba(39,174,96,0.3);
}
.check-icon { font-size: 2.4rem; color: #fff; }

/* Dots decorativos */
.dot {
  position: absolute;
  border-radius: 50%;
}
.dot-orange { width: 14px; height: 14px; background: #F5A623; top: -4px; right: -4px; }
.dot-green-sm { width: 8px; height: 8px; background: #27AE60; bottom: 4px; left: -8px; opacity: 0.5; }
.dot-green-lg { width: 10px; height: 10px; background: #27AE60; top: 8px; left: -2px; opacity: 0.3; }

.confirm-title {
  font-size: 1.6rem; font-weight: 900; color: #111;
  line-height: 1.2; margin: 0 0 12px;
}
.confirm-sub {
  font-size: 0.88rem; color: #666; margin: 0 0 20px;
  line-height: 1.5;
}
.confirm-sub strong { color: #111; }

/* Badge mejor postor */
.best-badge {
  display: flex; align-items: center; gap: 8px;
  border: 1.5px solid #27AE60;
  border-radius: 30px;
  padding: 10px 18px;
  margin-bottom: 8px;
}
.trophy-icon { font-size: 1rem; color: #27AE60; }
.best-badge span {
  font-size: 0.7rem; font-weight: 800;
  color: #27AE60; letter-spacing: 0.06em;
}

/* ── Resumen ───────────────────────────────────────── */
.resumen-card {
  margin: 24px 20px 0;
  background: #F9F9F9;
  border-radius: 18px;
  padding: 16px;
}
.resumen-label {
  font-size: 0.6rem; font-weight: 700;
  color: #aaa; letter-spacing: 0.1em;
  margin: 0 0 12px;
}
.resumen-row {
  display: flex; align-items: center; gap: 14px;
}
.resumen-img-wrap {
  width: 70px; height: 70px;
  border-radius: 12px; overflow: hidden;
  background: #e0e0e0; flex-shrink: 0;
}
.resumen-img { width: 100%; height: 100%; object-fit: cover; }

.resumen-info { flex: 1; }
.resumen-nombre {
  font-size: 0.95rem; font-weight: 800; color: #111;
  margin: 0 0 10px;
}
.resumen-precio-row {
  display: flex; align-items: center; gap: 12px;
}
.resumen-precio-label {
  font-size: 0.6rem; font-weight: 700;
  color: #aaa; letter-spacing: 0.04em;
  line-height: 1.3;
}
.resumen-precio {
  font-size: 1.05rem; font-weight: 900; color: #111;
}

/* ── Notif info ────────────────────────────────────── */
.notif-info {
  display: flex; align-items: center; gap: 8px;
  padding: 16px 24px;
  color: #aaa;
}
.notif-info-icon { font-size: 0.9rem; flex-shrink: 0; }
.notif-info span { font-size: 0.78rem; }

/* ── Actions ───────────────────────────────────────── */
.actions-wrap {
  padding: 0 20px;
  display: flex; flex-direction: column; gap: 12px;
}
.btn-primary {
  width: 100%; padding: 16px;
  background: #F5A623; color: #000;
  border: none; border-radius: 30px;
  font-size: 0.95rem; font-weight: 800;
  cursor: pointer;
}
.btn-secondary {
  width: 100%; padding: 15px;
  background: transparent;
  border: 2px solid #111;
  border-radius: 30px;
  font-size: 0.95rem; font-weight: 700;
  color: #111; cursor: pointer;
}

/* ── Bottom Nav ────────────────────────────────────── */
.bottom-nav {
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 64px; background: #fff;
  border-top: 1px solid #eee;
  display: flex; align-items: center; justify-content: space-around;
  z-index: 999; box-shadow: 0 -4px 20px rgba(0,0,0,0.07);
}
.nav-item {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 3px; flex: 1; height: 100%;
  color: #aaa; cursor: pointer;
  -webkit-tap-highlight-color: transparent; user-select: none;
}
.nav-item ion-icon { font-size: 1.3rem; pointer-events: none; }
.nav-item span { font-size: 0.48rem; font-weight: 700; letter-spacing: 0.06em; pointer-events: none; }
.nav-item.active { color: #F5A623; }
</style>