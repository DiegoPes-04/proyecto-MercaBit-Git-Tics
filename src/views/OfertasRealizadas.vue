<template>
  <ion-page>
    <ion-header class="ofertas-header">
      <ion-toolbar class="ofertas-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button class="menu-btn" />
        </ion-buttons>
        <ion-title class="ofertas-title">Mis Pujas</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ofertas-content">

      <!-- Hero -->
      <div class="hero-section">
        <h1 class="hero-title">Ofertas<br /><span class="hero-accent">Realizadas</span></h1>
        <p class="hero-sub">{{ ofertas.length }} puja{{ ofertas.length !== 1 ? 's' : '' }} en total</p>
      </div>

      <!-- Loading -->
      <div class="loading-state" v-if="loading">
        <div class="loading-spinner" />
      </div>

      <!-- Empty -->
      <div class="empty-state" v-else-if="ofertas.length === 0">
        <div class="empty-icon-wrap">
          <ion-icon :icon="hammerOutline" class="empty-icon" />
        </div>
        <h3 class="empty-title">Sin pujas aún</h3>
        <p class="empty-sub">Cuando hagas una oferta en una subasta, aparecerá aquí.</p>
        <button class="explore-btn" @click="navigate('/home')">Ver subastas</button>
      </div>

      <!-- Lista de ofertas -->
      <div class="ofertas-list" v-else>
        <div
          class="oferta-card"
          v-for="oferta in ofertas"
          :key="oferta.id"
          @click="navigate(`/producto/${oferta.producto_id}`)"
        >
          <!-- Imagen producto -->
          <div class="oferta-img-wrap">
            <img :src="oferta.imagen || '/img/imagen-prueba.jpg'" class="oferta-img" @error="onImgError" />
          </div>

          <!-- Info -->
          <div class="oferta-info">
            <div class="oferta-top">
              <h3 class="oferta-nombre">{{ oferta.producto_nombre }}</h3>
              <span class="oferta-estado-badge" :class="getEstadoClass(oferta)">
                {{ getEstadoLabel(oferta) }}
              </span>
            </div>
            <p class="oferta-fecha">{{ formatFecha(oferta.fecha_hora) }}</p>
            <div class="oferta-bottom">
              <span class="oferta-precio">${{ formatPrice(oferta.cantidad) }} COP</span>
              <span class="mejor-postor" v-if="oferta.es_mas_alta">
                <ion-icon :icon="trophyOutline" /> MEJOR POSTOR
              </span>
            </div>
          </div>

          <ion-icon :icon="chevronForwardOutline" class="oferta-arrow" />
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
      <div class="nav-item active">
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
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton, IonIcon
} from '@ionic/vue'
import {
  hammerOutline, trophyOutline, chevronForwardOutline,
  homeOutline, gridOutline, layersSharp,
  searchOutline, notificationsOutline, personOutline
} from 'ionicons/icons'
import { ref, onMounted } from 'vue'
import { getAuth } from 'firebase/auth'
import { db } from '../firebase/FirebaseConfig'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'vue-router'

const router = useRouter()
const navigate = (path) => router.push(path)
const ofertas = ref([])
const loading = ref(true)

const formatPrice = (val) => {
  if (!val) return '0'
  return Number(val).toLocaleString('es-CO')
}

const formatFecha = (ts) => {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000)
  return d.toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const getEstadoClass = (oferta) => {
  if (oferta.es_mas_alta) return 'estado-ganando'
  if (oferta.estado === 'superada') return 'estado-superada'
  return 'estado-activa'
}

const getEstadoLabel = (oferta) => {
  if (oferta.es_mas_alta) return 'GANANDO'
  if (oferta.estado === 'superada') return 'SUPERADA'
  return 'ACTIVA'
}

const onImgError = (e) => { e.target.src = '/img/imagen-prueba.jpg' }

const obtenerDatosProducto = async (productoId) => {
  if (!productoId) return { nombre: 'Producto', imagen: '' }
  const snap = await getDoc(doc(db, 'products', productoId))
  if (snap.exists()) {
    const d = snap.data()
    return {
      nombre: d.nombre || 'Sin nombre',
      imagen: d.imagenes?.[0]?.url || d.imgUrl || ''
    }
  }
  return { nombre: 'Producto no encontrado', imagen: '' }
}

onMounted(async () => {
  const auth = getAuth()
  const user = auth.currentUser
  if (!user) { loading.value = false; return }

  try {
    const snap = await getDocs(
      query(collection(db, 'ofertas'), where('usuario_id', '==', user.uid))
    )
    const result = await Promise.all(snap.docs.map(async (d) => {
      const data = d.data()
      const { nombre, imagen } = await obtenerDatosProducto(data.producto_id)
      return { id: d.id, ...data, producto_nombre: nombre, imagen }
    }))

    ofertas.value = result.sort((a, b) => {
      const fa = a.fecha_hora?.seconds || 0
      const fb = b.fecha_hora?.seconds || 0
      return fb - fa
    })
  } catch (e) {
    console.error('Error al obtener ofertas:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.ofertas-header { --background: #fff; border-bottom: 1px solid #eee; }
.ofertas-toolbar { --background: #fff; --color: #111; --min-height: 60px; padding: 0 8px; }
.ofertas-title { font-size: 1rem; font-weight: 800; color: #111; letter-spacing: 0.05em; }
.menu-btn { --color: #111; }
.ofertas-content { --background: #F5F5F5; }

/* Hero */
.hero-section { background: #fff; padding: 20px 20px 18px; margin-bottom: 10px; }
.hero-title { font-size: 1.6rem; font-weight: 900; color: #111; line-height: 1.2; margin: 0 0 4px; }
.hero-accent { color: #F5A623; }
.hero-sub { font-size: 0.8rem; color: #aaa; margin: 0; }

/* Loading / Empty */
.loading-state { display: flex; justify-content: center; padding: 60px; }
.loading-spinner { width: 36px; height: 36px; border: 3px solid #F5F5F5; border-top-color: #F5A623; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state { display: flex; flex-direction: column; align-items: center; padding: 60px 30px; text-align: center; }
.empty-icon-wrap { width: 72px; height: 72px; background: #FFF3E0; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
.empty-icon { font-size: 2rem; color: #F5A623; }
.empty-title { font-size: 1rem; font-weight: 800; color: #111; margin: 0 0 6px; }
.empty-sub { font-size: 0.82rem; color: #aaa; margin: 0 0 20px; line-height: 1.5; }
.explore-btn { background: #F5A623; border: none; border-radius: 20px; padding: 10px 24px; font-size: 0.85rem; font-weight: 700; cursor: pointer; }

/* Lista */
.ofertas-list { padding: 0 16px; display: flex; flex-direction: column; gap: 10px; }

.oferta-card {
  background: #fff; border-radius: 18px;
  padding: 14px; display: flex; align-items: center;
  gap: 12px; cursor: pointer;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  transition: transform 0.15s;
}
.oferta-card:active { transform: scale(0.98); }

.oferta-img-wrap { width: 60px; height: 60px; border-radius: 12px; overflow: hidden; background: #f0f0f0; flex-shrink: 0; }
.oferta-img { width: 100%; height: 100%; object-fit: cover; }

.oferta-info { flex: 1; min-width: 0; }
.oferta-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 3px; }
.oferta-nombre { font-size: 0.88rem; font-weight: 700; color: #111; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }

.oferta-estado-badge { font-size: 0.55rem; font-weight: 800; letter-spacing: 0.06em; padding: 3px 7px; border-radius: 6px; flex-shrink: 0; }
.estado-ganando { background: #E8F5E9; color: #27AE60; }
.estado-superada { background: #FFF0F0; color: #E53935; }
.estado-activa { background: #FFF8EE; color: #F5A623; }

.oferta-fecha { font-size: 0.68rem; color: #aaa; margin: 0 0 6px; }
.oferta-bottom { display: flex; align-items: center; justify-content: space-between; }
.oferta-precio { font-size: 0.9rem; font-weight: 900; color: #111; }
.mejor-postor { font-size: 0.6rem; font-weight: 800; color: #27AE60; display: flex; align-items: center; gap: 3px; }
.mejor-postor ion-icon { font-size: 0.75rem; }

.oferta-arrow { font-size: 1rem; color: #ddd; flex-shrink: 0; }

/* Bottom Nav */
.bottom-nav { position: absolute; bottom: 0; left: 0; right: 0; height: 64px; background: #fff; border-top: 1px solid #eee; display: flex; align-items: center; justify-content: space-around; z-index: 999; box-shadow: 0 -4px 20px rgba(0,0,0,0.07); }
.nav-item { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; flex: 1; height: 100%; color: #aaa; cursor: pointer; -webkit-tap-highlight-color: transparent; user-select: none; }
.nav-item ion-icon { font-size: 1.3rem; pointer-events: none; }
.nav-item span { font-size: 0.48rem; font-weight: 700; letter-spacing: 0.06em; pointer-events: none; }
.nav-item.active { color: #F5A623; }
</style>