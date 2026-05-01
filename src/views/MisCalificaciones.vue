<template>
  <ion-page>
    <ion-header class="cal-header">
      <ion-toolbar class="cal-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button class="menu-btn" />
        </ion-buttons>
        <ion-title class="cal-title">Mis Calificaciones</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="cal-content">

      <!-- Hero -->
      <div class="hero-section">
        <h1 class="hero-title">Mis<br /><span class="hero-accent">Calificaciones</span></h1>
        <div class="hero-stats" v-if="!loading && calificaciones.length > 0">
          <div class="stat-item">
            <span class="stat-val">{{ promedioEstrellas.toFixed(1) }}</span>
            <div class="stars-row">
              <ion-icon
                v-for="i in 5" :key="i"
                :icon="i <= Math.round(promedioEstrellas) ? star : starOutline"
                class="star-sm"
              />
            </div>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <span class="stat-val">{{ calificaciones.length }}</span>
            <span class="stat-lbl">RESEÑAS</span>
          </div>
        </div>
        <p class="hero-sub" v-else-if="!loading">Aún no tienes calificaciones como vendedor.</p>
      </div>

      <!-- Loading -->
      <div class="loading-state" v-if="loading">
        <div class="loading-spinner" />
        <p>Cargando calificaciones...</p>
      </div>

      <!-- Empty -->
      <div class="empty-state" v-else-if="calificaciones.length === 0">
        <div class="empty-icon-wrap">
          <ion-icon :icon="starOutline" class="empty-icon" />
        </div>
        <h3 class="empty-title">Sin calificaciones</h3>
        <p class="empty-sub">Cuando un comprador te califique después de una venta, aparecerá aquí.</p>
      </div>

      <!-- Lista de calificaciones -->
      <div class="cal-list" v-else>
        <div class="cal-card" v-for="(cal, index) in calificaciones" :key="cal.id || index">

          <!-- Header: avatar + nombre + fecha -->
          <div class="cal-card-header">
            <div class="comprador-avatar">
              <span>{{ getIniciales(cal.compradorNombre || cal.compradorId) }}</span>
            </div>
            <div class="comprador-info">
              <p class="comprador-nombre">{{ cal.compradorNombre || maskId(cal.compradorId) }}</p>
              <p class="cal-fecha">{{ formatFecha(cal.fecha) }}</p>
            </div>
            <!-- Estrellas -->
            <div class="cal-stars">
              <ion-icon
                v-for="i in 5" :key="i"
                :icon="i <= cal.puntaje ? star : starOutline"
                class="star-icon"
                :class="{ filled: i <= cal.puntaje }"
              />
            </div>
          </div>

          <!-- Puntaje badge -->
          <div class="puntaje-badge" :class="getPuntajeClass(cal.puntaje)">
            <ion-icon :icon="getPuntajeIcon(cal.puntaje)" />
            {{ getPuntajeLabel(cal.puntaje) }}
          </div>

          <!-- Comentario -->
          <div class="cal-comentario" v-if="cal.comentario">
            <ion-icon :icon="chatbubbleOutline" class="comment-icon" />
            <p>{{ cal.comentario }}</p>
          </div>
          <div class="cal-sin-comentario" v-else>
            <p>Sin comentario</p>
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
  IonButtons, IonMenuButton, IonIcon
} from '@ionic/vue'
import {
  star, starOutline, chatbubbleOutline,
  happyOutline, sadOutline, removeCircleOutline,
  homeOutline, gridOutline, layersOutline,
  searchOutline, notificationsOutline, personOutline
} from 'ionicons/icons'
import { ref, computed, onMounted } from 'vue'
import { getDocs, collection, doc, getDoc } from 'firebase/firestore'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { db } from '../firebase/FirebaseConfig'
import { useRouter } from 'vue-router'

const router = useRouter()
const navigate = (path) => router.push(path)
const calificaciones = ref([])
const loading = ref(true)

// ── Promedio ──────────────────────────────────────────
const promedioEstrellas = computed(() => {
  if (!calificaciones.value.length) return 0
  const total = calificaciones.value.reduce((s, c) => s + (c.puntaje || 0), 0)
  return total / calificaciones.value.length
})

// ── Helpers ───────────────────────────────────────────
const getIniciales = (nombre) => {
  if (!nombre) return '?'
  return nombre.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

const maskId = (id) => {
  if (!id) return 'Comprador'
  return id.slice(0, 4) + '****' + id.slice(-3)
}

const formatFecha = (fecha) => {
  if (!fecha) return ''
  try {
    const d = fecha?.toDate ? fecha.toDate() : new Date(fecha)
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return '' }
}

const getPuntajeClass = (puntaje) => {
  if (puntaje >= 4) return 'puntaje-bueno'
  if (puntaje === 3) return 'puntaje-medio'
  return 'puntaje-malo'
}

const getPuntajeIcon = (puntaje) => {
  if (puntaje >= 4) return happyOutline
  if (puntaje === 3) return removeCircleOutline
  return sadOutline
}

const getPuntajeLabel = (puntaje) => {
  if (puntaje === 5) return 'Excelente'
  if (puntaje === 4) return 'Muy bueno'
  if (puntaje === 3) return 'Regular'
  if (puntaje === 2) return 'Malo'
  return 'Muy malo'
}

// ── Cargar calificaciones + nombre del comprador ──────
onMounted(() => {
  const auth = getAuth()
  onAuthStateChanged(auth, async (user) => {
    if (!user) { loading.value = false; return }

    try {
      const snap = await getDocs(
        collection(db, 'usuarios', user.uid, 'calificaciones')
      )

      // Para cada calificación, obtener el nombre del comprador
      const results = await Promise.all(snap.docs.map(async (d) => {
        const data = { ...d.data(), id: d.id }

        // Intentar obtener nombre real del comprador
        if (data.compradorId) {
          try {
            const compradorSnap = await getDoc(doc(db, 'users', data.compradorId))
            if (compradorSnap.exists()) {
              data.compradorNombre = compradorSnap.data().name || null
            }
          } catch (_) {}
        }

        return data
      }))

      calificaciones.value = results
    } catch (e) {
      console.error('Error al obtener calificaciones:', e)
    } finally {
      loading.value = false
    }
  })
})
</script>

<style scoped>
.cal-header { --background: #fff; border-bottom: 1px solid #eee; }
.cal-toolbar { --background: #fff; --color: #111; --min-height: 60px; padding: 0 8px; }
.cal-title { font-size: 1rem; font-weight: 800; color: #111; }
.menu-btn { --color: #111; }
.cal-content { --background: #F5F5F5; }

/* ── Hero ──────────────────────────────────────────── */
.hero-section {
  background: #fff; padding: 20px 20px 22px;
  margin-bottom: 12px;
}
.hero-title {
  font-size: 1.6rem; font-weight: 900;
  color: #111; line-height: 1.2; margin: 0 0 14px;
}
.hero-accent { color: #F5A623; }
.hero-sub { font-size: 0.82rem; color: #aaa; margin: 0; }

/* Stats promedio */
.hero-stats {
  display: flex; align-items: center;
  background: #F9F9F9; border-radius: 14px;
  padding: 14px 16px; gap: 16px;
}
.stat-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.stat-val { font-size: 1.6rem; font-weight: 900; color: #111; line-height: 1; }
.stat-lbl { font-size: 0.6rem; font-weight: 700; color: #aaa; letter-spacing: 0.08em; }
.stars-row { display: flex; gap: 2px; }
.star-sm { font-size: 0.85rem; color: #F5A623; }
.stat-divider { width: 1px; height: 36px; background: #eee; }

/* ── Loading / Empty ───────────────────────────────── */
.loading-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 60px; color: #aaa; gap: 12px;
}
.loading-spinner {
  width: 36px; height: 36px;
  border: 3px solid #F5F5F5; border-top-color: #F5A623;
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 60px 30px; text-align: center;
}
.empty-icon-wrap {
  width: 72px; height: 72px; background: #FFF3E0;
  border-radius: 50%; display: flex; align-items: center;
  justify-content: center; margin-bottom: 16px;
}
.empty-icon { font-size: 2rem; color: #F5A623; }
.empty-title { font-size: 1rem; font-weight: 800; color: #111; margin: 0 0 6px; }
.empty-sub { font-size: 0.82rem; color: #aaa; margin: 0; line-height: 1.5; }

/* ── Cards ─────────────────────────────────────────── */
.cal-list { padding: 0 16px; display: flex; flex-direction: column; gap: 12px; }

.cal-card {
  background: #fff; border-radius: 18px;
  padding: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

/* Header card */
.cal-card-header {
  display: flex; align-items: center;
  gap: 12px; margin-bottom: 12px;
}

.comprador-avatar {
  width: 44px; height: 44px;
  background: #1A1D2E; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.comprador-avatar span {
  font-size: 0.85rem; font-weight: 800; color: #fff;
}

.comprador-info { flex: 1; }
.comprador-nombre {
  font-size: 0.9rem; font-weight: 700; color: #111; margin: 0 0 2px;
}
.cal-fecha { font-size: 0.68rem; color: #aaa; margin: 0; }

/* Estrellas */
.cal-stars { display: flex; gap: 2px; flex-shrink: 0; }
.star-icon { font-size: 1rem; color: #ddd; }
.star-icon.filled { color: #F5A623; }

/* Badge puntaje */
.puntaje-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 0.7rem; font-weight: 700;
  padding: 5px 10px; border-radius: 20px;
  margin-bottom: 10px;
}
.puntaje-bueno { background: #E8F5E9; color: #27AE60; }
.puntaje-medio { background: #FFF8EE; color: #F5A623; }
.puntaje-malo  { background: #FFF0F0; color: #E53935; }

/* Comentario */
.cal-comentario {
  display: flex; gap: 8px; align-items: flex-start;
  background: #F9F9F9; border-radius: 12px; padding: 12px;
}
.comment-icon { font-size: 1rem; color: #ccc; flex-shrink: 0; margin-top: 1px; }
.cal-comentario p {
  font-size: 0.85rem; color: #555; line-height: 1.5; margin: 0;
}
.cal-sin-comentario p {
  font-size: 0.75rem; color: #ccc; font-style: italic; margin: 0;
  text-align: center; padding: 6px 0;
}

/* ── Bottom Nav ────────────────────────────────────── */
.bottom-nav {
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 64px; background: #fff; border-top: 1px solid #eee;
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