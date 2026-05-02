<template>
  <ion-page>
    <ion-header class="page-header">
      <ion-toolbar class="page-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/mi-cuenta" text="" class="back-btn" />
        </ion-buttons>
        <ion-title class="page-title">Seguridad</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="page-content">

      <div class="hero">
        <div class="hero-icon">
          <ion-icon :icon="shieldCheckmarkOutline" />
        </div>
        <div>
          <h2 class="hero-title">Tu Seguridad</h2>
          <p class="hero-sub">{{ correo }}</p>
        </div>
      </div>

      <div class="form-wrap">

        <div class="section-label">CAMBIAR CONTRASEÑA</div>
        <div class="form-card">
          <div class="field-group">
            <label class="field-label">Contraseña actual</label>
            <div class="pw-row">
              <input v-model="actual" class="field-input" :type="mostrarActual ? 'text' : 'password'" placeholder="••••••••" />
              <ion-icon :icon="mostrarActual ? eyeOffOutline : eyeOutline" class="eye-icon" @click="mostrarActual = !mostrarActual" />
            </div>
          </div>
          <div class="field-divider" />
          <div class="field-group">
            <label class="field-label">Nueva contraseña</label>
            <div class="pw-row">
              <input v-model="nueva" class="field-input" :type="mostrarNueva ? 'text' : 'password'" placeholder="••••••••" />
              <ion-icon :icon="mostrarNueva ? eyeOffOutline : eyeOutline" class="eye-icon" @click="mostrarNueva = !mostrarNueva" />
            </div>
          </div>
          <div class="field-divider" />
          <div class="field-group">
            <label class="field-label">Confirmar nueva contraseña</label>
            <div class="pw-row">
              <input v-model="confirmar" class="field-input" :type="mostrarConfirmar ? 'text' : 'password'" placeholder="••••••••" />
              <ion-icon :icon="mostrarConfirmar ? eyeOffOutline : eyeOutline" class="eye-icon" @click="mostrarConfirmar = !mostrarConfirmar" />
            </div>
          </div>
        </div>

        <button class="save-btn" @click="cambiarPassword" :disabled="cambiando">
          {{ cambiando ? 'Actualizando...' : 'Actualizar Contraseña' }}
        </button>

        <div class="section-label">AUTENTICACIÓN</div>
        <div class="info-card">
          <div class="info-row">
            <div class="info-icon">
              <ion-icon :icon="phonePortraitOutline" />
            </div>
            <div class="info-text">
              <p class="info-title">Verificación en 2 pasos</p>
              <p class="info-sub">Añade una capa extra de seguridad</p>
            </div>
            <span class="badge-soon">Pronto</span>
          </div>
        </div>

        <div class="section-label">SESIÓN ACTIVA</div>
        <div class="form-card">
          <div class="session-row">
            <div class="session-icon">
              <ion-icon :icon="phonePortraitOutline" />
            </div>
            <div>
              <p class="session-device">Este dispositivo</p>
              <p class="session-time">Sesión activa ahora</p>
            </div>
            <div class="session-dot" />
          </div>
        </div>

      </div>

      <div style="height: 40px" />
    </ion-content>

    <ion-toast
      :is-open="mostrarToast"
      :message="mensajeToast"
      :duration="3500"
      :color="colorToast"
      @didDismiss="mostrarToast = false"
    />
  </ion-page>
</template>

<script setup>
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonIcon, IonToast
} from '@ionic/vue'
import {
  shieldCheckmarkOutline, eyeOutline, eyeOffOutline, phonePortraitOutline
} from 'ionicons/icons'
import { ref, onMounted } from 'vue'
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'

const correo = ref('')
const actual = ref('')
const nueva = ref('')
const confirmar = ref('')
const mostrarActual = ref(false)
const mostrarNueva = ref(false)
const mostrarConfirmar = ref(false)
const cambiando = ref(false)
const mostrarToast = ref(false)
const mensajeToast = ref('')
const colorToast = ref('success')

onMounted(() => {
  correo.value = getAuth().currentUser?.email || ''
})

const cambiarPassword = async () => {
  if (!actual.value || !nueva.value || !confirmar.value) {
    mostrar('Completa todos los campos', 'warning'); return
  }
  if (nueva.value.length < 6) {
    mostrar('La nueva contraseña debe tener al menos 6 caracteres', 'warning'); return
  }
  if (nueva.value !== confirmar.value) {
    mostrar('Las contraseñas no coinciden', 'danger'); return
  }
  try {
    cambiando.value = true
    const auth = getAuth()
    const user = auth.currentUser
    const credential = EmailAuthProvider.credential(user.email, actual.value)
    await reauthenticateWithCredential(user, credential)
    await updatePassword(user, nueva.value)
    actual.value = ''; nueva.value = ''; confirmar.value = ''
    mostrar('Contraseña actualizada correctamente', 'success')
  } catch (e) {
    const msg = e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential'
      ? 'La contraseña actual es incorrecta'
      : 'Error al actualizar la contraseña'
    mostrar(msg, 'danger')
  } finally {
    cambiando.value = false
  }
}

const mostrar = (msg, color) => {
  mensajeToast.value = msg; colorToast.value = color; mostrarToast.value = true
}
</script>

<style scoped>
.page-header { --background: #ffffff; border-bottom: 1px solid #eee; }
.page-toolbar { --background: #ffffff; --color: #111; --min-height: 60px; padding: 0 8px; }
.page-title { font-size: 0.95rem; font-weight: 800; color: #111; }
.back-btn { --color: #111; }
.page-content { --background: #F5F5F5; }

.hero {
  background: #fff;
  display: flex; align-items: center; gap: 16px;
  padding: 24px 20px;
  margin-bottom: 12px;
}
.hero-icon {
  width: 52px; height: 52px;
  background: #1A1D2E; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.hero-icon ion-icon { font-size: 1.5rem; color: #F5A623; }
.hero-title { font-size: 1.1rem; font-weight: 900; color: #111; margin: 0 0 2px; }
.hero-sub { font-size: 0.78rem; color: #aaa; margin: 0; }

.form-wrap { padding: 0 16px; }

.section-label {
  font-size: 0.62rem; font-weight: 700; letter-spacing: 0.1em;
  color: #aaa; padding: 16px 4px 8px;
}

.form-card {
  background: #fff; border-radius: 18px;
  overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.field-group { padding: 14px 18px; }
.field-divider { height: 1px; background: #F5F5F5; margin: 0 18px; }

.field-label {
  display: block; font-size: 0.65rem; font-weight: 700;
  letter-spacing: 0.06em; color: #aaa; margin-bottom: 6px;
}
.pw-row { display: flex; align-items: center; gap: 8px; }
.field-input {
  flex: 1; border: none; outline: none;
  font-size: 0.92rem; font-weight: 600; color: #111;
  background: transparent; padding: 0; font-family: inherit;
}
.field-input::placeholder { color: #ccc; font-weight: 400; }
.eye-icon { font-size: 1.1rem; color: #ccc; cursor: pointer; flex-shrink: 0; }

.save-btn {
  width: 100%; margin-top: 20px; padding: 16px;
  background: #1A1D2E; color: #fff;
  border: none; border-radius: 16px;
  font-size: 0.92rem; font-weight: 800;
  cursor: pointer; letter-spacing: 0.03em;
  -webkit-tap-highlight-color: transparent;
}
.save-btn:disabled { opacity: 0.6; }

.info-card {
  background: #fff; border-radius: 18px;
  overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.info-row {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 18px;
}
.info-icon {
  width: 36px; height: 36px;
  background: #FFF3E0; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.info-icon ion-icon { font-size: 1rem; color: #F5A623; }
.info-text { flex: 1; }
.info-title { font-size: 0.88rem; font-weight: 700; color: #111; margin: 0 0 2px; }
.info-sub { font-size: 0.72rem; color: #aaa; margin: 0; }
.badge-soon {
  background: #FFF3E0; color: #F5A623;
  font-size: 0.62rem; font-weight: 800;
  padding: 4px 9px; border-radius: 20px; letter-spacing: 0.04em;
}

.session-row {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 18px;
}
.session-icon {
  width: 36px; height: 36px;
  background: #F5F5F5; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.session-icon ion-icon { font-size: 1rem; color: #555; }
.session-device { font-size: 0.88rem; font-weight: 700; color: #111; margin: 0 0 2px; flex: 1; }
.session-time { font-size: 0.72rem; color: #aaa; margin: 0; }
.session-dot { width: 8px; height: 8px; border-radius: 50%; background: #27AE60; flex-shrink: 0; }
</style>
