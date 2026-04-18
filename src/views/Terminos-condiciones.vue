<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/acerca-de"></ion-back-button>
        </ion-buttons>
        <ion-title>Términos y Condiciones</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="container">
        <ion-card class="login-card">

          <!-- Ícono de marca consistente con el resto de la app -->
          <div class="logo">
            <div class="brand-icon">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="11" height="11" rx="2" fill="white"/>
                <rect x="21" y="4" width="11" height="11" rx="2" fill="white"/>
                <rect x="4" y="21" width="11" height="11" rx="2" fill="white"/>
                <rect x="21" y="21" width="11" height="11" rx="2" fill="white"/>
              </svg>
            </div>
          </div>

          <ion-text class="version-text">Resumen de términos y condiciones</ion-text>
          <div class="contenedor">
            <p>
              Al utilizar esta aplicación, aceptas los presentes Términos y Condiciones. MercaBit está destinada a usuarios mayores de 13 años y requiere que toda la información proporcionada sea veraz y actualizada. Eres responsable de mantener la confidencialidad de tu cuenta y cualquier actividad bajo la misma. Todo el contenido de la app es propiedad de MercaBit y está protegido por derechos de autor. Se prohíbe el uso de la aplicación para fines ilegales, fraudulentos o no autorizados. Nos reservamos el derecho de modificar estos términos en cualquier momento. El uso continuo de la app después de dichos cambios constituye tu aceptación. MercaBit no se hace responsable de daños directos o indirectos derivados del uso de la aplicación. Estos términos se rigen por las leyes del país donde opera MercaBit. Para más información, puedes contactarnos a través de admin@mercabit.com.
            </p>
          </div>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonText
} from '@ionic/vue';
</script>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100%;
  padding: 20px 0;
}

.login-card {
  width: 90%;
  max-width: 400px;
  padding: 20px;
  text-align: center;
  background: white;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);
  margin: auto;
}

/* ── Ícono de marca ─────────────────────────────── */
.logo {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.brand-icon {
  width: 72px;
  height: 72px;
  background: #1A1D2E;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.version-text {
  display: block;
  margin-bottom: 20px;
  color: #444;
  font-size: 0.95rem;
  font-weight: bold;
}

.contenedor {
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #ddd;
  text-align: justify;
  font-family: sans-serif;
  font-size: 0.85rem;
  line-height: 1.4;
  color: #333;
  margin-bottom: 15px;
}
</style>