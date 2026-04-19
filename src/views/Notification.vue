<template>
  <ion-page>
    <ion-header class="notif-header">
      <ion-toolbar class="notif-toolbar">
        <ion-buttons slot="start">
          <ion-back-button text="" class="back-btn" default-href="/home" />
        </ion-buttons>
        <ion-title class="notif-title">Notificaciones</ion-title>
        <ion-buttons slot="end">
          <ion-button class="settings-btn">
            <ion-icon :icon="settingsOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="notif-content">

      <!-- Hero -->
      <div class="notif-hero">
        <span class="hero-overline">ACTIVIDAD RECIENTE</span>
        <h1 class="hero-title">Alertas de Subasta</h1>
      </div>

      <!-- Empty state -->
      <div class="empty-state" v-if="notificaciones.length === 0">
        <div class="empty-icon-wrap">
          <ion-icon :icon="notificationsOffOutline" class="empty-icon" />
        </div>
        <h3 class="empty-title">Sin notificaciones</h3>
        <p class="empty-sub">Cuando tengas actividad en tus subastas, aparecerá aquí.</p>
      </div>

      <!-- Cards de notificaciones -->
      <div class="notif-list" v-else>
        <div
          class="notif-card"
          v-for="notificacion in notificaciones"
          :key="notificacion.id"
        >
          <!-- Barra lateral de color según tipo -->
          <div class="card-bar" :class="getTipoClass(notificacion)" />

          <div class="card-body">
            <!-- Ícono + título + tiempo -->
            <div class="card-top">
              <div class="card-icon-wrap" :class="getTipoClass(notificacion)">
                <ion-icon :icon="getTipoIcon(notificacion)" />
              </div>
              <div class="card-meta">
                <div class="card-title-row">
                  <span class="card-title">{{ getTipoLabel(notificacion) }}</span>
                  <span class="card-time">HACE {{ formatoTiempo(notificacion.timestamp) }}</span>
                </div>
              </div>
            </div>

            <!-- Mensaje -->
            <p class="card-msg">{{ notificacion.mensaje }}</p>

            <!-- Botón de acción -->
            <div class="card-actions">
              <button
                class="action-btn"
                :class="getTipoClass(notificacion)"
                @click="accionPrincipal(notificacion)"
              >
                {{ getTipoAccion(notificacion) }}
              </button>
              <button class="delete-btn" @click="eliminarNotificacion(notificacion.id)">
                <ion-icon :icon="trashOutline" />
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
      <div class="nav-item" @click="navigate('/explorar')">
        <ion-icon :icon="searchOutline" /><span>BUSCAR</span>
      </div>
      <div class="nav-item" @click="navigate('/ofertas-realizadas')">
        <ion-icon :icon="layersOutline" /><span>MIS TRATOS</span>
      </div>
      <div class="nav-item active">
        <ion-icon :icon="notificationsSharp" /><span>ALERTS</span>
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
  IonButtons, IonBackButton, IonButton, IonIcon
} from '@ionic/vue'
import {
  settingsOutline, notificationsOffOutline, trashOutline,
  bicycleOutline, carOutline, trophyOutline, alertCircleOutline,
  homeOutline, gridOutline, searchOutline, layersOutline,
  notificationsSharp, personOutline
} from 'ionicons/icons'
import { onMounted, ref } from 'vue'
import { db } from '../firebase/FirebaseConfig'
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { useRouter } from 'vue-router'

const notificaciones = ref([])
const router = useRouter()
const navigate = (path) => router.push(path)

onMounted(() => {
  const auth = getAuth()
  const user = auth.currentUser
  if (user) {
    const q = query(collection(db, 'notificaciones'), where('userId', '==', user.uid))
    onSnapshot(q, (snapshot) => {
      notificaciones.value = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    })
  }
})

const eliminarNotificacion = async (id) => {
  try {
    await deleteDoc(doc(db, 'notificaciones', id))
  } catch (e) { console.error(e) }
}

const accionPrincipal = (notif) => {
  if (notif.productoId) router.push(`/producto/${notif.productoId}`)
}

// Helpers de tipo
const getTipoClass = (notif) => {
  const tipo = (notif.tipo || '').toLowerCase()
  if (tipo.includes('gan') || tipo.includes('win')) return 'tipo-green'
  if (tipo.includes('super') || tipo.includes('oferta') || tipo.includes('puja')) return 'tipo-orange'
  return 'tipo-red'
}

const getTipoIcon = (notif) => {
  const tipo = (notif.tipo || '').toLowerCase()
  if (tipo.includes('gan') || tipo.includes('win')) return trophyOutline
  if (tipo.includes('super') || tipo.includes('puja')) return carOutline
  return alertCircleOutline
}

const getTipoLabel = (notif) => {
  return notif.titulo || notif.tipo || 'Notificación'
}

const getTipoAccion = (notif) => {
  const tipo = (notif.tipo || '').toLowerCase()
  if (tipo.includes('gan')) return 'Pagar ahora'
  if (tipo.includes('super')) return 'Contraofertar'
  return 'Ver detalles'
}

const formatoTiempo = (isoString) => {
  if (!isoString) return ''
  const diff = Date.now() - new Date(isoString).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}M`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}H`
  return `${Math.floor(h / 24)}D`
}
</script>

<style scoped>
.notif-header { --background: #ffffff; border-bottom: 1px solid #eee; }
.notif-toolbar { --background: #ffffff; --color: #111; --min-height: 60px; padding: 0 8px; }
.notif-title { font-size: 1rem; font-weight: 800; color: #111; }
.back-btn { --color: #111; }
.settings-btn { --color: #555; }
.notif-content { --background: #F5F5F5; }

/* ── Hero ──────────────────────────────────────────── */
.notif-hero { padding: 20px 20px 16px; background: #fff; margin-bottom: 12px; }
.hero-overline { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.1em; color: #F5A623; }
.hero-title { font-size: 1.5rem; font-weight: 900; color: #111; margin: 4px 0 0; }

/* ── Empty ─────────────────────────────────────────── */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 80px 40px; text-align: center;
}
.empty-icon-wrap {
  width: 72px; height: 72px; background: #FFF3E0;
  border-radius: 50%; display: flex; align-items: center;
  justify-content: center; margin-bottom: 16px;
}
.empty-icon { font-size: 2rem; color: #F5A623; }
.empty-title { font-size: 1rem; font-weight: 800; color: #111; margin: 0 0 6px; }
.empty-sub { font-size: 0.82rem; color: #aaa; margin: 0; line-height: 1.5; }

/* ── List ──────────────────────────────────────────── */
.notif-list { padding: 0 16px; display: flex; flex-direction: column; gap: 12px; }

.notif-card {
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  display: flex;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

/* Barra lateral */
.card-bar { width: 5px; flex-shrink: 0; }
.tipo-red    .card-bar, .card-bar.tipo-red    { background: #E53935; }
.tipo-orange .card-bar, .card-bar.tipo-orange { background: #F5A623; }
.tipo-green  .card-bar, .card-bar.tipo-green  { background: #27AE60; }

.card-body { flex: 1; padding: 16px 14px; }

.card-top { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; }

.card-icon-wrap {
  width: 40px; height: 40px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.card-icon-wrap ion-icon { font-size: 1.1rem; }

.tipo-red    { background: #FFF0F0; }
.tipo-red    ion-icon { color: #E53935; }
.tipo-orange { background: #FFF8EE; }
.tipo-orange ion-icon { color: #F5A623; }
.tipo-green  { background: #F0FFF4; }
.tipo-green  ion-icon { color: #27AE60; }

.card-meta { flex: 1; }
.card-title-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.card-title { font-size: 0.9rem; font-weight: 800; color: #111; }
.card-time { font-size: 0.58rem; font-weight: 700; color: #bbb; letter-spacing: 0.05em; white-space: nowrap; }

.card-msg { font-size: 0.8rem; color: #555; line-height: 1.5; margin: 0 0 14px; }

.card-actions { display: flex; align-items: center; gap: 10px; }

.action-btn {
  border: none; border-radius: 20px;
  padding: 9px 18px; font-size: 0.78rem; font-weight: 700;
  cursor: pointer; color: #fff;
}
.action-btn.tipo-red    { background: #111; }
.action-btn.tipo-orange { background: #F5A623; color: #000; }
.action-btn.tipo-green  { background: #27AE60; }

.delete-btn {
  width: 34px; height: 34px;
  background: #F5F5F5; border: none;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #bbb; font-size: 0.9rem;
  margin-left: auto;
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