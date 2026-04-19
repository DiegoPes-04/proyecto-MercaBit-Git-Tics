<template>
  <ion-footer v-if="!route.meta.hideLayout">
    <ion-toolbar>
      <ion-title>MercaBit - © 2025 - Todos los derechos reservados</ion-title>
    </ion-toolbar>
  </ion-footer>
</template>

<script setup>
import { IonFooter, IonToolbar, IonTitle } from '@ionic/vue'
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped>
ion-footer {
  color: white;
  border-radius: 20px 20px 0 0;
  overflow: hidden;
  position: fixed;
  bottom: 0;
  width: 100%;
}

ion-title {
  font-size: 13px;
  color: white;
}

ion-toolbar {
  text-align: center;
  padding: 5px;
}
</style>