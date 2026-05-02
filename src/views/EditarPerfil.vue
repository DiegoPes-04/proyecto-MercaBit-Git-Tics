<template>
  <ion-page>
    <ion-header class="page-header">
      <ion-toolbar class="page-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/mi-cuenta" text="" class="back-btn" />
        </ion-buttons>
        <ion-title class="page-title">Editar Perfil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="page-content">

      <div class="avatar-section">
        <div class="avatar-circle">
          <img v-if="foto" :src="foto" class="avatar-img" />
          <span v-else class="avatar-initials">{{ iniciales }}</span>
        </div>
        <p class="avatar-hint">La foto se cambia desde Mi Cuenta</p>
      </div>

      <div class="form-wrap">
        <div class="section-label">INFORMACIÓN PERSONAL</div>
        <div class="form-card">
          <div class="field-group">
            <label class="field-label">Nombre completo</label>
            <input v-model="nombre" class="field-input" placeholder="Tu nombre completo" />
          </div>
          <div class="field-divider" />
          <div class="field-group">
            <label class="field-label">Teléfono</label>
            <input v-model="telefono" class="field-input" type="tel" placeholder="Ej: 3001234567" />
          </div>
        </div>

        <div class="section-label">CUENTA</div>
        <div class="form-card">
          <div class="field-group disabled">
            <label class="field-label">Correo electrónico</label>
            <input :value="correo" class="field-input" readonly />
          </div>
        </div>

        <button class="save-btn" @click="guardar" :disabled="guardando">
          {{ guardando ? 'Guardando...' : 'Guardar Cambios' }}
        </button>
      </div>

      <div style="height: 40px" />
    </ion-content>

    <ion-toast
      :is-open="mostrarToast"
      :message="mensajeToast"
      :duration="3000"
      :color="colorToast"
      @didDismiss="mostrarToast = false"
    />
  </ion-page>
</template>

<script setup>
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonToast
} from '@ionic/vue'
import { ref, computed, onMounted } from 'vue'
import { auth, db } from '@/firebase/FirebaseConfig'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

const nombre = ref('')
const telefono = ref('')
const correo = ref('')
const foto = ref('')
const userId = ref('')
const guardando = ref(false)
const mostrarToast = ref(false)
const mensajeToast = ref('')
const colorToast = ref('success')

const iniciales = computed(() => {
  if (!nombre.value) return 'U'
  return nombre.value.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
})

onMounted(async () => {
  const user = auth.currentUser
  if (!user) return
  userId.value = user.uid
  correo.value = user.email || ''
  const snap = await getDoc(doc(db, 'users', user.uid))
  if (snap.exists()) {
    const d = snap.data()
    nombre.value = d.name || ''
    telefono.value = d.phone || ''
    foto.value = d.photoURL || ''
  }
})

const guardar = async () => {
  if (!nombre.value.trim()) { mostrar('El nombre no puede estar vacío', 'danger'); return }
  try {
    guardando.value = true
    await updateDoc(doc(db, 'users', userId.value), {
      name: nombre.value.trim(),
      phone: telefono.value.trim()
    })
    mostrar('Perfil actualizado correctamente', 'success')
  } catch {
    mostrar('Error al guardar los cambios', 'danger')
  } finally {
    guardando.value = false
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

.avatar-section {
  background: #fff;
  display: flex; flex-direction: column; align-items: center;
  padding: 32px 20px 24px;
  margin-bottom: 12px;
}
.avatar-circle {
  width: 88px; height: 88px;
  background: #1A1D2E;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; margin-bottom: 10px;
}
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-initials { font-size: 1.8rem; font-weight: 900; color: #fff; }
.avatar-hint { font-size: 0.72rem; color: #bbb; margin: 0; }

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
.field-group.disabled { opacity: 0.45; }
.field-divider { height: 1px; background: #F5F5F5; margin: 0 18px; }

.field-label {
  display: block; font-size: 0.65rem; font-weight: 700;
  letter-spacing: 0.06em; color: #aaa; margin-bottom: 6px;
}
.field-input {
  width: 100%; border: none; outline: none;
  font-size: 0.92rem; font-weight: 600; color: #111;
  background: transparent; padding: 0; font-family: inherit;
}
.field-input::placeholder { color: #ccc; font-weight: 400; }

.save-btn {
  width: 100%; margin-top: 24px; padding: 16px;
  background: #1A1D2E; color: #fff;
  border: none; border-radius: 16px;
  font-size: 0.92rem; font-weight: 800;
  cursor: pointer; letter-spacing: 0.03em;
  -webkit-tap-highlight-color: transparent;
}
.save-btn:disabled { opacity: 0.6; }
</style>
