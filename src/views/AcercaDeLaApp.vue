<template>
  <ion-page>
    <ion-header class="header">
      <ion-toolbar class="toolbar">
        <ion-buttons slot="start">
          <ion-back-button text="" default-href="/home" class="back-btn" />
        </ion-buttons>
        <ion-title class="toolbar-title">Acerca de</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="page-content">

      <!-- Hero -->
      <div class="hero">
        <div class="brand-icon">
          <svg width="40" height="40" viewBox="0 0 36 36" fill="none">
            <rect x="4" y="4" width="11" height="11" rx="2" fill="white"/>
            <rect x="21" y="4" width="11" height="11" rx="2" fill="white"/>
            <rect x="4" y="21" width="11" height="11" rx="2" fill="white"/>
            <rect x="21" y="21" width="11" height="11" rx="2" fill="white"/>
          </svg>
        </div>
        <h1 class="brand-name">Merca<span class="accent">Bit</span></h1>
        <p class="brand-tagline">Puja. Gana. Confía.</p>
        <div class="version-badge">v 1.0.0</div>
      </div>

      <!-- Descripción -->
      <div class="section-card">
        <h3 class="section-title">¿Qué es MercaBit?</h3>
        <p class="section-text">
          MercaBit es una plataforma de subastas en línea diseñada para Colombia, donde vendedores y compradores se conectan de forma segura, transparente y en tiempo real.
        </p>
      </div>

      <!-- Características -->
      <div class="section-card">
        <h3 class="section-title">Características</h3>
        <div class="features-list">
          <div class="feature-item" v-for="f in features" :key="f.icon">
            <div class="feature-icon">{{ f.icon }}</div>
            <div>
              <p class="feature-name">{{ f.name }}</p>
              <p class="feature-desc">{{ f.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Info -->
      <div class="section-card">
        <h3 class="section-title">Información</h3>
        <div class="info-list">
          <div class="info-row" v-for="item in info" :key="item.label">
            <span class="info-label">{{ item.label }}</span>
            <span class="info-value">{{ item.value }}</span>
          </div>
        </div>
      </div>

      <!-- Botones -->
      <div class="actions">
        <button class="action-btn primary" @click="goToTermCond">
          📄 Términos y Condiciones
        </button>
        <button class="action-btn secondary" @click="goBack">
          ← Volver
        </button>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>Hecho con ❤️ en Cali, Colombia</p>
        <p>Copyright © 2025 MercaBit. Todos los derechos reservados.</p>
      </div>

      <div style="height: 40px" />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton } from '@ionic/vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const goToTermCond = () => router.push('/terminos-condiciones')
const goBack = () => router.back()

const features = [
  { icon: '⚡', name: 'Subastas en tiempo real', desc: 'Ofertas instantáneas con timer dinámico' },
  { icon: '🔒', name: 'Seguro y confiable', desc: 'Verificación de compradores y vendedores' },
  { icon: '🔔', name: 'Notificaciones push', desc: 'Alertas inmediatas de tus subastas' },
  { icon: '⭐', name: 'Sistema de calificaciones', desc: 'Reputación basada en experiencias reales' },
  { icon: '💰', name: 'Cierre inmediato (BuyNow)', desc: 'Compra al instante al precio fijo' },
]

const info = [
  { label: 'Versión', value: '1.0.0' },
  { label: 'Plataforma', value: 'iOS & Android' },
  { label: 'Desarrollado con', value: 'Vue 3 + Ionic' },
  { label: 'Backend', value: 'Firebase' },
  { label: 'País', value: '🇨🇴 Colombia' },
  { label: 'Ciudad', value: 'Cali, Valle del Cauca' },
]
</script>

<style scoped>
.header { --background: #fff; border-bottom: 1px solid #eee; }
.toolbar { --background: #fff; --color: #111; --min-height: 60px; }
.toolbar-title { font-size: 1rem; font-weight: 800; color: #111; }
.back-btn { --color: #111; }
.page-content { --background: #F5F5F5; }

/* Hero */
.hero {
  background: #1A1D2E;
  padding: 40px 20px 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 12px;
}

.brand-icon {
  width: 80px; height: 80px;
  background: rgba(255,255,255,0.1);
  border-radius: 24px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 16px;
  border: 2px solid rgba(255,255,255,0.15);
}

.brand-name {
  font-size: 2rem; font-weight: 900;
  color: #fff; margin: 0 0 6px;
  letter-spacing: 2px;
}
.accent { color: #F5A623; }

.brand-tagline {
  font-size: 0.88rem; color: rgba(255,255,255,0.5);
  margin: 0 0 16px; letter-spacing: 1px;
}

.version-badge {
  background: rgba(245,166,35,0.2);
  color: #F5A623;
  font-size: 0.75rem; font-weight: 800;
  padding: 5px 16px; border-radius: 20px;
  border: 1px solid rgba(245,166,35,0.3);
}

/* Cards */
.section-card {
  background: #fff; border-radius: 18px;
  margin: 0 16px 12px; padding: 18px 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.section-title {
  font-size: 0.82rem; font-weight: 800;
  color: #111; margin: 0 0 14px;
  text-transform: uppercase; letter-spacing: 0.06em;
}
.section-text {
  font-size: 0.85rem; color: #555;
  line-height: 1.6; margin: 0;
}

/* Features */
.features-list { display: flex; flex-direction: column; gap: 12px; }
.feature-item { display: flex; align-items: flex-start; gap: 12px; }
.feature-icon { font-size: 1.3rem; flex-shrink: 0; width: 36px; height: 36px; background: #F9F9F9; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.feature-name { font-size: 0.85rem; font-weight: 700; color: #111; margin: 0 0 2px; }
.feature-desc { font-size: 0.72rem; color: #aaa; margin: 0; }

/* Info */
.info-list { display: flex; flex-direction: column; gap: 0; }
.info-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #F5F5F5; }
.info-row:last-child { border-bottom: none; }
.info-label { font-size: 0.82rem; color: #888; }
.info-value { font-size: 0.82rem; font-weight: 700; color: #111; }

/* Botones */
.actions { padding: 4px 16px; display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
.action-btn { width: 100%; padding: 15px; border: none; border-radius: 14px; font-size: 0.9rem; font-weight: 700; cursor: pointer; }
.action-btn.primary { background: #1A1D2E; color: #fff; }
.action-btn.secondary { background: #F5F5F5; color: #555; }

/* Footer */
.footer { text-align: center; padding: 0 20px; }
.footer p { font-size: 0.72rem; color: #ccc; margin: 4px 0; }
</style>