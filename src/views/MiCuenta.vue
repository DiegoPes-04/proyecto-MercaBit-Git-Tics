<template>
  <ion-page>
    <ion-header class="cuenta-header">
      <ion-toolbar class="cuenta-toolbar">
        <ion-title class="cuenta-title">MercaBit</ion-title>
        <ion-buttons slot="end">
          <div class="avatar-chip" @click="seleccionarImagen">
            <span>{{ iniciales }}</span>
          </div>
          <input type="file" ref="fileInput" accept="image/*" style="display:none" @change="procesarImagen" />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="cuenta-content">

      <!-- Hero perfil -->
      <div class="profile-hero">
        <div class="avatar-big" @click="seleccionarImagen">
          <img v-if="foto && foto !== '/img/User.jpg'" :src="foto" class="avatar-img" />
          <span v-else class="avatar-initials">{{ iniciales }}</span>
          <div class="verified-badge">
            <ion-icon :icon="checkmarkCircle" />
            <span>Vendedor Verificado</span>
          </div>
        </div>
        <h2 class="profile-name">{{ nombre || 'Usuario' }}</h2>
        <p class="profile-mask">{{ maskName(nombre) }}</p>

        <!-- Stats -->
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-value">{{ stats.pujas }}</span>
            <span class="stat-label">PUJAS</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ stats.ventas }}</span>
            <span class="stat-label">VENTAS</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ promedio.toFixed(1) }}<ion-icon :icon="star" class="star-inline" /></span>
            <span class="stat-label">VALORACIÓN</span>
          </div>
        </div>
      </div>

      <!-- Configuración de cuenta -->
      <div class="section-label">CONFIGURACIÓN DE CUENTA</div>

      <div class="menu-card">
        <div class="menu-row" @click="navigate('/mi-cuenta/editar')">
          <div class="menu-icon"><ion-icon :icon="personOutline" /></div>
          <span class="menu-text">Editar Perfil</span>
          <ion-icon :icon="chevronForwardOutline" class="menu-arrow" />
        </div>
        <div class="menu-divider" />
        <div class="menu-row" @click="navigate('/mi-cuenta/seguridad')">
          <div class="menu-icon"><ion-icon :icon="lockClosedOutline" /></div>
          <span class="menu-text">Seguridad y Password</span>
          <ion-icon :icon="chevronForwardOutline" class="menu-arrow" />
        </div>
        <div class="menu-divider" />
        <div class="menu-row" @click="navigate('/mi-cuenta/pagos')">
          <div class="menu-icon"><ion-icon :icon="cardOutline" /></div>
          <span class="menu-text">Métodos de Pago</span>
          <ion-icon :icon="chevronForwardOutline" class="menu-arrow" />
        </div>
        <div class="menu-divider" />
        <div class="menu-row" @click="navigate('/terminos-condiciones')">
          <div class="menu-icon"><ion-icon :icon="documentTextOutline" /></div>
          <span class="menu-text">Términos y Condiciones</span>
          <ion-icon :icon="chevronForwardOutline" class="menu-arrow" />
        </div>
      </div>

      <!-- Cerrar sesión -->
      <div class="logout-wrap">
        <button class="logout-btn" @click="cerrarSesion">
          <ion-icon :icon="logOutOutline" />
          Cerrar Sesión
        </button>
      </div>

      <!-- Refiere y Gana -->
      <div class="referral-card">
        <div class="referral-left">
          <h3 class="referral-title">Refiere y Gana</h3>
          <p class="referral-sub">Gana hasta $50.000 COP por cada amigo que realice su primera puja.</p>
          <button class="referral-btn">COMPARTIR ENLACE</button>
        </div>
        <ion-icon :icon="starOutline" class="referral-bg-icon" />
      </div>

      <div style="height: 80px" />
    </ion-content>

    <!-- Toast -->
    <ion-toast :is-open="mostrarToast" :message="mensajeToast" :duration="3000" :color="colorToast" @didDismiss="mostrarToast = false" />
    <ion-loading :is-open="cargando" message="Subiendo imagen..." />

    <!-- Bottom Nav -->
    <div class="bottom-nav">
      <div class="nav-item" @click="navigate('/home')">
        <ion-icon :icon="homeOutline" /><span>INICIO</span>
      </div>
      <div class="nav-item" @click="navigate('/categorias')">
        <ion-icon :icon="gridOutline" /><span>CATEGORÍAS</span>
      </div>
      <div class="nav-item" @click="navigate('/explorar')">
        <ion-icon :icon="searchOutline" /><span>BUSCAR</span>
      </div>
      <div class="nav-item" @click="navigate('/ofertas-realizadas')">
        <ion-icon :icon="layersOutline" /><span>MIS TRATOS</span>
      </div>
      <div class="nav-item" @click="navigate('/Notification')">
        <ion-icon :icon="notificationsOutline" /><span>ALERTS</span>
      </div>
      <div class="nav-item active">
        <ion-icon :icon="personSharp" /><span>CUENTA</span>
      </div>
    </div>
  </ion-page>
</template>

<script setup>
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonIcon, IonToast, IonLoading
} from '@ionic/vue'
import {
  personOutline, lockClosedOutline, cardOutline, documentTextOutline,
  logOutOutline, chevronForwardOutline, checkmarkCircle,
  star, starOutline, homeOutline, gridOutline, searchOutline,
  layersOutline, notificationsOutline, personSharp
} from 'ionicons/icons'
import { ref, computed, onMounted } from 'vue'
import { auth, db } from '@/firebase/FirebaseConfig'
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { logoutUser } from '@/services/authService'
import { useRouter } from 'vue-router'

const router = useRouter()
const navigate = (path) => router.push(path)

const nombre = ref('')
const cc = ref('')
const correo = ref('')
const foto = ref('')
const saldo = ref(0)
const fileInput = ref(null)
const cargando = ref(false)
const mostrarToast = ref(false)
const mensajeToast = ref('')
const colorToast = ref('success')
const userId = ref('')
const fotoActualURL = ref('')
const calificaciones = ref([])
const promedio = ref(0)
const stats = ref({ pujas: 0, ventas: 0 })

const iniciales = computed(() => {
  if (!nombre.value) return 'U'
  return nombre.value.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
})

const maskName = (name) => {
  if (!name) return ''
  const parts = name.split(' ')
  return parts.map(p => p.length > 2 ? p[0] + '***' + p[p.length - 1] + '.' : p).join(' ')
}

onMounted(async () => {
  const user = auth.currentUser
  if (!user) { mostrarMensaje('No hay sesión iniciada', 'danger'); return }
  userId.value = user.uid

  const snap = await getDoc(doc(db, 'users', user.uid))
  if (snap.exists()) {
    const d = snap.data()
    nombre.value = d.name || ''
    cc.value = d.cedula || ''
    correo.value = d.email || ''
    foto.value = d.photoURL || '/img/User.jpg'
    fotoActualURL.value = d.photoURL || ''
    saldo.value = d.saldo || 0
  }

  const calSnap = await getDocs(collection(db, 'usuarios', user.uid, 'calificaciones'))
  calificaciones.value = calSnap.docs.map(d => d.data())
  const total = calificaciones.value.reduce((s, c) => s + c.puntaje, 0)
  promedio.value = calificaciones.value.length ? total / calificaciones.value.length : 0
})

const seleccionarImagen = () => fileInput.value?.click()

const procesarImagen = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  if (!file.type.match('image.*')) { mostrarMensaje('Selecciona una imagen válida', 'danger'); return }
  if (file.size > 2 * 1024 * 1024) { mostrarMensaje('La imagen no debe superar 2MB', 'danger'); return }
  try { cargando.value = true; await subirImagen(file) }
  catch { mostrarMensaje('Error al procesar la imagen', 'danger') }
  finally { cargando.value = false }
}

const subirImagen = async (file) => {
  const storage = getStorage()
  const ext = file.name.split('.').pop()
  const imgRef = storageRef(storage, `fotoPerfil/${userId.value}/perfil_${Date.now()}.${ext}`)
  const urlAnterior = fotoActualURL.value
  const snapshot = await uploadBytes(imgRef, file)
  const url = await getDownloadURL(snapshot.ref)
  await updateDoc(doc(db, 'users', userId.value), { photoURL: url })
  foto.value = url
  fotoActualURL.value = url
  if (urlAnterior?.includes('firebasestorage')) {
    try {
      const path = decodeURIComponent(new URL(urlAnterior).pathname.split('/o/')[1].split('?')[0])
      await deleteObject(storageRef(storage, path))
    } catch (_) {}
  }
  mostrarMensaje('Imagen actualizada correctamente', 'success')
}

const cerrarSesion = async () => {
  const result = await logoutUser()
  if (result.success) window.location.href = '/login'
}

const mostrarMensaje = (msg, color = 'success') => {
  mensajeToast.value = msg; colorToast.value = color; mostrarToast.value = true
}
</script>

<style scoped>
.cuenta-header { --background: #ffffff; border-bottom: 1px solid #eee; }
.cuenta-toolbar { --background: #ffffff; --color: #111; --min-height: 60px; padding: 0 12px; }
.cuenta-title { font-size: 1.05rem; font-weight: 900; color: #111; text-align: left; }
.cuenta-content { --background: #F5F5F5; }

.avatar-chip {
  width: 36px; height: 36px;
  background: #1A1D2E;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.avatar-chip span { font-size: 0.75rem; font-weight: 800; color: #fff; }

/* ── Hero ──────────────────────────────────────────── */
.profile-hero {
  background: #fff;
  display: flex; flex-direction: column; align-items: center;
  padding: 28px 20px 24px;
  margin-bottom: 8px;
}

.avatar-big {
  position: relative;
  width: 88px; height: 88px;
  background: #1A1D2E;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; margin-bottom: 12px;
}

.avatar-img {
  width: 100%; height: 100%;
  border-radius: 50%; object-fit: cover;
}

.avatar-initials { font-size: 1.8rem; font-weight: 900; color: #fff; }

.verified-badge {
  position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%);
  background: #27AE60;
  border-radius: 20px;
  padding: 3px 8px;
  display: flex; align-items: center; gap: 4px;
  white-space: nowrap;
}
.verified-badge ion-icon { font-size: 0.7rem; color: #fff; }
.verified-badge span { font-size: 0.58rem; font-weight: 700; color: #fff; }

.profile-name { font-size: 1.3rem; font-weight: 900; color: #111; margin: 14px 0 2px; }
.profile-mask { font-size: 0.75rem; color: #aaa; margin: 0 0 20px; }

/* Stats */
.stats-row {
  display: flex; gap: 10px; width: 100%;
}
.stat-item {
  flex: 1;
  background: #1A1D2E;
  border-radius: 16px;
  padding: 14px 8px;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.stat-value {
  font-size: 1.1rem; font-weight: 900; color: #fff;
  display: flex; align-items: center; gap: 2px;
}
.star-inline { font-size: 0.8rem; color: #F5A623; }
.stat-label { font-size: 0.5rem; font-weight: 700; color: #888; letter-spacing: 0.08em; }

/* ── Section label ─────────────────────────────────── */
.section-label {
  font-size: 0.62rem; font-weight: 700; letter-spacing: 0.1em;
  color: #aaa; padding: 16px 20px 8px;
}

/* ── Menu card ─────────────────────────────────────── */
.menu-card {
  background: #fff;
  border-radius: 18px;
  margin: 0 16px;
  padding: 4px 0;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.menu-row {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 18px; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.menu-row:active { background: #fafafa; }

.menu-icon {
  width: 36px; height: 36px;
  background: #F5F5F5;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.menu-icon ion-icon { font-size: 1rem; color: #555; }
.menu-text { flex: 1; font-size: 0.9rem; font-weight: 600; color: #111; }
.menu-arrow { font-size: 0.9rem; color: #ccc; }
.menu-divider { height: 1px; background: #F5F5F5; margin: 0 18px; }

/* ── Logout ────────────────────────────────────────── */
.logout-wrap { padding: 14px 16px; }
.logout-btn {
  width: 100%; padding: 14px;
  background: #FFF0F0;
  border: none; border-radius: 14px;
  color: #E53935; font-size: 0.9rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  cursor: pointer;
}
.logout-btn ion-icon { font-size: 1.1rem; }

/* ── Referral ──────────────────────────────────────── */
.referral-card {
  background: #FFF8EE;
  border-radius: 18px;
  margin: 0 16px;
  padding: 20px 18px;
  display: flex; align-items: center;
  position: relative; overflow: hidden;
}
.referral-left { flex: 1; }
.referral-title { font-size: 1.05rem; font-weight: 900; color: #111; margin: 0 0 6px; }
.referral-sub { font-size: 0.78rem; color: #666; margin: 0 0 14px; line-height: 1.5; }
.referral-btn {
  background: #111; color: #fff;
  border: none; border-radius: 20px;
  padding: 8px 16px; font-size: 0.68rem; font-weight: 800;
  letter-spacing: 0.06em; cursor: pointer;
}
.referral-bg-icon {
  position: absolute; right: -10px; bottom: -10px;
  font-size: 6rem; color: rgba(245,166,35,0.12);
}

/* ── Bottom Nav ────────────────────────────────────── */
.bottom-nav {
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 64px; background: #fff;
  border-top: 1px solid #eee;
  display: flex; align-items: center; justify-content: space-around;
  z-index: 999; box-shadow: 0 -4px 20px rgba(0,0,0,0.07);
}
.nav-item {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 3px; flex: 1; height: 100%;
  color: #aaa; cursor: pointer;
  -webkit-tap-highlight-color: transparent; user-select: none;
}
.nav-item ion-icon { font-size: 1.3rem; pointer-events: none; }
.nav-item span { font-size: 0.48rem; font-weight: 700; letter-spacing: 0.06em; pointer-events: none; }
.nav-item.active { color: #F5A623; }
</style>