<template>
  <ion-page>
    <ion-header class="perfil-header">
      <ion-toolbar class="perfil-toolbar">
        <ion-buttons slot="start">
          <ion-back-button text="" class="back-btn" />
        </ion-buttons>
        <ion-title class="perfil-title">Perfil Vendedor</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="perfil-content">

      <!-- Loading -->
      <div class="loading-state" v-if="cargando">
        <div class="loading-spinner" />
        <p>Cargando perfil...</p>
      </div>

      <div v-else>
        <!-- Hero perfil -->
        <div class="profile-hero">
          <div class="avatar-big">
            <img v-if="vendedor.photoURL" :src="vendedor.photoURL" class="avatar-img" @error="onAvatarError" />
            <span v-else class="avatar-initials">{{ getIniciales(vendedor.name) }}</span>
            <div class="verified-ring" v-if="promedioCalificaciones >= 4" />
          </div>

          <h2 class="profile-name">{{ vendedor.name || 'Vendedor' }}</h2>

          <!-- Estadísticas -->
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-val">{{ productosActivos.length }}</span>
              <span class="stat-lbl">ACTIVAS</span>
            </div>
            <div class="stat-divider" />
            <div class="stat-item">
              <span class="stat-val">{{ totalVentas }}</span>
              <span class="stat-lbl">VENTAS</span>
            </div>
            <div class="stat-divider" />
            <div class="stat-item">
              <span class="stat-val">
                {{ promedioCalificaciones.toFixed(1) }}
                <ion-icon :icon="star" class="star-inline" />
              </span>
              <span class="stat-lbl">VALORACIÓN</span>
            </div>
          </div>

          <!-- Badge verificado -->
          <div class="verified-badge" v-if="promedioCalificaciones >= 4">
            <ion-icon :icon="checkmarkCircle" />
            <span>Vendedor Verificado</span>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs-row">
          <button
            v-for="tab in tabs" :key="tab.id"
            class="tab-btn"
            :class="{ active: tabActivo === tab.id }"
            @click="tabActivo = tab.id"
          >
            {{ tab.label }}
            <span class="tab-count" v-if="tab.count > 0">{{ tab.count }}</span>
          </button>
        </div>

        <!-- Tab: Subastas activas -->
        <div v-if="tabActivo === 'activas'">
          <div class="empty-tab" v-if="productosActivos.length === 0">
            <ion-icon :icon="cubeOutline" class="empty-tab-icon" />
            <p>Sin subastas activas</p>
          </div>
          <div class="productos-grid" v-else>
            <div
              class="prod-card"
              v-for="prod in productosActivos"
              :key="prod.id"
              @click="navigate(`/producto/${prod.id}`)"
            >
              <div class="prod-img-wrap">
                <img :src="getProductImage(prod)" class="prod-img" @error="onImgError" />
                <span class="prod-badge-activa">ACTIVA</span>
              </div>
              <div class="prod-body">
                <h3 class="prod-nombre">{{ prod.nombre }}</h3>
                <p class="prod-precio">${{ formatPrice(prod.precioBase) }} <span class="cop">COP</span></p>
                <p class="prod-cierre">
                  <ion-icon :icon="timeOutline" />
                  {{ formatFecha(prod.fechaCierre) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Historial de ventas -->
        <div v-if="tabActivo === 'ventas'">
          <div class="empty-tab" v-if="productosVendidos.length === 0">
            <ion-icon :icon="bagCheckOutline" class="empty-tab-icon" />
            <p>Sin ventas completadas</p>
          </div>
          <div class="productos-grid" v-else>
            <div
              class="prod-card vendida"
              v-for="prod in productosVendidos"
              :key="prod.id"
            >
              <div class="prod-img-wrap">
                <img :src="getProductImage(prod)" class="prod-img" @error="onImgError" />
                <span class="prod-badge-vendida">VENDIDA</span>
              </div>
              <div class="prod-body">
                <h3 class="prod-nombre">{{ prod.nombre }}</h3>
                <p class="prod-precio">${{ formatPrice(prod.precioBase) }} <span class="cop">COP</span></p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Calificaciones -->
        <div v-if="tabActivo === 'calificaciones'">
          <div class="empty-tab" v-if="calificaciones.length === 0">
            <ion-icon :icon="starOutline" class="empty-tab-icon" />
            <p>Sin calificaciones aún</p>
          </div>
          <div class="cal-list" v-else>
            <div class="cal-card" v-for="(cal, i) in calificaciones" :key="i">
              <div class="cal-header-row">
                <div class="cal-avatar">{{ getIniciales(cal.compradorNombre || 'U') }}</div>
                <div class="cal-info">
                  <p class="cal-nombre">{{ cal.compradorNombre || 'Comprador' }}</p>
                  <p class="cal-fecha">{{ formatFecha(cal.fecha) }}</p>
                </div>
                <div class="cal-stars">
                  <ion-icon
                    v-for="s in 5" :key="s"
                    :icon="s <= cal.puntaje ? star : starOutline"
                    class="star-s"
                    :class="{ filled: s <= cal.puntaje }"
                  />
                </div>
              </div>
              <p class="cal-comentario" v-if="cal.comentario">{{ cal.comentario }}</p>
            </div>
          </div>
        </div>

        <div style="height: 80px" />
      </div>
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
  IonButtons, IonBackButton, IonIcon
} from '@ionic/vue'
import {
  star, starOutline, checkmarkCircle, cubeOutline,
  bagCheckOutline, timeOutline, homeOutline, gridOutline,
  layersOutline, searchOutline, notificationsOutline, personOutline
} from 'ionicons/icons'
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore'
import { db } from '@/firebase/FirebaseConfig'

const route = useRoute()
const router = useRouter()
const navigate = (path) => router.push(path)

const vendedorId = route.params.userId
const vendedor = ref({})
const productosActivos = ref([])
const productosVendidos = ref([])
const calificaciones = ref([])
const totalVentas = ref(0)
const cargando = ref(true)
const tabActivo = ref('activas')

const promedioCalificaciones = computed(() => {
  if (!calificaciones.value.length) return 0
  return calificaciones.value.reduce((s, c) => s + (c.puntaje || 0), 0) / calificaciones.value.length
})

const tabs = computed(() => [
  { id: 'activas', label: 'Activas', count: productosActivos.value.length },
  { id: 'ventas', label: 'Vendidas', count: productosVendidos.value.length },
  { id: 'calificaciones', label: 'Reseñas', count: calificaciones.value.length }
])

// ── Helpers ───────────────────────────────────────────
const getIniciales = (nombre) => {
  if (!nombre) return '?'
  return nombre.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

const formatPrice = (val) => {
  if (!val) return '0'
  if (typeof val === 'object') {
    const inner = val.valor || val.value || Object.values(val)[0]
    return Number(inner || 0).toLocaleString('es-CO')
  }
  return Number(val).toLocaleString('es-CO')
}

const formatFecha = (fecha) => {
  if (!fecha) return ''
  try {
    const d = fecha?.toDate ? fecha.toDate() : new Date(fecha)
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return '' }
}

const getProductImage = (prod) => {
  return prod.imagenes?.[0]?.url || prod.imgUrl || '/img/imagen-prueba.jpg'
}

const onImgError = (e) => { e.target.src = '/img/imagen-prueba.jpg' }
const onAvatarError = (e) => { e.target.style.display = 'none' }

// ── Cargar datos ──────────────────────────────────────
onMounted(async () => {
  try {
    // Datos del vendedor
    const vendedorSnap = await getDoc(doc(db, 'users', vendedorId))
    if (vendedorSnap.exists()) vendedor.value = vendedorSnap.data()

    // Productos activos
    const ahora = new Date()
    const prodsSnap = await getDocs(
      query(collection(db, 'products'), where('userId', '==', vendedorId))
    )

    const todos = prodsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    productosActivos.value = todos.filter(p => {
      const fc = p.fechaCierre?.toDate ? p.fechaCierre.toDate() : new Date(p.fechaCierre)
      return p.estado === 'Disponible' && fc > ahora
    })
    productosVendidos.value = todos.filter(p =>
      p.estado === 'Vendido' || p.estado === 'Finalizada'
    )
    totalVentas.value = productosVendidos.value.length

    // Calificaciones con nombre del comprador
    const calSnap = await getDocs(
      collection(db, 'usuarios', vendedorId, 'calificaciones')
    )
    const cals = await Promise.all(calSnap.docs.map(async (d) => {
      const data = { ...d.data(), id: d.id }
      if (data.compradorId) {
        try {
          const compSnap = await getDoc(doc(db, 'users', data.compradorId))
          if (compSnap.exists()) data.compradorNombre = compSnap.data().name || null
        } catch (_) {}
      }
      return data
    }))
    calificaciones.value = cals.sort((a, b) => {
      const fa = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha)
      const fb = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha)
      return fb - fa
    })

  } catch (e) {
    console.error('Error cargando perfil:', e)
  } finally {
    cargando.value = false
  }
})
</script>

<style scoped>
.perfil-header { --background: #fff; border-bottom: 1px solid #eee; }
.perfil-toolbar { --background: #fff; --color: #111; --min-height: 60px; padding: 0 8px; }
.perfil-title { font-size: 1rem; font-weight: 800; color: #111; }
.back-btn { --color: #111; }
.perfil-content { --background: #F5F5F5; }

/* Loading */
.loading-state { display: flex; flex-direction: column; align-items: center; padding: 80px 20px; color: #aaa; gap: 12px; }
.loading-spinner { width: 36px; height: 36px; border: 3px solid #F5F5F5; border-top-color: #F5A623; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Hero */
.profile-hero { background: #fff; padding: 28px 20px 24px; display: flex; flex-direction: column; align-items: center; margin-bottom: 4px; }

.avatar-big { position: relative; width: 88px; height: 88px; background: #1A1D2E; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
.avatar-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
.avatar-initials { font-size: 1.8rem; font-weight: 900; color: #fff; }
.verified-ring { position: absolute; inset: -3px; border-radius: 50%; border: 3px solid #27AE60; }

.profile-name { font-size: 1.2rem; font-weight: 900; color: #111; margin: 0 0 16px; }

.stats-row { display: flex; align-items: center; background: #F9F9F9; border-radius: 14px; padding: 14px 20px; gap: 20px; margin-bottom: 14px; width: 100%; box-sizing: border-box; }
.stat-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; }
.stat-val { font-size: 1.1rem; font-weight: 900; color: #111; display: flex; align-items: center; gap: 3px; }
.star-inline { font-size: 0.8rem; color: #F5A623; }
.stat-lbl { font-size: 0.5rem; font-weight: 700; color: #aaa; letter-spacing: 0.08em; }
.stat-divider { width: 1px; height: 32px; background: #eee; }

.verified-badge { display: flex; align-items: center; gap: 6px; background: #E8F5E9; border-radius: 20px; padding: 6px 14px; }
.verified-badge ion-icon { font-size: 0.9rem; color: #27AE60; }
.verified-badge span { font-size: 0.7rem; font-weight: 700; color: #27AE60; }

/* Tabs */
.tabs-row { display: flex; background: #fff; border-bottom: 1px solid #eee; margin-bottom: 12px; }
.tab-btn { flex: 1; padding: 14px 8px; font-size: 0.75rem; font-weight: 700; color: #aaa; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; transition: all 0.2s; }
.tab-btn.active { color: #F5A623; border-bottom-color: #F5A623; }
.tab-count { background: #F5A623; color: #000; font-size: 0.55rem; font-weight: 800; padding: 1px 5px; border-radius: 10px; }

/* Empty tab */
.empty-tab { display: flex; flex-direction: column; align-items: center; padding: 50px 20px; color: #bbb; gap: 10px; text-align: center; }
.empty-tab-icon { font-size: 2rem; }
.empty-tab p { font-size: 0.85rem; margin: 0; }

/* Grid productos */
.productos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 0 16px; }

.prod-card { background: #fff; border-radius: 16px; overflow: hidden; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.06); transition: transform 0.15s; }
.prod-card:active { transform: scale(0.97); }
.prod-card.vendida { opacity: 0.8; cursor: default; }

.prod-img-wrap { position: relative; aspect-ratio: 1; overflow: hidden; background: #f0f0f0; }
.prod-img { width: 100%; height: 100%; object-fit: cover; }
.prod-badge-activa { position: absolute; top: 6px; right: 6px; background: #27AE60; color: #fff; font-size: 0.5rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; }
.prod-badge-vendida { position: absolute; top: 6px; right: 6px; background: #555; color: #fff; font-size: 0.5rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; }

.prod-body { padding: 10px 10px 12px; }
.prod-nombre { font-size: 0.82rem; font-weight: 800; color: #111; margin: 0 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.prod-precio { font-size: 0.88rem; font-weight: 900; color: #111; margin: 0 0 4px; }
.cop { font-size: 0.6rem; color: #aaa; }
.prod-cierre { font-size: 0.65rem; color: #aaa; margin: 0; display: flex; align-items: center; gap: 3px; }
.prod-cierre ion-icon { font-size: 0.7rem; }

/* Calificaciones */
.cal-list { padding: 0 16px; display: flex; flex-direction: column; gap: 10px; }
.cal-card { background: #fff; border-radius: 16px; padding: 14px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
.cal-header-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.cal-avatar { width: 38px; height: 38px; background: #1A1D2E; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; color: #fff; flex-shrink: 0; }
.cal-info { flex: 1; }
.cal-nombre { font-size: 0.85rem; font-weight: 700; color: #111; margin: 0 0 2px; }
.cal-fecha { font-size: 0.65rem; color: #aaa; margin: 0; }
.cal-stars { display: flex; gap: 2px; }
.star-s { font-size: 0.85rem; color: #ddd; }
.star-s.filled { color: #F5A623; }
.cal-comentario { font-size: 0.82rem; color: #555; line-height: 1.5; margin: 0; background: #F9F9F9; border-radius: 10px; padding: 10px; }

/* Bottom Nav */
.bottom-nav { position: absolute; bottom: 0; left: 0; right: 0; height: 64px; background: #fff; border-top: 1px solid #eee; display: flex; align-items: center; justify-content: space-around; z-index: 999; box-shadow: 0 -4px 20px rgba(0,0,0,0.07); }
.nav-item { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; flex: 1; height: 100%; color: #aaa; cursor: pointer; -webkit-tap-highlight-color: transparent; user-select: none; }
.nav-item ion-icon { font-size: 1.3rem; pointer-events: none; }
.nav-item span { font-size: 0.48rem; font-weight: 700; letter-spacing: 0.06em; pointer-events: none; }
.nav-item.active { color: #F5A623; }
</style>