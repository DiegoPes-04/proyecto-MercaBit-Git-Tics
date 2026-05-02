<template>
  <ion-page>
    <ion-header class="page-header">
      <ion-toolbar class="page-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/mi-cuenta" text="" class="back-btn" />
        </ion-buttons>
        <ion-title class="page-title">Métodos de Pago</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="page-content">

      <!-- Balance -->
      <div class="balance-hero">
        <p class="balance-label">SALDO DISPONIBLE</p>
        <h1 class="balance-amount">${{ formatPrice(saldo) }}</h1>
        <p class="balance-currency">COP</p>
      </div>

      <div class="section-wrap">

        <div class="section-label">RECARGAR SALDO</div>

        <div class="method-card" @click="seleccionarMetodo('tarjeta')">
          <div class="method-icon">
            <ion-icon :icon="cardOutline" />
          </div>
          <div class="method-info">
            <p class="method-title">Tarjeta débito / crédito</p>
            <p class="method-sub">Visa, Mastercard, American Express</p>
          </div>
          <ion-icon :icon="chevronForwardOutline" class="method-arrow" />
        </div>

        <div class="method-card" @click="seleccionarMetodo('pse')">
          <div class="method-icon pse">
            <span class="pse-label">PSE</span>
          </div>
          <div class="method-info">
            <p class="method-title">PSE — Débito bancario</p>
            <p class="method-sub">Pago directo desde tu banco</p>
          </div>
          <ion-icon :icon="chevronForwardOutline" class="method-arrow" />
        </div>

        <div class="demo-notice">
          <ion-icon :icon="informationCircleOutline" />
          <span>Los pagos son solo demo. Ninguna transacción será procesada.</span>
        </div>

        <div class="section-label">HISTORIAL DE MOVIMIENTOS</div>
        <div class="empty-state">
          <ion-icon :icon="receiptOutline" class="empty-icon" />
          <p>No hay movimientos registrados</p>
        </div>

      </div>

      <div style="height: 40px" />
    </ion-content>

    <ion-toast
      :is-open="mostrarToast"
      :message="mensajeToast"
      :duration="2500"
      color="medium"
      @didDismiss="mostrarToast = false"
    />
  </ion-page>
</template>

<script setup>
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonIcon, IonToast
} from '@ionic/vue'
import { cardOutline, chevronForwardOutline, informationCircleOutline, receiptOutline } from 'ionicons/icons'
import { ref, onMounted } from 'vue'
import { auth, db } from '@/firebase/FirebaseConfig'
import { doc, getDoc } from 'firebase/firestore'

const saldo = ref(0)
const mostrarToast = ref(false)
const mensajeToast = ref('')

onMounted(async () => {
  const user = auth.currentUser
  if (!user) return
  const snap = await getDoc(doc(db, 'users', user.uid))
  if (snap.exists()) saldo.value = snap.data().saldo || 0
})

const formatPrice = (v) => v != null ? new Intl.NumberFormat('es-CO').format(v) : '0'

const seleccionarMetodo = (metodo) => {
  mensajeToast.value = metodo === 'pse'
    ? 'PSE no disponible en modo demo'
    : 'Pagos con tarjeta no disponibles en modo demo'
  mostrarToast.value = true
}
</script>

<style scoped>
.page-header { --background: #ffffff; border-bottom: 1px solid #eee; }
.page-toolbar { --background: #ffffff; --color: #111; --min-height: 60px; padding: 0 8px; }
.page-title { font-size: 0.95rem; font-weight: 800; color: #111; }
.back-btn { --color: #111; }
.page-content { --background: #F5F5F5; }

.balance-hero {
  background: #1A1D2E;
  padding: 40px 24px 36px;
  display: flex; flex-direction: column; align-items: center;
}
.balance-label {
  font-size: 0.62rem; font-weight: 700; letter-spacing: 0.12em;
  color: rgba(255,255,255,0.4); margin: 0 0 10px;
}
.balance-amount {
  font-size: 3rem; font-weight: 900; color: #fff;
  margin: 0; line-height: 1;
}
.balance-currency {
  font-size: 0.78rem; font-weight: 700;
  color: #F5A623; margin: 8px 0 0;
}

.section-wrap { padding: 0 16px; }

.section-label {
  font-size: 0.62rem; font-weight: 700; letter-spacing: 0.1em;
  color: #aaa; padding: 16px 4px 8px;
}

.method-card {
  background: #fff; border-radius: 18px;
  display: flex; align-items: center; gap: 14px;
  padding: 16px 18px; margin-bottom: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.method-card:active { opacity: 0.8; }

.method-icon {
  width: 46px; height: 46px;
  background: #FFF3E0; border-radius: 13px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.method-icon ion-icon { font-size: 1.3rem; color: #F5A623; }
.method-icon.pse { background: #e8f4fd; }
.pse-label { font-size: 0.78rem; font-weight: 900; color: #0065A8; letter-spacing: 0.04em; }

.method-info { flex: 1; }
.method-title { font-size: 0.9rem; font-weight: 700; color: #111; margin: 0 0 2px; }
.method-sub { font-size: 0.72rem; color: #aaa; margin: 0; }
.method-arrow { font-size: 0.9rem; color: #ccc; }

.demo-notice {
  display: flex; align-items: flex-start; gap: 8px;
  background: #FFF8EE; border: 1.5px solid #F5A623;
  border-radius: 14px; padding: 12px 14px;
  margin-bottom: 4px;
}
.demo-notice ion-icon { font-size: 0.95rem; color: #F5A623; flex-shrink: 0; margin-top: 1px; }
.demo-notice span { font-size: 0.75rem; color: #666; line-height: 1.4; }

.empty-state {
  background: #fff; border-radius: 18px;
  padding: 32px 20px;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.empty-icon { font-size: 2.2rem; color: #ddd; }
.empty-state p { font-size: 0.82rem; color: #aaa; margin: 0; }
</style>
