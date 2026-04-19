<template>
  <ion-page>
    <ion-header class="terminos-header">
      <ion-toolbar class="terminos-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/accerca-de-la-app" class="back-btn" text="" />
        </ion-buttons>
        <ion-title class="terminos-title">Términos y Condiciones</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="terminos-content">

      <!-- Hero -->
      <div class="hero">
        <div class="brand-icon">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="11" height="11" rx="2" fill="#F5A623"/>
            <rect x="21" y="4" width="11" height="11" rx="2" fill="#F5A623"/>
            <rect x="4" y="21" width="11" height="11" rx="2" fill="#F5A623"/>
            <rect x="21" y="21" width="11" height="11" rx="2" fill="#F5A623"/>
          </svg>
        </div>
        <h1 class="hero-title">Términos y<br /><span class="hero-accent">Condiciones</span></h1>
        <p class="hero-sub">Última actualización: 2025</p>
      </div>

      <!-- Secciones -->
      <div class="sections-wrap">

        <div class="term-section" v-for="(item, i) in terminos" :key="i">
          <div class="term-header" @click="item.open = !item.open">
            <div class="term-icon-wrap">
              <ion-icon :icon="item.icon" />
            </div>
            <span class="term-title">{{ item.titulo }}</span>
            <ion-icon
              :icon="item.open ? chevronUpOutline : chevronDownOutline"
              class="term-chevron"
            />
          </div>
          <div class="term-body" v-if="item.open">
            <p>{{ item.texto }}</p>
          </div>
        </div>

        <!-- Contacto -->
        <div class="contact-card">
          <ion-icon :icon="mailOutline" class="contact-icon" />
          <div>
            <p class="contact-label">¿Tienes dudas?</p>
            <p class="contact-email">admin@mercabit.com</p>
          </div>
        </div>

      </div>

      <div style="height: 40px" />
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonIcon
} from '@ionic/vue'
import {
  chevronDownOutline, chevronUpOutline, mailOutline,
  peopleOutline, lockClosedOutline, documentTextOutline,
  shieldCheckmarkOutline, alertCircleOutline, refreshOutline
} from 'ionicons/icons'
import { reactive } from 'vue'

const terminos = reactive([
  {
    titulo: 'Uso de la aplicación',
    icon: documentTextOutline,
    open: true,
    texto: 'Al utilizar esta aplicación, aceptas los presentes Términos y Condiciones. MercaBit está destinada a usuarios mayores de 13 años y requiere que toda la información proporcionada sea veraz y actualizada.'
  },
  {
    titulo: 'Responsabilidad del usuario',
    icon: peopleOutline,
    open: false,
    texto: 'Eres responsable de mantener la confidencialidad de tu cuenta y de cualquier actividad que se realice bajo la misma. No compartas tus credenciales con terceros.'
  },
  {
    titulo: 'Propiedad intelectual',
    icon: lockClosedOutline,
    open: false,
    texto: 'Todo el contenido de la app es propiedad de MercaBit y está protegido por derechos de autor. Se prohíbe su reproducción sin autorización expresa.'
  },
  {
    titulo: 'Uso prohibido',
    icon: alertCircleOutline,
    open: false,
    texto: 'Se prohíbe el uso de la aplicación para fines ilegales, fraudulentos o no autorizados. El incumplimiento puede derivar en la suspensión inmediata de la cuenta.'
  },
  {
    titulo: 'Modificaciones',
    icon: refreshOutline,
    open: false,
    texto: 'Nos reservamos el derecho de modificar estos términos en cualquier momento. El uso continuo de la app después de dichos cambios constituye tu aceptación.'
  },
  {
    titulo: 'Limitación de responsabilidad',
    icon: shieldCheckmarkOutline,
    open: false,
    texto: 'MercaBit no se hace responsable de daños directos o indirectos derivados del uso de la aplicación. Estos términos se rigen por las leyes del país donde opera MercaBit.'
  },
])
</script>

<style scoped>
.terminos-header { --background: #ffffff; border-bottom: 1px solid #eee; }
.terminos-toolbar { --background: #ffffff; --color: #111; --min-height: 60px; padding: 0 8px; }
.terminos-title { font-size: 0.95rem; font-weight: 800; color: #111; }
.back-btn { --color: #111; }
.terminos-content { --background: #F5F5F5; }

/* ── Hero ──────────────────────────────────────────── */
.hero {
  background: #fff;
  padding: 28px 20px 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 12px;
}

.brand-icon {
  width: 52px; height: 52px;
  background: #111;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 16px;
}

.hero-title {
  font-size: 1.6rem;
  font-weight: 900;
  color: #111;
  line-height: 1.2;
  margin: 0 0 8px;
}

.hero-accent { color: #F5A623; }

.hero-sub { font-size: 0.75rem; color: #aaa; margin: 0; }

/* ── Sections ──────────────────────────────────────── */
.sections-wrap { padding: 0 16px; display: flex; flex-direction: column; gap: 8px; }

.term-section {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.term-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.term-icon-wrap {
  width: 34px; height: 34px;
  background: #FFF3E0;
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.term-icon-wrap ion-icon { font-size: 1rem; color: #F5A623; }

.term-title {
  flex: 1;
  font-size: 0.88rem;
  font-weight: 700;
  color: #111;
}

.term-chevron { font-size: 1rem; color: #ccc; }

.term-body {
  padding: 0 16px 16px 62px;
}

.term-body p {
  font-size: 0.82rem;
  color: #666;
  line-height: 1.6;
  margin: 0;
}

/* ── Contact ───────────────────────────────────────── */
.contact-card {
  background: #FFF8EE;
  border: 1.5px solid #F5A623;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 4px;
}

.contact-icon { font-size: 1.5rem; color: #F5A623; flex-shrink: 0; }
.contact-label { font-size: 0.72rem; color: #888; margin: 0 0 2px; }
.contact-email { font-size: 0.9rem; font-weight: 700; color: #111; margin: 0; }
</style>