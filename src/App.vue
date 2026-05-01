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
import { RouterView, useRoute } from 'vue-router';
import { computed } from 'vue';

const route = useRoute();
const isAdminRoute = computed(() => route.path.startsWith('/admin'));
</script>