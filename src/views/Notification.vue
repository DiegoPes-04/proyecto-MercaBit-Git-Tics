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
                v-if="getTipoAccion(notificacion)"
                class="action-btn"
                :class="getTipoClass(notificacion)"
                @click="accionPrincipal(notificacion)"
                :disabled="pagandoId === notificacion.id"
              >
                {{ pagandoId === notificacion.id ? 'Procesando...' : getTipoAccion(notificacion) }}
              </button>

              <!-- Botón reportar incumplimiento (solo para pago_fallido al vendedor) -->
              <button
                v-if="(notificacion.tipo || '').toLowerCase() === 'pago_fallido'"
                class="report-incumplimiento-btn"
                @click="abrirReporteIncumplimiento(notificacion)"
              >
                <ion-icon :icon="flagOutline" /> Reportar incumplimiento
              </button>

              <button class="delete-btn" @click="eliminarNotificacion(notificacion.id)">
                <ion-icon :icon="trashOutline" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal reporte incumplimiento -->
      <div class="report-overlay" v-if="reportModalVisible" @click.self="reportModalVisible = false">
        <div class="report-sheet">
          <div class="report-handle" />
          <h3 class="report-title">Reportar Incumplimiento</h3>
          <p class="report-sub">El reporte es anónimo. El administrador revisará el caso y tomará las medidas necesarias.</p>

          <textarea
            v-model="reportComentario"
            class="report-textarea"
            placeholder="Describe el incumplimiento (mínimo 20 caracteres)..."
            rows="4"
            maxlength="300"
          />
          <p class="char-count">{{ reportComentario.length }}/300</p>

          <button
            class="report-submit-btn"
            @click="enviarReporteIncumplimiento"
            :disabled="reportComentario.length < 20 || enviandoReporteIncumplimiento"
          >
            {{ enviandoReporteIncumplimiento ? 'Enviando...' : '🚨 Enviar reporte' }}
          </button>
          <button class="report-cancel-btn" @click="reportModalVisible = false">Cancelar</button>
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
  trophyOutline, alertCircleOutline, flagOutline,
  closeCircleOutline, checkmarkCircleOutline, cashOutline,
  walletOutline, carOutline, timeOutline,
  homeOutline, gridOutline, searchOutline, layersOutline,
  notificationsSharp, personOutline
} from 'ionicons/icons'
import { onMounted, ref } from 'vue'
import { db } from '../firebase/FirebaseConfig'
import { collection, query, where, onSnapshot, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { useRouter } from 'vue-router'

const PAGO_URL = `https://us-central1-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net/realizarPago`

const notificaciones = ref([])
const router = useRouter()
const navigate = (path) => router.push(path)

// ── Reporte de incumplimiento ─────────────────────────
const reportModalVisible = ref(false)
const reportComentario = ref('')
const enviandoReporteIncumplimiento = ref(false)
const notifReportando = ref(null)

const abrirReporteIncumplimiento = (notif) => {
  notifReportando.value = notif
  reportComentario.value = ''
  reportModalVisible.value = true
}

const enviarReporteIncumplimiento = async () => {
  if (reportComentario.value.length < 20 || enviandoReporteIncumplimiento.value) return
  const auth = getAuth()
  const user = auth.currentUser
  if (!user || !notifReportando.value) return
  try {
    enviandoReporteIncumplimiento.value = true
    await addDoc(collection(db, 'reportes'), {
      tipo: 'incumplimiento',
      denuncianteId: user.uid,
      denunciadoId: notifReportando.value.compradorId || '',
      productoId: notifReportando.value.productoId || '',
      productoNombre: notifReportando.value.productoNombre || '',
      comentario: reportComentario.value.trim(),
      estado: 'pendiente',
      fecha: serverTimestamp()
    })
    reportModalVisible.value = false
    alert('Reporte enviado. El equipo de MercaBit revisará el caso.')
  } catch (e) {
    console.error(e)
    alert('Error al enviar el reporte.')
  } finally {
    enviandoReporteIncumplimiento.value = false
  }
}

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

const esGanador = (notif) => {
  const tipo = (notif.tipo || '').toLowerCase()
  return tipo === 'ganaste' || tipo.includes('win')
}

const pagandoId = ref(null)

const realizarPago = async (notif) => {
  if (pagandoId.value) return
  pagandoId.value = notif.id
  try {
    const user = getAuth().currentUser
    if (!user) throw new Error('No autenticado')

    const idToken = await user.getIdToken()
    const response = await fetch(PAGO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ productoId: notif.productoId })
    })
    const result = await response.json()

    if (result.success) {
      router.push('/Miscompras')
    } else if (result.reason === 'saldo_insuficiente') {
      alert('No tienes saldo suficiente. Se ha notificado al vendedor.')
    } else {
      throw new Error(result.error || 'Error desconocido')
    }
  } catch (e) {
    console.error(e)
    alert('Error al procesar el pago. Intenta de nuevo.')
  } finally {
    pagandoId.value = null
  }
}

const accionPrincipal = async (notif) => {
  if (esGanador(notif)) {
    await realizarPago(notif)
    return
  }

  const tipo = (notif.tipo || '').toLowerCase()

  if (tipo.includes('rechazad')) { router.push('/mis-publicaciones'); return }
  if (tipo === 'pago_procesado' || tipo === 'saldo_insuficiente') { router.push('/Miscompras'); return }
  if (tipo === 'pago_recibido' || tipo.includes('venta')) { router.push('/mis-publicaciones'); return }

  if (notif.productoId) router.push(`/producto/${notif.productoId}`)
}

// Helpers de tipo
const getTipoClass = (notif) => {
  const tipo = (notif.tipo || '').toLowerCase()
  if (tipo === 'pago_recibido' || tipo === 'pago_procesado') return 'tipo-green'
  if (tipo === 'ganaste' || tipo.includes('win')) return 'tipo-green'
  if (tipo.includes('aprobad') || tipo.includes('venta')) return 'tipo-green'
  if (tipo === 'pago_pendiente' || tipo.includes('super') || tipo.includes('puja')) return 'tipo-orange'
  if (tipo === 'pago_fallido' || tipo === 'saldo_insuficiente' || tipo.includes('rechazad')) return 'tipo-red'
  return 'tipo-red'
}

const getTipoIcon = (notif) => {
  const tipo = (notif.tipo || '').toLowerCase()
  if (tipo === 'pago_recibido') return cashOutline
  if (tipo === 'pago_procesado') return checkmarkCircleOutline
  if (tipo === 'pago_pendiente') return timeOutline
  if (tipo === 'pago_fallido' || tipo === 'saldo_insuficiente') return walletOutline
  if (tipo === 'ganaste' || tipo.includes('win')) return trophyOutline
  if (tipo.includes('aprobad') || tipo.includes('venta')) return checkmarkCircleOutline
  if (tipo.includes('super') || tipo.includes('puja')) return carOutline
  if (tipo.includes('rechazad')) return closeCircleOutline
  return alertCircleOutline
}

const getTipoLabel = (notif) => {
  return notif.titulo || notif.tipo || 'Notificación'
}

const getTipoAccion = (notif) => {
  const tipo = (notif.tipo || '').toLowerCase()
  if (tipo === 'ganaste' || tipo.includes('win')) return '💳 Realizar pago'
  if (tipo === 'pago_procesado') return '📦 Ver mis compras'
  if (tipo === 'pago_recibido' || tipo.includes('venta')) return '💰 Ver mis ventas'
  if (tipo === 'pago_pendiente') return null
  if (tipo === 'pago_fallido') return null
  if (tipo === 'saldo_insuficiente') return '💳 Ver mis compras'
  if (tipo.includes('rechazad')) return 'Ver mis publicaciones'
  if (tipo.includes('aprobad')) return 'Ver publicación'
  if (tipo.includes('super') || tipo.includes('puja')) return 'Contraofertar'
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

.report-incumplimiento-btn {
  display: flex; align-items: center; gap: 5px;
  border: 1.5px solid #E53935; background: #FFF0F0;
  color: #E53935; border-radius: 20px;
  padding: 8px 14px; font-size: 0.75rem; font-weight: 700;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.report-incumplimiento-btn ion-icon { font-size: 0.85rem; pointer-events: none; }

/* ── Modal reporte incumplimiento ──────────────────── */
.report-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  z-index: 1000; display: flex; align-items: flex-end;
}
.report-sheet {
  background: #fff; border-radius: 24px 24px 0 0;
  padding: 12px 20px 40px; width: 100%;
  animation: slideUp 0.25s ease;
}
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.report-handle {
  width: 40px; height: 4px; background: #E0E0E0;
  border-radius: 2px; margin: 0 auto 20px;
}
.report-title { font-size: 1.1rem; font-weight: 900; color: #111; margin: 0 0 4px; }
.report-sub { font-size: 0.78rem; color: #aaa; margin: 0 0 16px; line-height: 1.5; }
.report-textarea {
  width: 100%; border: 1.5px solid #eee; border-radius: 14px;
  padding: 12px 14px; font-size: 0.85rem; color: #111;
  background: #F9F9F9; outline: none; resize: none;
  font-family: inherit; box-sizing: border-box;
}
.report-textarea:focus { border-color: #E53935; }
.char-count { font-size: 0.68rem; color: #ccc; text-align: right; margin: 4px 0 14px; }
.report-submit-btn {
  width: 100%; padding: 15px; background: #E53935; color: #fff;
  border: none; border-radius: 14px; font-size: 0.92rem; font-weight: 800;
  cursor: pointer; margin-bottom: 10px;
}
.report-submit-btn:disabled { background: #ddd; cursor: not-allowed; }
.report-cancel-btn {
  width: 100%; padding: 13px; background: #F5F5F5; color: #777;
  border: none; border-radius: 14px; font-size: 0.88rem; font-weight: 700;
  cursor: pointer;
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