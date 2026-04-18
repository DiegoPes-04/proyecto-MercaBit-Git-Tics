<template>
  <ion-page class="login-page">
    <ion-content :scroll-y="false" class="login-content">
      <div class="login-wrapper">

        <!-- Branding -->
        <div class="branding">
          <div class="brand-icon">
            <!-- Ícono de grilla/subasta -->
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="11" height="11" rx="2" fill="white"/>
              <rect x="21" y="4" width="11" height="11" rx="2" fill="white"/>
              <rect x="4" y="21" width="11" height="11" rx="2" fill="white"/>
              <rect x="21" y="21" width="11" height="11" rx="2" fill="white"/>
            </svg>
          </div>
          <h1 class="brand-name">MERCABIT</h1>
          <p class="brand-tagline">Puja. Gana. Confía.</p>
        </div>

        <!-- Formulario -->
        <div class="form-section">

          <!-- Campo Correo -->
          <div class="field-group">
            <label class="field-label">CORREO ELECTRÓNICO</label>
            <div class="input-wrapper">
              <input
                v-model="email"
                type="email"
                placeholder="nombre@ejemplo.com"
                class="field-input"
                :class="{ 'field-input--error': showError }"
                autocomplete="email"
                @keyup.enter="login"
              />
              <span class="field-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="#BBBBBB"/>
                </svg>
              </span>
            </div>
          </div>

          <!-- Campo Contraseña -->
          <div class="field-group">
            <label class="field-label">CONTRASEÑA</label>
            <div class="input-wrapper">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••••"
                class="field-input"
                :class="{ 'field-input--error': showError }"
                autocomplete="current-password"
                @keyup.enter="login"
              />
              <button class="field-icon field-icon--btn" @click="togglePassword" type="button" :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                <!-- Ojo abierto -->
                <svg v-if="!showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="#BBBBBB"/>
                </svg>
                <!-- Ojo cerrado -->
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 7C14.76 7 17 9.24 17 12C17 12.65 16.87 13.26 16.64 13.83L19.56 16.75C21.07 15.49 22.26 13.86 23 12C21.27 7.61 17 4.5 12 4.5C10.6 4.5 9.26 4.75 8.01 5.2L10.17 7.36C10.74 7.13 11.35 7 12 7ZM2 4.27L4.28 6.55L4.74 7.01C3.08 8.3 1.78 10.02 1 12C2.73 16.39 7 19.5 12 19.5C13.55 19.5 15.03 19.2 16.38 18.66L16.8 19.08L19.73 22L21 20.73L3.27 3L2 4.27ZM7.53 9.8L9.08 11.35C9.03 11.56 9 11.78 9 12C9 13.66 10.34 15 12 15C12.22 15 12.44 14.97 12.65 14.92L14.2 16.47C13.53 16.8 12.79 17 12 17C9.24 17 7 14.76 7 12C7 11.21 7.2 10.47 7.53 9.8ZM11.84 9.02L14.99 12.17L15.01 12.01C15.01 10.35 13.67 9.01 12.01 9.01L11.84 9.02Z" fill="#BBBBBB"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Mensaje de error -->
          <transition name="fade">
            <p v-if="errorMessage" class="error-message">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="flex-shrink:0">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="#E53935"/>
              </svg>
              {{ errorMessage }}
            </p>
          </transition>

          <!-- Botón principal -->
          <button
            class="btn-login"
            @click="login"
            :disabled="isLoading"
            :class="{ 'btn-login--loading': isLoading }"
          >
            <span v-if="!isLoading" class="btn-login__text">
              INICIAR SESIÓN
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="display:inline-block; vertical-align:middle; margin-left:6px;">
                <path d="M8 5L15 12L8 19" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span v-else class="btn-login__spinner"></span>
          </button>

          <!-- Links secundarios -->
          <div class="links-section">
            <p class="link-forgot" @click="goToRecuperarContraseña">
              ¿Olvidaste tu contraseña?
            </p>
            <p class="link-register">
              ¿No tienes cuenta?
              <span @click="goToRegister" class="link-register__action">Regístrate</span>
            </p>
          </div>

        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { IonPage, IonContent } from '@ionic/vue';
import { ref } from 'vue';
import { loginUser } from '@/services/authService';
import { useRouter } from 'vue-router';

export default {
  name: 'LoginVendedor',
  components: { IonPage, IonContent },

  setup() {
    const email        = ref('');
    const password     = ref('');
    const errorMessage = ref('');
    const showPassword = ref(false);
    const isLoading    = ref(false);
    const showError    = ref(false);
    const router       = useRouter();

    const togglePassword = () => {
      showPassword.value = !showPassword.value;
    };

    const login = async () => {
      errorMessage.value = '';
      showError.value    = false;

      if (!email.value || !password.value) {
        errorMessage.value = 'Por favor completa todos los campos.';
        showError.value    = true;
        return;
      }

      isLoading.value = true;
      try {
        const response = await loginUser(email.value, password.value);

        if (response.success) {
          router.push({ path: '/home' }).then(() => window.location.reload());
        } else {
          showError.value    = true;
          errorMessage.value = response.resend
            ? response.message
            : 'Correo o contraseña incorrectos. Inténtalo de nuevo.';
        }
      } catch {
        showError.value    = true;
        errorMessage.value = 'Error de conexión. Intenta más tarde.';
      } finally {
        isLoading.value = false;
      }
    };

    const goToRegister           = () => router.push('/registro');
    const goToRecuperarContraseña = () => router.push('/recuperar-contrasena');

    return {
      email, password, errorMessage,
      showPassword, isLoading, showError,
      togglePassword, login,
      goToRegister, goToRecuperarContraseña
    };
  }
};
</script>

<style scoped>
/* ── Página ─────────────────────────────────────── */
.login-page {
  --ion-background-color: #F5F3EE;
}

.login-content {
  --background: #F5F3EE;
}

.login-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 28px 40px;
  box-sizing: border-box;
}

/* ── Branding ───────────────────────────────────── */
.branding {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 44px;
}

.brand-icon {
  width: 72px;
  height: 72px;
  background: #1A1D2E;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}

.brand-name {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 6px;
  color: #1A1D2E;
  margin: 0 0 8px;
  text-align: center;
}

.brand-tagline {
  font-size: 15px;
  color: #888880;
  letter-spacing: 1px;
  margin: 0;
  text-align: center;
}

/* ── Formulario ─────────────────────────────────── */
.form-section {
  width: 100%;
  max-width: 380px;
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
  display: flex;
  align-items: center;
}

.field-input {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1.5px solid #CCCCCC;
  padding: 10px 40px 10px 0;
  font-size: 16px;
  color: #1A1D2E;
  outline: none;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
  -webkit-appearance: none;
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

.field-icon {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.field-icon--btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  pointer-events: all;
  -webkit-tap-highlight-color: transparent;
}

/* ── Error ──────────────────────────────────────── */
.error-message {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #E53935;
  margin: -12px 0 16px;
  padding: 8px 12px;
  background: rgba(229, 57, 53, 0.08);
  border-radius: 8px;
}

/* ── Botón principal ────────────────────────────── */
.btn-login {
  width: 100%;
  height: 56px;
  background: #F5A623;
  border: none;
  border-radius: 100px;
  color: white;
  cursor: pointer;
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, transform 0.1s ease;
  -webkit-tap-highlight-color: transparent;
}

.btn-login:active {
  transform: scale(0.98);
  background: #E09520;
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-login__text {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 2px;
  color: white;
}

/* Spinner de carga */
.btn-login__spinner {
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

/* ── Links secundarios ──────────────────────────── */
.links-section {
  margin-top: 28px;
  text-align: center;
}

.link-forgot {
  font-size: 14px;
  color: #555;
  margin: 0 0 14px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.link-forgot:active {
  opacity: 0.7;
}

.link-register {
  font-size: 14px;
  color: #888880;
  margin: 0;
}

.link-register__action {
  font-weight: 700;
  color: #1A1D2E;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.link-register__action:active {
  opacity: 0.7;
}

/* ── Transición error ───────────────────────────── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>