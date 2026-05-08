<template>
  <ion-page>
    <MenuDiagonal />

    <!-- Notificación flotante en primer plano -->
    <InAppNotification />

    <!-- Header del layout solo para vistas que NO tienen su propio header -->
    <ion-header v-if="!route.meta.hideLayout">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title>{{ pageTitle }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <router-view id="main-content" />

    <!-- Footer del layout solo para vistas que NO tienen su propio footer -->
    <Footer v-if="!route.meta.hideLayout" />
  </ion-page>
</template>

<script setup>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle
} from '@ionic/vue'
import MenuDiagonal from '@/components/MenuDiagonal.vue'
import Footer from '@/components/Footer.vue'
import InAppNotification from '@/components/InAppNotification.vue'
import { useRoute } from 'vue-router'
import { computed, onMounted } from 'vue'
import { notificationService } from '@/services/notification.service'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

const route = useRoute()

onMounted(() => {
  // Inicializar push notifications cuando el usuario ya esté autenticado
  const auth = getAuth()
  onAuthStateChanged(auth, (user) => {
    if (user) {
      notificationService.initialize()
    }
  })
})

const pageTitle = computed(() => {
  const titles = {
    '/login': 'Inicio de Sesión',
    '/home': 'MercaBit - Productos',
    '/registro': 'Registro',
    '/recuperar-contrasena': 'Recuperar Contraseña',
    '/accerca-de-la-app': 'Acerca de MercaBit',
    '/terminos-condiciones': 'Términos y Condiciones',
    '/notification': 'Notificaciones',
    '/mis-publicaciones': 'Mis Publicaciones',
    '/agregar-producto': 'Agregar Producto',
    '/categorias': 'Categorías',
    '/informacion-personal': 'Información Personal',
    '/mis-compras': 'Mis Compras',
    '/explorar': 'Explorar',
    '/mi-cuenta': 'Mi Cuenta',
    '/MisCalificaciones': 'Mis Calificaciones',
    '/Miscompras': 'Mis Compras',
    '/ofertas-realizadas': 'Ofertas Realizadas',
  }
  return titles[route.path] || 'MercaBit'
})
</script>