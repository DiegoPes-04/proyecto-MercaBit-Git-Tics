<template>
  <ion-menu content-id="main-content" side="start" :disabled="false" class="modern-menu">
    <ion-content class="menu-content">

      <!-- Header del menú -->
      <div class="menu-header">
        <div class="brand-row">
          <div class="brand-icon">
            <svg width="20" height="20" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="11" height="11" rx="2" fill="#F5A623"/>
              <rect x="21" y="4" width="11" height="11" rx="2" fill="#F5A623"/>
              <rect x="4" y="21" width="11" height="11" rx="2" fill="#F5A623"/>
              <rect x="21" y="21" width="11" height="11" rx="2" fill="#F5A623"/>
            </svg>
          </div>
          <span class="brand-name">MercaBit</span>
        </div>
      </div>

      <!-- Perfil del usuario -->
      <div class="user-profile">
        <div class="avatar-wrap">
          <img :src="userPhoto" alt="Usuario" class="user-avatar" />
          <div class="online-dot" />
        </div>
        <div class="user-info">
          <p class="user-name">{{ userName }}</p>
          <span class="user-tag">Comprador · Vendedor</span>
        </div>
      </div>

      <!-- Divider -->
      <div class="menu-divider" />

      <!-- Items de navegación -->
      <ion-list class="nav-list" lines="none">
        <div>

          <ion-item button class="nav-item" @click="navegar('/home')">
            <div class="nav-icon-wrap orange" slot="start">
              <ion-icon :icon="homeOutline" />
            </div>
            <ion-label>Inicio</ion-label>
          </ion-item>

          <ion-item button class="nav-item" @click="navegar('/Notification')">
            <div class="nav-icon-wrap blue" slot="start">
              <ion-icon :icon="notificationsOutline" />
            </div>
            <ion-label>Notificaciones</ion-label>
          </ion-item>

          <ion-item button class="nav-item" @click="navegar('/MisCalificaciones')">
            <div class="nav-icon-wrap green" slot="start">
              <ion-icon :icon="clipboardOutline" />
            </div>
            <ion-label>Mis calificaciones</ion-label>
          </ion-item>

          <ion-item button class="nav-item" @click="navegar('/Miscompras')">
            <div class="nav-icon-wrap purple" slot="start">
              <ion-icon :icon="cartOutline" />
            </div>
            <ion-label>Mis Compras</ion-label>
          </ion-item>

          <ion-item button class="nav-item" @click="navegar('/ofertas-realizadas')">
            <div class="nav-icon-wrap teal" slot="start">
              <ion-icon :icon="checkmarkCircleOutline" />
            </div>
            <ion-label>Ofertas realizadas</ion-label>
          </ion-item>

          <ion-item button class="nav-item" @click="navegar('/agregar-producto')">
            <div class="nav-icon-wrap orange" slot="start">
              <ion-icon :icon="addOutline" />
            </div>
            <ion-label>Agregar producto</ion-label>
          </ion-item>

          <ion-item button class="nav-item" @click="navegar('/mis-publicaciones')">
            <div class="nav-icon-wrap blue" slot="start">
              <ion-icon :icon="bagCheckOutline" />
            </div>
            <ion-label>Mis publicaciones</ion-label>
          </ion-item>

          <ion-item button class="nav-item" @click="navegar('/categorias')">
            <div class="nav-icon-wrap green" slot="start">
              <ion-icon :icon="folderOutline" />
            </div>
            <ion-label>Categorías</ion-label>
          </ion-item>

          <ion-item button class="nav-item" @click="navegar('/explorar')">
            <div class="nav-icon-wrap orange" slot="start">
              <ion-icon :icon="searchOutline" />
            </div>
            <ion-label>Explorar</ion-label>
          </ion-item>

          <ion-item button class="nav-item" @click="navegar('/mi-cuenta')">
            <div class="nav-icon-wrap purple" slot="start">
              <ion-icon :icon="personOutline" />
            </div>
            <ion-label>Mi Cuenta</ion-label>
          </ion-item>

          <ion-item button class="nav-item" @click="navegar('/accerca-de-la-app')">
            <div class="nav-icon-wrap teal" slot="start">
              <ion-icon :icon="informationCircleOutline" />
            </div>
            <ion-label>Acerca de la App</ion-label>
          </ion-item>

        </div>
      </ion-list>

      <!-- Divider -->
      <div class="menu-divider" />

      <!-- Botón de cerrar sesión -->
      <div class="logout-wrap">
        <button class="logout-btn" @click="logout">
          <ion-icon :icon="logOutOutline" />
          <span>Cerrar sesión</span>
        </button>
      </div>

    </ion-content>
  </ion-menu>
</template>

<script setup>
import {
  IonMenu,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  menuController,
} from '@ionic/vue';
import {
  homeOutline,
  notificationsOutline,
  clipboardOutline,
  cartOutline,
  checkmarkCircleOutline,
  folderOutline,
  personOutline,
  informationCircleOutline,
  logOutOutline,
  addOutline,
  bagCheckOutline,
  searchOutline
} from 'ionicons/icons';
import { logoutUser } from '@/services/authService';
import { useRouter } from 'vue-router';
import { ref, onMounted, onUnmounted } from 'vue';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';

const router = useRouter();

const navegar = (path) => {
  menuController.close()
  setTimeout(() => {
    router.push(path)
  }, 250)
};
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
/* ── Menu base ─────────────────────────────────────── */
.menu-content {
  --background: #ffffff;
  --padding-start: 0;
  --padding-end: 0;
}

/* ── Header ────────────────────────────────────────── */
.menu-header {
  padding: 52px 20px 20px;
  background: #ffffff;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-icon {
  width: 40px;
  height: 40px;
  background: #111111;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-name {
  font-size: 1.4rem;
  font-weight: 900;
  color: #111111;
  letter-spacing: -0.01em;
}

/* ── User profile ──────────────────────────────────── */
.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px 20px;
}

.avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #F5A623;
}

.online-dot {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 12px;
  height: 12px;
  background: #27AE60;
  border-radius: 50%;
  border: 2px solid #fff;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #111;
  margin: 0 0 2px;
}

.user-tag {
  font-size: 0.72rem;
  color: #999;
}

/* ── Divider ───────────────────────────────────────── */
.menu-divider {
  height: 1px;
  background: #F0F0F0;
  margin: 4px 20px;
}

/* ── Nav list ──────────────────────────────────────── */
.nav-list {
  padding: 8px 12px;
  background: transparent;
}

.nav-item {
  --background: transparent;
  --background-activated: #FFF8EE;
  --color: #222;
  --padding-start: 8px;
  --inner-padding-end: 8px;
  --min-height: 52px;
  border-radius: 12px;
  margin-bottom: 2px;
  font-size: 0.9rem;
  font-weight: 600;
}

.nav-item ion-label {
  color: #222;
  font-size: 0.88rem;
  font-weight: 600;
}

/* Iconos con fondo de color */
.nav-icon-wrap {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  font-size: 1rem;
  flex-shrink: 0;
}

.nav-icon-wrap ion-icon {
  font-size: 1.05rem;
  color: #fff;
}

.nav-icon-wrap.orange { background: #F5A623; }
.nav-icon-wrap.blue   { background: #4A90D9; }
.nav-icon-wrap.green  { background: #27AE60; }
.nav-icon-wrap.purple { background: #8E44AD; }
.nav-icon-wrap.teal   { background: #16A085; }

/* ── Logout ────────────────────────────────────────── */
.logout-wrap {
  padding: 16px 20px 40px;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #FFF0E6;
  border: none;
  border-radius: 12px;
  padding: 13px 18px;
  width: 100%;
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 700;
  color: #E07010;
  transition: background 0.2s;
}

.logout-btn:active {
  background: #FFE0CC;
}

.logout-btn ion-icon {
  font-size: 1.15rem;
  color: #E07010;
}
</style>