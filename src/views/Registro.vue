<template>
  <ion-page class="register-page">
    <ion-content :scroll-y="true" class="register-content">
      <div class="register-wrapper">

        <!-- Indicador de paso -->
        <div class="step-header">
          <span class="step-label">PASO 1 DE 2</span>
          <div class="step-bar">
            <div class="step-bar__fill"></div>
          </div>
        </div>

        <!-- Título -->
        <div class="title-section">
          <h1 class="page-title">Crea tu cuenta</h1>
          <p class="page-subtitle">Únete a la plataforma tecnológica más avanzada.</p>
        </div>

        <!-- Formulario -->
        <div class="form-section">

          <!-- Nombre completo -->
          <div class="field-group">
            <label class="field-label">NOMBRE COMPLETO</label>
            <div class="input-wrapper">
              <input
                v-model="name"
                type="text"
                placeholder="Ej. Juan Pérez"
                class="field-input"
                :class="{ 'field-input--error': fieldErrors.name }"
                autocomplete="name"
              />
            </div>
            <transition name="fade">
              <span v-if="fieldErrors.name" class="field-error">{{ fieldErrors.name }}</span>
            </transition>
          </div>

          <!-- Correo electrónico -->
          <div class="field-group">
            <label class="field-label">CORREO ELECTRÓNICO</label>
            <div class="input-wrapper">
              <input
                v-model="email"
                type="email"
                placeholder="juan@ejemplo.com"
                class="field-input"
                :class="{ 'field-input--error': fieldErrors.email }"
                autocomplete="email"
              />
              <span class="field-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="#CCCCCC"/>
                </svg>
              </span>
            </div>
            <transition name="fade">
              <span v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</span>
            </transition>
          </div>

          <!-- Teléfono -->
          <div class="field-group">
            <label class="field-label">TELÉFONO (+57)</label>
            <div class="input-wrapper input-wrapper--phone">
              <span class="phone-prefix">+57</span>
              <input
                v-model="phone"
                type="tel"
                placeholder="300 000 0000"
                class="field-input field-input--phone"
                :class="{ 'field-input--error': fieldErrors.phone }"
                autocomplete="tel"
                maxlength="10"
                @input="onPhoneInput"
              />
            </div>
            <transition name="fade">
              <span v-if="fieldErrors.phone" class="field-error">{{ fieldErrors.phone }}</span>
            </transition>
          </div>

          <!-- Contraseña -->
          <div class="field-group">
            <label class="field-label">CONTRASEÑA</label>
            <div class="input-wrapper">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••••"
                class="field-input"
                :class="{ 'field-input--error': fieldErrors.password }"
                autocomplete="new-password"
              />
              <button class="field-icon field-icon--btn" @click="showPassword = !showPassword" type="button">
                <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="#CCCCCC"/>
                </svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 7C14.76 7 17 9.24 17 12C17 12.65 16.87 13.26 16.64 13.83L19.56 16.75C21.07 15.49 22.26 13.86 23 12C21.27 7.61 17 4.5 12 4.5C10.6 4.5 9.26 4.75 8.01 5.2L10.17 7.36C10.74 7.13 11.35 7 12 7ZM2 4.27L4.28 6.55L4.74 7.01C3.08 8.3 1.78 10.02 1 12C2.73 16.39 7 19.5 12 19.5C13.55 19.5 15.03 19.2 16.38 18.66L16.8 19.08L19.73 22L21 20.73L3.27 3L2 4.27ZM7.53 9.8L9.08 11.35C9.03 11.56 9 11.78 9 12C9 13.66 10.34 15 12 15C12.22 15 12.44 14.97 12.65 14.92L14.2 16.47C13.53 16.8 12.79 17 12 17C9.24 17 7 14.76 7 12C7 11.21 7.2 10.47 7.53 9.8ZM11.84 9.02L14.99 12.17L15.01 12.01C15.01 10.35 13.67 9.01 12.01 9.01L11.84 9.02Z" fill="#CCCCCC"/>
                </svg>
              </button>
            </div>
            <transition name="fade">
              <span v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</span>
            </transition>
          </div>

          <!-- Términos y condiciones -->
          <div class="terms-row" @click="acceptedTerms = !acceptedTerms">
            <div class="custom-checkbox" :class="{ 'custom-checkbox--checked': acceptedTerms }">
              <svg v-if="acceptedTerms" width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="white"/>
              </svg>
            </div>
            <p class="terms-text">
              Acepto los <span class="terms-link" @click.stop="goToTerminos">Términos y Condiciones</span>
            </p>
          </div>
          <transition name="fade">
            <span v-if="fieldErrors.terms" class="field-error" style="margin-top: -8px; display:block;">{{ fieldErrors.terms }}</span>
          </transition>

          <!-- Error general -->
          <transition name="fade">
            <div v-if="errorMessage" class="error-banner">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="flex-shrink:0">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="#E53935"/>
              </svg>
              {{ errorMessage }}
            </div>
          </transition>

          <!-- Botón crear cuenta -->
          <button
            class="btn-submit"
            @click="register"
            :disabled="loading"
            :class="{ 'btn-submit--loading': loading }"
          >
            <span v-if="!loading" class="btn-submit__text">
              CREAR CUENTA
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="display:inline-block; vertical-align:middle; margin-left:6px;">
                <path d="M8 5L15 12L8 19" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span v-else class="btn-submit__spinner"></span>
          </button>

          <!-- Link a login -->
          <p class="login-link">
            ¿Ya tienes una cuenta?
            <span class="login-link__action" @click="goToLogin">Inicia sesión</span>
          </p>

          <!-- Footer seguridad -->
          <div class="security-footer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 5V11C4 16.5 7.84 21.74 12 23C16.16 21.74 20 16.5 20 11V5L12 2Z" fill="#BBBBBB"/>
            </svg>
            <span>SEGURIDAD CIFRADA</span>
          </div>

        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { IonPage, IonContent } from '@ionic/vue';
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { registerUser } from '@/services/authService';

export default {
  name: 'RegistroAuth',
  components: { IonPage, IonContent },

  setup() {
    const name         = ref('');
    const email        = ref('');
    const phone        = ref('');
    const password     = ref('');
    const loading      = ref(false);
    const errorMessage = ref('');
    const showPassword = ref(false);
    const acceptedTerms = ref(false);
    const router       = useRouter();

    const fieldErrors = reactive({
      name: '', email: '', phone: '', password: '', terms: ''
    });

    const onPhoneInput = (e) => {
      phone.value = e.target.value.replace(/\D/g, '').slice(0, 10);
    };

    const validateFields = () => {
      let valid = true;
      Object.keys(fieldErrors).forEach(k => fieldErrors[k] = '');

      if (!name.value.trim() || name.value.trim().length < 3) {
        fieldErrors.name = 'Ingresa tu nombre completo.';
        valid = false;
      }

      const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      if (!emailPattern.test(email.value)) {
        fieldErrors.email = 'Correo electrónico no válido.';
        valid = false;
      }

      if (phone.value.replace(/\D/g, '').length < 10) {
        fieldErrors.phone = 'Ingresa un número de 10 dígitos.';
        valid = false;
      }

      if (password.value.length < 6) {
        fieldErrors.password = 'Mínimo 6 caracteres.';
        valid = false;
      }

      if (!acceptedTerms.value) {
        fieldErrors.terms = 'Debes aceptar los términos y condiciones.';
        valid = false;
      }

      return valid;
    };

    const register = async () => {
      errorMessage.value = '';
      if (!validateFields()) return;

      loading.value = true;
      try {
        const result = await registerUser(
          name.value.trim(),
          phone.value,
          email.value.trim(),
          password.value
        );

        if (result.success) {
          alert(result.message);
          router.push('/login');
        } else {
          errorMessage.value = result.message;
        }
      } catch (error) {
        errorMessage.value = 'Error al registrar. Intenta más tarde.';
      } finally {
        loading.value = false;
      }
    };

    const goToLogin    = () => router.push('/login');
    const goToTerminos = () => router.push('/terminos');

    return {
      name, email, phone, password,
      loading, errorMessage, showPassword,
      acceptedTerms, fieldErrors,
      onPhoneInput, register,
      goToLogin, goToTerminos
    };
  }
};
</script>

<style scoped>
/* ── Página ─────────────────────────────────────── */
.register-page {
  --ion-background-color: #F5F3EE;
}

.register-content {
  --background: #F5F3EE;
}

.register-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 36px 28px 48px;
  box-sizing: border-box;
  max-width: 420px;
  margin: 0 auto;
}

/* ── Indicador de paso ──────────────────────────── */
.step-header {
  margin-bottom: 32px;
}

.step-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #F5A623;
  display: block;
  margin-bottom: 8px;
}

.step-bar {
  width: 100%;
  height: 3px;
  background: #E0DDD6;
  border-radius: 2px;
  overflow: hidden;
}

.step-bar__fill {
  width: 50%;
  height: 100%;
  background: #F5A623;
  border-radius: 2px;
}

/* ── Título ─────────────────────────────────────── */
.title-section {
  margin-bottom: 36px;
}

.page-title {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 30px;
  font-weight: 700;
  color: #1A1D2E;
  margin: 0 0 8px;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 15px;
  color: #888880;
  margin: 0;
  line-height: 1.5;
}

/* ── Formulario ─────────────────────────────────── */
.form-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.field-group {
  margin-bottom: 24px;
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

.input-wrapper--phone {
  gap: 0;
}

.field-input {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1.5px solid #CCCCCC;
  padding: 10px 36px 10px 0;
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

/* Teléfono con prefijo */
.phone-prefix {
  font-size: 16px;
  font-weight: 600;
  color: #1A1D2E;
  padding: 10px 10px 10px 0;
  border-bottom: 1.5px solid #CCCCCC;
  line-height: 1;
  flex-shrink: 0;
  transition: border-color 0.2s ease;
}

.field-input--phone {
  padding-left: 4px;
  padding-right: 0;
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

.field-error {
  display: block;
  font-size: 12px;
  color: #E53935;
  margin-top: 5px;
}

/* ── Checkbox términos ──────────────────────────── */
.terms-row {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  margin-bottom: 24px;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.custom-checkbox {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #CCCCCC;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color 0.2s, background 0.2s;
  box-sizing: border-box;
}

.custom-checkbox--checked {
  background: #F5A623;
  border-color: #F5A623;
}

.terms-text {
  font-size: 14px;
  color: #555;
  margin: 0;
}

.terms-link {
  font-weight: 700;
  color: #1A1D2E;
  text-decoration: underline;
  cursor: pointer;
}

/* ── Error banner ───────────────────────────────── */
.error-banner {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #E53935;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: rgba(229, 57, 53, 0.08);
  border-radius: 8px;
}

/* ── Botón ──────────────────────────────────────── */
.btn-submit {
  width: 100%;
  height: 56px;
  background: #F5A623;
  border: none;
  border-radius: 100px;
  color: white;
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

/* ── Links ──────────────────────────────────────── */
.login-link {
  font-size: 14px;
  color: #888880;
  text-align: center;
  margin: 0 0 36px;
}

.login-link__action {
  font-weight: 700;
  color: #1A1D2E;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.login-link__action:active {
  opacity: 0.7;
}

/* ── Seguridad footer ───────────────────────────── */
.security-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: auto;
}

.security-footer span {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 2px;
  color: #BBBBBB;
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