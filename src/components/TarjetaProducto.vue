<template>
  <div class="tarjeta" @click="verProducto">
    <!-- Imagen -->
    <div class="tarjeta-img-wrap">
      <img
        :src="producto.imagenes?.[0]?.url || '/img/imagen-prueba.jpg'"
        class="tarjeta-img"
        @error="onImgError"
      />
      <!-- Badge verificado si aplica -->
      <!-- Badge mi producto -->
      <span class="mi-producto-badge" v-if="esMiProducto">
        <ion-icon :icon="personOutline" /> TU PUBLICACIÓN
      </span>

      <!-- Badge de estado -->
      <span class="verified-badge" v-if="producto.verificado && producto.estado !== 'Finalizada' && !esMiProducto">
        <ion-icon :icon="checkmarkCircle" /> VERIFICADO
      </span>
      <span class="estado-badge-finalizada" v-if="producto.estado === 'Finalizada'">
        FINALIZADA
      </span>
      <span class="estado-badge-disponible" v-else-if="producto.estado === 'Disponible'">
        ACTIVA
      </span>
    </div>

    <!-- Info -->
    <div class="tarjeta-body">
      <span class="tarjeta-cat">{{ producto.categoria }}</span>
      <h3 class="tarjeta-nombre">{{ producto.nombre }}</h3>

      <div class="tarjeta-precios">
        <div class="precio-row">
          <span class="precio-label">Base</span>
          <span class="precio-val">${{ formatPrecio(producto.precioBase) }}</span>
        </div>
        <div class="precio-row naranja">
          <span class="precio-label">Inmediato</span>
          <span class="precio-val">${{ formatPrecio(producto.precioVentaInmediata) }}</span>
        </div>
        <div class="comision-row">
          <span class="comision-tag">+{{ comisionPorcentaje }}% comisión MercaBit</span>
        </div>
      </div>

      <!-- Vendedor y calificación -->
      <div class="tarjeta-vendedor" @click="irAlPerfil">
        <div class="v-stars">
          <ion-icon
            v-for="s in 5"
            :key="s"
            :icon="s <= Math.round(vendedorPromedio) ? star : starOutline"
            class="v-star"
            :class="{ filled: s <= Math.round(vendedorPromedio) }"
          />
        </div>
        <span class="v-score">{{ vendedorPromedio > 0 ? vendedorPromedio.toFixed(1) : 'Nuevo' }}</span>
        <span class="v-name">{{ vendedorNombre }}</span>
      </div>

      <div class="tarjeta-footer">
        <ion-icon :icon="timeOutline" class="footer-icon" />
        <span class="tarjeta-fecha">{{ formatoFecha(producto.fechaCierre) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { IonIcon } from '@ionic/vue'
import { checkmarkCircle, timeOutline, personOutline, star, starOutline } from 'ionicons/icons'
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase/FirebaseConfig'

const props = defineProps({
  producto: { type: Object, required: true },
  currentUserId: { type: String, default: null }
})

const COMISIONES = {
  'Inmuebles': 3,
  'Autos y Motos': 2.5,
  'Industrial y Maquinaria': 2,
  'Tecnología': 1.5,
  'Ropa': 1,
  'Hogar y Decoracion': 0.5,
}

const comisionPorcentaje = computed(() => COMISIONES[props.producto?.categoria] ?? 1)

const esMiProducto = computed(() =>
  props.currentUserId && props.producto?.userId === props.currentUserId
)

const router = useRouter()

const vendedorNombre = ref('')
const vendedorPromedio = ref(0)

onMounted(async () => {
  const uid = props.producto?.userId || props.producto?.vendedorId
  if (!uid) return
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    if (snap.exists()) {
      const d = snap.data()
      vendedorNombre.value = d.name ? d.name.split(' ')[0] : 'Vendedor'
      vendedorPromedio.value = d.promedio || 0
    }
  } catch (_) {}
})

function irAlPerfil(e) {
  e.stopPropagation()
  const uid = props.producto?.userId || props.producto?.vendedorId
  if (uid) router.push(`/perfil/${uid}`)
}

function verProducto() {
  if (props.producto?.id) {
    router.push(`/producto/${props.producto.id}`)
  }
}

function onImgError(e) {
  e.target.src = '/img/imagen-prueba.jpg'
}

function formatPrecio(val) {
  if (!val && val !== 0) return '—'
  if (typeof val === 'object') {
    const inner = val.valor || val.value || Object.values(val)[0]
    return Number(inner || 0).toLocaleString('es-CO')
  }
  return Number(val).toLocaleString('es-CO')
}

function formatoFecha(fecha) {
  try {
    const d = fecha?.toDate ? fecha.toDate() : new Date(fecha)
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return 'N/A' }
}
</script>

<style scoped>
.tarjeta {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  transition: transform 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.tarjeta:active { transform: scale(0.97); }

/* Imagen */
.tarjeta-img-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  background: #f0f0f0;
  overflow: hidden;
}

.tarjeta-img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.tarjeta:active .tarjeta-img { transform: scale(1.04); }

.estado-badge-finalizada {
  position: absolute; top: 8px; right: 8px;
  background: #E53935; color: #fff;
  font-size: 0.52rem; font-weight: 800;
  letter-spacing: 0.06em; padding: 3px 7px;
  border-radius: 5px;
}

.estado-badge-disponible {
  position: absolute; top: 8px; right: 8px;
  background: #27AE60; color: #fff;
  font-size: 0.52rem; font-weight: 800;
  letter-spacing: 0.06em; padding: 3px 7px;
  border-radius: 5px;
}

.mi-producto-badge {
  position: absolute; top: 8px; left: 8px;
  background: #1A1D2E; color: #F5A623;
  font-size: 0.52rem; font-weight: 800;
  letter-spacing: 0.06em; padding: 3px 7px;
  border-radius: 5px; display: flex;
  align-items: center; gap: 3px;
}

.verified-badge {
  position: absolute; top: 8px; left: 8px;
  background: #27AE60; color: #fff;
  font-size: 0.52rem; font-weight: 700;
  letter-spacing: 0.06em; padding: 3px 6px;
  border-radius: 5px; display: flex;
  align-items: center; gap: 3px;
}

/* Body */
.tarjeta-body { padding: 10px 10px 12px; }

.tarjeta-cat {
  font-size: 0.58rem; font-weight: 700;
  color: #F5A623; letter-spacing: 0.08em;
  text-transform: uppercase; display: block;
  margin-bottom: 3px;
}

.tarjeta-nombre {
  font-size: 0.85rem; font-weight: 800;
  color: #111; margin: 0 0 8px;
  white-space: nowrap; overflow: hidden;
  text-overflow: ellipsis;
}

/* Precios */
.tarjeta-precios { display: flex; flex-direction: column; gap: 3px; margin-bottom: 8px; }

.precio-row {
  display: flex; align-items: center;
  justify-content: space-between;
}

.precio-label { font-size: 0.6rem; color: #aaa; font-weight: 600; }
.precio-val { font-size: 0.78rem; font-weight: 800; color: #111; }
.precio-row.naranja .precio-val { color: #F5A623; }

.comision-row { margin-top: 4px; }
.comision-tag {
  font-size: 0.58rem; font-weight: 700;
  color: #fff; background: #1A1D2E;
  padding: 2px 7px; border-radius: 4px;
  letter-spacing: 0.03em;
}

/* Vendedor */
.tarjeta-vendedor {
  display: flex; align-items: center; gap: 3px;
  padding: 6px 0; cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.v-stars { display: flex; gap: 1px; }
.v-star { font-size: 0.58rem; color: #ddd; }
.v-star.filled { color: #F5A623; }
.v-score { font-size: 0.6rem; font-weight: 800; color: #F5A623; margin: 0 1px; }
.v-name { font-size: 0.6rem; color: #aaa; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }

/* Footer fecha */
.tarjeta-footer {
  display: flex; align-items: center; gap: 4px;
  padding-top: 6px;
  border-top: 1px solid #F5F5F5;
}

.footer-icon { font-size: 0.75rem; color: #aaa; }
.tarjeta-fecha { font-size: 0.65rem; color: #aaa; font-weight: 600; }
</style>