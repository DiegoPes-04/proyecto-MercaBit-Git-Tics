<template>
  <ion-page class="recover-page">
    <ion-content :scroll-y="false" class="recover-content">
      <div class="recover-wrapper">

        <!-- Ilustración escudo + candado -->
        <div class="illustration">
          <svg width="180" height="160" viewBox="0 0 180 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Escudo fondo -->
            <path d="M90 8L24 36V84C24 118 53 148 90 158C127 148 156 118 156 84V36L90 8Z" fill="#EFEFED"/>
            <!-- Círculo del candado -->
            <circle cx="90" cy="82" r="28" fill="#1A1D2E"/>
            <!-- Candado icono -->
            <path d="M97 78V75C97 71.13 93.87 68 90 68C86.13 68 83 71.13 83 75V78H81V92H99V78H97ZM90 88C88.9 88 88 87.1 88 86C88 84.9 88.9 84 90 84C91.1 84 92 84.9 92 86C92 87.1 91.1 88 90 88ZM95 78H85V75C85 72.24 87.24 70 90 70C92.76 70 95 72.24 95 75V78Z" fill="white"/>
          </svg>
        </div>

        <!-- Título -->
        <div class="title-section">
          <h1 class="page-title">Restablecer<br>contraseña</h1>
          <p class="page-subtitle">Te enviaremos un enlace a tu correo<br>para que puedas volver a entrar.</p>
        </div>

        <!-- Formulario -->
        <div class="form-section">

          <!-- Campo correo -->
          <div class="field-group">
            <label class="field-label">CORREO ELECTRÓNICO</label>
            <div class="input-wrapper">
              <input
                v-model="email"
                type="email"
                placeholder="tu@ejemplo.com"
                class="field-input"
                :class="{ 'field-input--error': showError }"
                autocomplete="email"
                @keyup.enter="handleReset"
              />
            </div>
            <transition name="fade">
              <span v-if="showError" class="field-error">Ingresa un correo válido.</span>
            </transition>
          </div>

          <!-- Mensaje de respuesta -->
          <transition name="fade">
            <div v-if="mensaje" class="mensaje-banner" :class="mensajeExito ? 'mensaje-banner--success' : 'mensaje-banner--error'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="flex-shrink:0">
                <path v-if="mensajeExito" d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="#2E7D32"/>
                <path v-else d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="#E53935"/>
              </svg>
              {{ mensaje }}
            </div>
          </transition>

          <!-- Botón enviar -->
          <button
            class="btn-submit"
            @click="handleReset"
            :disabled="loading"
          >
            <span v-if="!loading" class="btn-submit__text">ENVIAR ENLACE</span>
            <span v-else class="btn-submit__spinner"></span>
          </button>

          <!-- Volver al login -->
          <p class="back-link" @click="goToLogin">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="vertical-align:middle; margin-right:4px;">
              <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="#1A1D2E"/>
            </svg>
            Volver al inicio de sesión
          </p>

        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { IonPage, IonContent } from '@ionic/vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { resetPassword } from '@/services/authService';

export default {
  name: 'RecuperarContrasena',
  components: { IonPage, IonContent },

  setup() {
    const router      = useRouter();
    const email       = ref('');
    const loading     = ref(false);
    const mensaje     = ref('');
    const mensajeExito = ref(false);
    const showError   = ref(false);

    const handleReset = async () => {
      mensaje.value   = '';
      showError.value = false;

      const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      if (!email.value || !emailPattern.test(email.value)) {
        showError.value = true;
        return;
      }

      loading.value = true;
      const res = await resetPassword(email.value);
      loading.value = false;

      mensajeExito.value = res.success;
      mensaje.value      = res.message;
    };

    const goToLogin = () => router.push('/login');

    return { email, loading, mensaje, mensajeExito, showError, handleReset, goToLogin };
  }
};
</script>

<style scoped>
/* ── Página ─────────────────────────────────────── */
.recover-page {
  --ion-background-color: #F5F3EE;
}

.recover-content {
  --background: #F5F3EE;
}

.recover-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 28px 40px;
  box-sizing: border-box;
  max-width: 420px;
  margin: 0 auto;
}

/* ── Ilustración ────────────────────────────────── */
.illustration {
  margin-bottom: 32px;
}

/* ── Título ─────────────────────────────────────── */
.title-section {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 30px;
  font-weight: 700;
  color: #1A1D2E;
  margin: 0 0 12px;
  line-height: 1.2;
  text-align: center;
}

.page-subtitle {
  font-size: 15px;
  color: #888880;
  margin: 0;
  line-height: 1.6;
  text-align: center;
}

/* ── Formulario ─────────────────────────────────── */
.form-section {
  width: 100%;
}

.field-group {
  margin-bottom: 28px;
}

.field-label {
  display: block;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.5px;
  color: #888880;
  margin-bottom: 10px;
}

.input-wrapper {
  position: relative;
}

.field-input {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1.5px solid #CCCCCC;
  padding: 10px 0;
  font-size: 16px;
  color: #1A1D2E;
  outline: none;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
  -webkit-appearance: none;
  font-family: inherit;
}

.field-input::placeholder {
  color: #CCCCCC;
}

.field-input:focus {
  border-bottom-color: #F5A623;
}

.field-input--error {
  border-bottom-color: #E53935 !important;
}

.field-error {
  display: block;
  font-size: 12px;
  color: #E53935;
  margin-top: 5px;
}

/* ── Banner mensaje ─────────────────────────────── */
.mensaje-banner {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  padding: 10px 14px;
  border-radius: 8px;
  margin-bottom: 20px;
  line-height: 1.5;
}

.mensaje-banner--success {
  background: rgba(46, 125, 50, 0.08);
  color: #2E7D32;
}

.mensaje-banner--error {
  background: rgba(229, 57, 53, 0.08);
  color: #E53935;
}

/* ── Botón ──────────────────────────────────────── */
.btn-submit {
  width: 100%;
  height: 56px;
  background: #F5A623;
  border: none;
  border-radius: 100px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, transform 0.1s ease;
  -webkit-tap-highlight-color: transparent;
  margin-bottom: 24px;
}

.btn-submit:active {
  transform: scale(0.98);
  background: #E09520;
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-submit__text {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 2px;
  color: white;
}

.btn-submit__spinner {
  width: 22px;
  height: 22px;
  border: 2.5px solid rgba(255,255,255,0.35);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Volver al login ────────────────────────────── */
.back-link {
  font-size: 14px;
  font-weight: 600;
  color: #1A1D2E;
  text-align: center;
  cursor: pointer;
  margin: 0;
  -webkit-tap-highlight-color: transparent;
}

.back-link:active {
  opacity: 0.7;
}

/* ── Transiciones ───────────────────────────────── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>