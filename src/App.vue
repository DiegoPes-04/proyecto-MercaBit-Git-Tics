<template>
  <div>
    <!-- Rutas admin usan RouterView normal (sin Ionic) -->
    <RouterView v-if="isAdminRoute" />

    <!-- Rutas normales usan ion-app + ion-router-outlet -->
    <ion-app v-else>
      <ion-router-outlet />
    </ion-app>
  </div>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import { computed, onMounted } from 'vue';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const route  = useRoute();
const router = useRouter();
const isAdminRoute = computed(() => route.path.startsWith('/admin'));

onMounted(() => {
  if (!Capacitor.isNativePlatform()) return;

  // Solo home y login salen de la app; el resto delega a Ionic
  document.addEventListener('ionBackButton', (ev: any) => {
    ev.detail.register(10, (processNextHandler: any) => {
      const noBack = ['/home', '/login'];
      if (noBack.includes(route.path)) {
        App.exitApp();
        return;
      }
      processNextHandler();
    });
  });
});
</script>