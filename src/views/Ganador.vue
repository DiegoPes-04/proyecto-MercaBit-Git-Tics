<template>
  <ion-page>
    <ion-content class="ganador-content" :fullscreen="true">
      <div class="celebration">
        <div class="confetti">
          <span class="emoji" v-for="i in 12" :key="i" :style="confettiStyle(i)">🎉</span>
        </div>

        <div class="trophy-wrap">
          <ion-icon :icon="trophyOutline" class="trophy" />
        </div>

        <h1 class="title">¡FELICITACIONES!</h1>
        <p class="subtitle">Ganaste la subasta</p>

        <div class="product-card" v-if="producto">
          <p class="product-label">PRODUCTO</p>
          <h2 class="product-name">{{ producto.nombre }}</h2>
          <div class="divider" />
          <p class="price-label">PRECIO FINAL</p>
          <p class="price">${{ precioFormateado }} <span class="cop">COP</span></p>
        </div>

        <div class="actions">
          <button class="btn-pay" @click="realizarPago" :disabled="pagando">
            <ion-icon :icon="cardOutline" />
            <span>{{ pagando ? 'Procesando...' : 'Realizar pago ahora' }}</span>
          </button>
          <button class="btn-later" @click="pagarDespues" :disabled="pagando">
            Pagar después
          </button>
        </div>

        <p class="warning">
          <ion-icon :icon="alertCircleOutline" />
          Tienes 24 horas para completar el pago
        </p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonPage, IonContent, IonIcon } from '@ionic/vue'
import { trophyOutline, cardOutline, alertCircleOutline } from 'ionicons/icons'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase/FirebaseConfig'
import { getAuth } from 'firebase/auth'
import { playWinner, stopWinner } from '@/composables/useSounds'

const route = useRoute()
const router = useRouter()
const producto = ref(null)
const pagando = ref(false)

const PAGO_URL = `https://us-central1-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net/realizarPago`

const precioFormateado = computed(() =>
  Number(producto.value?.precioBase || 0).toLocaleString('es-CO')
)

const confettiStyle = (i) => {
  const left = (i * 8.3) % 100
  const delay = (i * 0.2) % 2
  return { left: `${left}%`, animationDelay: `${delay}s` }
}

onMounted(async () => {
  playWinner()
  const id = route.params.productoId
  if (!id) return
  try {
    const snap = await getDoc(doc(db, 'products', id))
    if (snap.exists()) producto.value = snap.data()
  } catch (e) {
    console.error('Error cargando producto:', e)
  }
})

onUnmounted(() => {
  stopWinner()
})

const realizarPago = async () => {
  if (pagando.value) return
  pagando.value = true
  try {
    const user = getAuth().currentUser
    const idToken = await user.getIdToken()
    const response = await fetch(PAGO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ productoId: route.params.productoId })
    })
    const result = await response.json()
    if (result.success) {
      stopWinner()
      router.replace('/Miscompras')
    } else if (result.reason === 'saldo_insuficiente') {
      alert('No tienes saldo suficiente. Se ha notificado al vendedor.')
    } else {
      alert(result.error || 'Error al procesar el pago.')
    }
  } catch (e) {
    console.error(e)
    alert('Error al procesar el pago. Intenta de nuevo.')
  } finally {
    pagando.value = false
  }
}

const pagarDespues = () => {
  stopWinner()
  router.replace('/Notification')
}
</script>

<style scoped>
.ganador-content {
  --background: linear-gradient(180deg, #1A1D2E 0%, #2C2F4A 100%);
  --color: #fff;
}

.celebration {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  position: relative;
  overflow: hidden;
}

/* ── Confetti ──────────────────────────────────────── */
.confetti {
  position: absolute;
  top: 0; left: 0; right: 0; height: 100%;
  pointer-events: none;
}
.emoji {
  position: absolute;
  top: -40px;
  font-size: 1.6rem;
  animation: fall 4s linear infinite;
}
@keyframes fall {
  0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(110vh) rotate(720deg); opacity: 0.6; }
}

/* ── Trophy ────────────────────────────────────────── */
.trophy-wrap {
  width: 110px; height: 110px;
  background: linear-gradient(135deg, #F5A623, #E07010);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 24px;
  box-shadow: 0 10px 40px rgba(245, 166, 35, 0.5);
  animation: pulse 2s ease-in-out infinite;
}
.trophy {
  font-size: 4rem; color: #fff;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.05); }
}

/* ── Texts ─────────────────────────────────────────── */
.title {
  font-size: 1.8rem; font-weight: 900;
  color: #fff; margin: 0 0 8px;
  letter-spacing: 0.05em; text-align: center;
  text-shadow: 0 4px 20px rgba(245, 166, 35, 0.3);
}
.subtitle {
  font-size: 1rem; color: #F5A623;
  margin: 0 0 32px; font-weight: 600;
  text-align: center;
}

/* ── Product card ──────────────────────────────────── */
.product-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 24px 20px;
  width: 100%; max-width: 360px;
  margin-bottom: 24px;
  text-align: center;
}
.product-label, .price-label {
  font-size: 0.65rem; font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.1em; margin: 0 0 8px;
}
.product-name {
  font-size: 1.15rem; font-weight: 800;
  color: #fff; margin: 0;
}
.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 16px 0;
}
.price {
  font-size: 1.8rem; font-weight: 900;
  color: #F5A623; margin: 0;
}
.cop {
  font-size: 0.85rem; color: rgba(255, 255, 255, 0.6);
  font-weight: 700; margin-left: 4px;
}

/* ── Actions ───────────────────────────────────────── */
.actions {
  display: flex; flex-direction: column;
  gap: 10px; width: 100%; max-width: 360px;
  margin-bottom: 18px;
}
.btn-pay {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 16px;
  background: #F5A623; color: #1A1D2E;
  border: none; border-radius: 14px;
  font-size: 0.95rem; font-weight: 800;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(245, 166, 35, 0.4);
  transition: transform 0.1s;
}
.btn-pay:active { transform: scale(0.98); }
.btn-pay:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-pay ion-icon { font-size: 1.2rem; }

.btn-later {
  padding: 14px;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  font-size: 0.85rem; font-weight: 600;
  cursor: pointer;
}
.btn-later:disabled { opacity: 0.5; }

/* ── Warning ───────────────────────────────────────── */
.warning {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0; text-align: center;
}
.warning ion-icon { font-size: 0.9rem; color: #F5A623; }
</style>
