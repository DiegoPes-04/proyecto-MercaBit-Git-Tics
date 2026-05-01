<template>
  <ion-page>
    <ion-header class="cal-header">
      <ion-toolbar class="cal-toolbar">
        <ion-buttons slot="start">
          <ion-back-button text="" default-href="/Miscompras" class="back-btn" />
        </ion-buttons>
        <ion-title class="cal-title">Calificar Vendedor</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="cal-content">

      <!-- Loading -->
      <div class="loading-state" v-if="cargando">
        <div class="loading-spinner" />
        <p>Cargando...</p>
      </div>

      <!-- No disponible -->
      <div class="no-disponible" v-else-if="estadoCompra !== 'completado' && estadoCompra !== 'En proceso'">
        <div class="empty-icon-wrap">
          <ion-icon :icon="lockClosedOutline" class="empty-icon" />
        </div>
        <h3 class="empty-title">No disponible</h3>
        <p class="empty-sub">Solo puedes calificar cuando la compra esté completada.</p>
        <button class="back-btn-alt" @click="navigate('/Miscompras')">Volver a Mis Compras</button>
      </div>

      <!-- Ya calificó -->
      <div class="ya-califico" v-else-if="yaCalifico">
        <div class="check-wrap">
          <div class="check-circle">
            <ion-icon :icon="checkmarkOutline" />
          </div>
        </div>
        <h3 class="ya-title">¡Ya calificaste esta compra!</h3>
        <p class="ya-sub">Tu opinión ya fue registrada. Gracias por tu feedback.</p>
        <button class="volver-btn" @click="navigate('/Miscompras')">Volver a Mis Compras</button>
      </div>

      <!-- Formulario de calificación -->
      <div v-else>

        <!-- Hero -->
        <div class="hero-section">
          <div class="vendedor-info" v-if="vendedorNombre">
            <div class="vendedor-avatar">{{ getIniciales(vendedorNombre) }}</div>
            <div>
              <p class="vendedor-label">VENDEDOR</p>
              <h2 class="vendedor-nombre">{{ vendedorNombre }}</h2>
            </div>
          </div>
          <h1 class="hero-title">¿Cómo fue tu<br /><span class="hero-accent">experiencia?</span></h1>
          <p class="hero-sub">Tu opinión ayuda a otros compradores</p>
        </div>

        <!-- Producto comprado -->
        <div class="producto-card" v-if="nombreProducto">
          <ion-icon :icon="bagCheckOutline" class="prod-icon" />
          <div>
            <p class="prod-label">PRODUCTO COMPRADO</p>
            <p class="prod-nombre">{{ nombreProducto }}</p>
          </div>
        </div>

        <!-- Estrellas -->
        <div class="section-card">
          <h3 class="section-title">Puntaje</h3>
          <div class="stars-selector">
            <ion-icon
              v-for="i in 5"
              :key="i"
              :icon="i <= puntaje ? star : starOutline"
              class="star-btn"
              :class="{ active: i <= puntaje }"
              @click="puntaje = i"
            />
          </div>
          <p class="puntaje-label" :class="getPuntajeClass(puntaje)">
            {{ getPuntajeLabel(puntaje) }}
          </p>
        </div>

        <!-- Comentario -->
        <div class="section-card">
          <h3 class="section-title">Comentario</h3>
          <textarea
            v-model="comentario"
            class="comentario-input"
            placeholder="Describe tu experiencia con este vendedor..."
            rows="4"
            maxlength="300"
          />
          <p class="char-count">{{ comentario.length }}/300</p>
        </div>

        <!-- Tags rápidos -->
        <div class="section-card">
          <h3 class="section-title">¿Qué destacas?</h3>
          <div class="tags-wrap">
            <button
              v-for="tag in tagsDisponibles"
              :key="tag"
              class="tag-btn"
              :class="{ selected: tagsSeleccionados.includes(tag) }"
              @click="toggleTag(tag)"
            >
              {{ tag }}
            </button>
          </div>
        </div>

        <!-- Botón enviar -->
        <div class="submit-wrap">
          <button
            class="submit-btn"
            @click="enviarCalificacion"
            :disabled="enviando"
            :class="{ disabled: enviando }"
          >
            <ion-icon :icon="enviando ? hourglassOutline : sendOutline" />
            {{ enviando ? 'Enviando...' : 'Enviar Calificación' }}
          </button>
        </div>

        <div style="height: 40px" />
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonIcon
} from '@ionic/vue'
import {
  star, starOutline, checkmarkOutline, lockClosedOutline,
  bagCheckOutline, sendOutline, hourglassOutline
} from 'ionicons/icons'
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { db } from '../firebase/FirebaseConfig'
import { agregarCalificacion } from '../services/CalificationService'

const route = useRoute()
const router = useRouter()
const navigate = (path) => router.push(path)

const compraId = route.params.compraId
const puntaje = ref(5)
const comentario = ref('')
const estadoCompra = ref('')
const vendedorId = ref(null)
const vendedorNombre = ref('')
const nombreProducto = ref('')
const cargando = ref(true)
const enviando = ref(false)
const yaCalifico = ref(false)
const tagsSeleccionados = ref([])

const tagsDisponibles = [
  '✅ Entrega rápida', '📦 Bien empacado', '💬 Buena comunicación',
  '🌟 Como descrito', '🔄 Respondió rápido', '💰 Precio justo'
]

// ── Helpers ───────────────────────────────────────────
const getIniciales = (nombre) => {
  if (!nombre) return '?'
  return nombre.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

const getPuntajeLabel = (p) => {
  const labels = { 1: 'Muy malo 😞', 2: 'Malo 😕', 3: 'Regular 😐', 4: 'Muy bueno 😊', 5: 'Excelente 🌟' }
  return labels[p] || ''
}

const getPuntajeClass = (p) => {
  if (p >= 4) return 'label-bueno'
  if (p === 3) return 'label-medio'
  return 'label-malo'
}

const toggleTag = (tag) => {
  const idx = tagsSeleccionados.value.indexOf(tag)
  if (idx >= 0) tagsSeleccionados.value.splice(idx, 1)
  else if (tagsSeleccionados.value.length < 3) tagsSeleccionados.value.push(tag)
}

// ── Cargar datos de la compra ─────────────────────────
onMounted(async () => {
  try {
    const auth = getAuth()
    const user = auth.currentUser
    if (!user) { cargando.value = false; return }

    // Datos de la compra
    const compraSnap = await getDoc(doc(db, 'compras', compraId))
    if (compraSnap.exists()) {
      const data = compraSnap.data()
      estadoCompra.value = data.estado || 'En proceso'
      vendedorId.value = data.vendedorId

      // Nombre del producto
      if (data.productoId) {
        const prodSnap = await getDoc(doc(db, 'products', data.productoId))
        if (prodSnap.exists()) nombreProducto.value = prodSnap.data().nombre || ''
      }

      // Nombre del vendedor
      if (data.vendedorId) {
        const vendSnap = await getDoc(doc(db, 'users', data.vendedorId))
        if (vendSnap.exists()) vendedorNombre.value = vendSnap.data().name || ''
      }

      // Verificar si ya calificó
      const calSnap = await getDocs(
        query(
          collection(db, 'usuarios', data.vendedorId, 'calificaciones'),
          where('compraId', '==', compraId),
          where('compradorId', '==', user.uid)
        )
      )
      yaCalifico.value = !calSnap.empty
    }
  } catch (e) {
    console.error('Error al cargar compra:', e)
  } finally {
    cargando.value = false
  }
})

// ── Enviar calificación ───────────────────────────────
const enviarCalificacion = async () => {
  const auth = getAuth()
  const user = auth.currentUser
  if (!user) { alert('Debes estar autenticado.'); return }

  if (puntaje.value < 1 || puntaje.value > 5) {
    alert('El puntaje debe estar entre 1 y 5.')
    return
  }

  try {
    enviando.value = true

    const comentarioFinal = [
      comentario.value.trim(),
      tagsSeleccionados.value.join(' · ')
    ].filter(Boolean).join('\n')

    await agregarCalificacion(
      vendedorId.value,
      user.uid,
      puntaje.value,
      comentarioFinal,
      compraId  // pasar compraId para evitar duplicados
    )

    yaCalifico.value = true
  } catch (e) {
    console.error('Error al enviar calificación:', e)
    alert('Hubo un problema al enviar la calificación.')
  } finally {
    enviando.value = false
  }
}
</script>

<style scoped>
.cal-header { --background: #fff; border-bottom: 1px solid #eee; }
.cal-toolbar { --background: #fff; --color: #111; --min-height: 60px; padding: 0 8px; }
.cal-title { font-size: 1rem; font-weight: 800; color: #111; }
.back-btn { --color: #111; }
.cal-content { --background: #F5F5F5; }

/* ── Loading / estados ─────────────────────────────── */
.loading-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 80px 20px; color: #aaa; gap: 12px;
}
.loading-spinner {
  width: 36px; height: 36px;
  border: 3px solid #F5F5F5; border-top-color: #F5A623;
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.no-disponible, .ya-califico {
  display: flex; flex-direction: column; align-items: center;
  padding: 60px 30px; text-align: center;
}
.empty-icon-wrap {
  width: 72px; height: 72px; background: #FFF3E0;
  border-radius: 50%; display: flex; align-items: center;
  justify-content: center; margin-bottom: 16px;
}
.empty-icon { font-size: 2rem; color: #F5A623; }
.empty-title, .ya-title { font-size: 1rem; font-weight: 800; color: #111; margin: 0 0 8px; }
.empty-sub, .ya-sub { font-size: 0.82rem; color: #aaa; margin: 0 0 24px; line-height: 1.5; }

.check-wrap { margin-bottom: 20px; }
.check-circle {
  width: 72px; height: 72px; background: #27AE60;
  border-radius: 50%; display: flex; align-items: center;
  justify-content: center; font-size: 2rem; color: #fff;
  box-shadow: 0 8px 24px rgba(39,174,96,0.3);
}

.back-btn-alt, .volver-btn {
  background: #F5A623; border: none; border-radius: 20px;
  padding: 12px 28px; font-size: 0.88rem; font-weight: 700;
  cursor: pointer; color: #000;
}

/* ── Hero ──────────────────────────────────────────── */
.hero-section { background: #fff; padding: 20px 20px 22px; margin-bottom: 10px; }

.vendedor-info {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 16px; padding-bottom: 16px;
  border-bottom: 1px solid #F5F5F5;
}
.vendedor-avatar {
  width: 48px; height: 48px; background: #1A1D2E;
  border-radius: 50%; display: flex; align-items: center;
  justify-content: center; font-size: 0.9rem;
  font-weight: 800; color: #fff; flex-shrink: 0;
}
.vendedor-label { font-size: 0.6rem; font-weight: 700; color: #aaa; letter-spacing: 0.08em; margin: 0 0 2px; }
.vendedor-nombre { font-size: 0.95rem; font-weight: 800; color: #111; margin: 0; }

.hero-title { font-size: 1.5rem; font-weight: 900; color: #111; line-height: 1.2; margin: 0 0 6px; }
.hero-accent { color: #F5A623; }
.hero-sub { font-size: 0.8rem; color: #aaa; margin: 0; }

/* ── Producto ──────────────────────────────────────── */
.producto-card {
  background: #fff; margin: 0 16px 10px;
  border-radius: 14px; padding: 14px 16px;
  display: flex; align-items: center; gap: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.prod-icon { font-size: 1.3rem; color: #F5A623; flex-shrink: 0; }
.prod-label { font-size: 0.6rem; font-weight: 700; color: #aaa; letter-spacing: 0.08em; margin: 0 0 2px; }
.prod-nombre { font-size: 0.88rem; font-weight: 700; color: #111; margin: 0; }

/* ── Cards ─────────────────────────────────────────── */
.section-card {
  background: #fff; border-radius: 18px;
  margin: 0 16px 10px; padding: 18px 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.section-title { font-size: 0.78rem; font-weight: 800; color: #111; letter-spacing: 0.05em; text-transform: uppercase; margin: 0 0 14px; }

/* ── Estrellas ─────────────────────────────────────── */
.stars-selector { display: flex; gap: 10px; justify-content: center; margin-bottom: 10px; }
.star-btn { font-size: 2.2rem; color: #ddd; cursor: pointer; transition: transform 0.15s, color 0.15s; }
.star-btn.active { color: #F5A623; }
.star-btn:active { transform: scale(1.2); }

.puntaje-label { text-align: center; font-size: 0.88rem; font-weight: 700; margin: 0; }
.label-bueno { color: #27AE60; }
.label-medio { color: #F5A623; }
.label-malo  { color: #E53935; }

/* ── Comentario ────────────────────────────────────── */
.comentario-input {
  width: 100%; padding: 12px 14px;
  background: #F9F9F9; border: 1.5px solid #eee;
  border-radius: 12px; font-size: 0.88rem;
  color: #111; outline: none; resize: none;
  box-sizing: border-box; font-family: inherit;
  transition: border-color 0.2s;
}
.comentario-input:focus { border-color: #F5A623; }
.char-count { font-size: 0.68rem; color: #ccc; text-align: right; margin: 4px 0 0; }

/* ── Tags ──────────────────────────────────────────── */
.tags-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
.tag-btn {
  background: #F5F5F5; border: 1.5px solid #eee;
  border-radius: 20px; padding: 7px 12px;
  font-size: 0.75rem; font-weight: 600; color: #555;
  cursor: pointer; transition: all 0.15s;
}
.tag-btn.selected { background: #FFF8EE; border-color: #F5A623; color: #E07010; }

/* ── Submit ────────────────────────────────────────── */
.submit-wrap { padding: 4px 16px; }
.submit-btn {
  width: 100%; padding: 16px; background: #111; color: #fff;
  border: none; border-radius: 16px; font-size: 0.95rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  cursor: pointer; transition: background 0.2s;
}
.submit-btn:active { background: #333; }
.submit-btn.disabled { background: #ccc; cursor: not-allowed; }
.submit-btn ion-icon { font-size: 1.1rem; pointer-events: none; }
</style>