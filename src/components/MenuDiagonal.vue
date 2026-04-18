<template>
  <ion-menu content-id="main-content" side="start" :disabled="false">
    <ion-content class="menu-content">
      <div class="menu-header">
        <!-- Ícono de marca consistente con el resto de la app -->
        <div class="brand-icon">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="11" height="11" rx="2" fill="white"/>
            <rect x="21" y="4" width="11" height="11" rx="2" fill="white"/>
            <rect x="4" y="21" width="11" height="11" rx="2" fill="white"/>
            <rect x="21" y="21" width="11" height="11" rx="2" fill="white"/>
          </svg>
        </div>
        <h2 class="logo">MercaBit</h2>
      </div>

      <ion-list>
        <ion-menu-toggle auto-hide="false">
          <ion-item router-link="/home" router-direction="root">
            <ion-icon :icon="homeOutline" slot-v="start" />
            <ion-label>Inicio</ion-label>
          </ion-item>
          <ion-item router-link="/Notification" router-direction="root">
            <ion-icon :icon="notificationsOutline" slot-v="start" />
            <ion-label>Notificaciones</ion-label>
          </ion-item>
          <ion-item router-link="/MisCalificaciones" router-direction="root">
            <ion-icon :icon="clipboardOutline" slot-v="start" />
            <ion-label>Mis calificaciones</ion-label>
          </ion-item>
          <ion-item router-link="/MisCompras" router-direction="root">
            <ion-icon :icon="cartOutline" slot-v="start" />
            <ion-label>Mis Compras</ion-label>
          </ion-item>
          <ion-item router-link="/ofertas-realizadas" router-direction="root">
            <ion-icon :icon="checkmarkCircleOutline" slot-v="start" />
            <ion-label>Ofertas realizadas</ion-label>
          </ion-item>
          <ion-item router-link="/agregar-producto" router-direction="root">
            <ion-icon :icon="addOutline" slot-v="start" />
            <ion-label>Agregar producto</ion-label>
          </ion-item>
          <ion-item router-link="/mis-publicaciones" router-direction="root">
            <ion-icon :icon="bagCheckOutline" slot-v="start" />
            <ion-label>Mis publicaciones</ion-label>
          </ion-item>
          <ion-item router-link="/categorias" router-direction="root">
            <ion-icon :icon="folderOutline" slot-v="start" />
            <ion-label>Categorías</ion-label>
          </ion-item>
          <ion-item router-link="/mi-cuenta" router-direction="root">
            <ion-icon :icon="personOutline" slot-v="start" />
            <ion-label>Mi Cuenta</ion-label>
          </ion-item>
          <ion-item router-link="/accerca-de-la-app" router-direction="root">
            <ion-icon :icon="informationCircleOutline" slot-v="start" />
            <ion-label>Acerca de la App</ion-label>
          </ion-item>
        </ion-menu-toggle>
      </ion-list>

      <!-- Sección de usuario -->
      <div class="user-section">
        <img :src="userPhoto" alt="Usuario" class="user-avatar" />
        <p class="user-name">{{ userName }}</p>
      </div>

      <!-- Botón de cerrar sesión -->
      <ion-button @click="logout" class="logout-button" fill="outline">
        <ion-icon :icon="logOutOutline" slot-v="start"></ion-icon>
        Cerrar sesión
      </ion-button>
    </ion-content>
  </ion-menu>
</template>

<script setup>
import {
  IonMenu,
  IonContent,
  IonList,
  IonMenuToggle,
  IonItem,
  IonIcon,
  IonLabel,
  IonButton
} from '@ionic/vue';
import {
  homeOutline,
  searchOutline,
  notificationsOutline,
  clipboardOutline,
  cartOutline,
  checkmarkCircleOutline,
  folderOutline,
  personOutline,
  informationCircleOutline,
  logOutOutline,
  addOutline,
  bagCheckOutline
} from 'ionicons/icons';
import { logoutUser } from '@/services/authService';
import { useRouter } from 'vue-router';
import { ref, onMounted, onUnmounted } from 'vue';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';

const router = useRouter();
const userName = ref('Usuario');
const userPhoto = ref('/img/User.jpg');
let unsubscribeUserListener = null;

const setupUserDataListener = (uid) => {
  try {
    const db = getFirestore();
    const userRef = doc(db, 'users', uid);
    unsubscribeUserListener = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        userName.value = data.name;
        if (data.photoURL) {
          const separator = data.photoURL.includes('?') ? '&' : '?';
          userPhoto.value = `${data.photoURL}${separator}t=${Date.now()}`;
        }
      }
    }, (error) => {
      console.error('Error al escuchar cambios del usuario:', error);
    });
  } catch (err) {
    console.error('Error al configurar el listener:', err);
  }
};

onMounted(() => {
  const auth = getAuth();
  onAuthStateChanged(auth, (user) => {
    if (user) {
      setupUserDataListener(user.uid);
    } else {
      userName.value = 'Usuario';
      userPhoto.value = '/img/User.jpg';
    }
  });
});

onUnmounted(() => {
  if (unsubscribeUserListener) {
    unsubscribeUserListener();
  }
});

const logout = async () => {
  const result = await logoutUser();
  if (result.success) {
    window.location.href = '/login';
  } else {
    console.error('Error al cerrar sesión:', result.message);
  }
};
</script>

<style scoped>
.menu-content {
  --background: #000;
  color: white;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* ── Header con ícono y nombre ──────────────────── */
.menu-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px 16px 20px;
}

.brand-icon {
  width: 44px;
  height: 44px;
  background: #1A1D2E;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1.5px solid rgba(255, 255, 255, 0.15);
}

.logo {
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  white-space: nowrap;
  margin: 0;
}

/* ── Items del menú ─────────────────────────────── */
ion-item {
  --background: transparent;
  color: white;
  --color: white;
}

ion-icon {
  color: white;
}

/* ── Sección de usuario ─────────────────────────── */
.user-section {
  text-align: center;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid white;
  margin-bottom: 8px;
  object-fit: cover;
}

.user-name {
  font-size: 1.2rem;
  color: white;
  margin: 0;
}

/* ── Botón cerrar sesión ────────────────────────── */
.logout-button {
  --background: transparent;
  --color: white;
  --border-color: white;
  border-radius: 8px;
  max-width: 170px;
  height: 35px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px auto;
}

.logout-button ion-icon {
  font-size: 1.2rem;
  margin-right: 8px;
}
</style>