<template>
  <div class="cat-card" @click="irADetalles">
    <!-- Imagen -->
    <div class="card-img-wrap">
      <img
        :src="categoria.foto_categoria || '/img/imagen-prueba.jpg'"
        :alt="categoria.nombre_categoria"
        class="card-img"
        @error="onImgError"
      />
    </div>

    <!-- Info -->
    <div class="card-body">
      <h3 class="card-name">{{ categoria.nombre_categoria }}</h3>
      <div class="card-footer">
        <span class="card-sub">{{ categoria.totalProductos || 0 }} SUBASTAS ACTIVAS</span>
        <div class="arrow-btn">
          <ion-icon :icon="arrowForwardOutline" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { IonIcon } from '@ionic/vue'
import { arrowForwardOutline } from 'ionicons/icons'
import { useRouter } from 'vue-router'

const props = defineProps({
  categoria: {
    type: Object,
    required: true
  }
})

const router = useRouter()

function irADetalles() {
  router.push(`/categoria/${props.categoria.id}`)
}

function onImgError(e) {
  e.target.src = '/img/imagen-prueba.jpg'
}
</script>

<style scoped>
.cat-card {
  background: #ffffff;
  border-radius: 18px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  transition: transform 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.cat-card:active {
  transform: scale(0.97);
}

/* ── Imagen ────────────────────────────────────────── */
.card-img-wrap {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: #1a1a1a;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.cat-card:active .card-img {
  transform: scale(1.04);
}

/* ── Body ──────────────────────────────────────────── */
.card-body {
  padding: 10px 12px 12px;
}

.card-name {
  font-size: 0.9rem;
  font-weight: 800;
  color: #111;
  margin: 0 0 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-sub {
  font-size: 0.6rem;
  font-weight: 600;
  color: #aaa;
  letter-spacing: 0.04em;
  line-height: 1.3;
  flex: 1;
}

.arrow-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #FFF3E0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.arrow-btn ion-icon {
  font-size: 0.85rem;
  color: #F5A623;
}
</style>