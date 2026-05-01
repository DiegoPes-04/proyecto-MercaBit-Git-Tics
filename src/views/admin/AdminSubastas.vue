<template>
  <div class="admin-subastas">

    <!-- Filtros -->
    <div class="page-header">
      <div class="search-wrap">
        <span>🔍</span>
        <input v-model="busqueda" type="text" placeholder="Buscar subasta..." class="search-input" />
      </div>
      <div class="filtros">
        <button v-for="f in filtros" :key="f.value" class="filtro-btn" :class="{ active: filtroActivo === f.value }" @click="filtroActivo = f.value">
          {{ f.label }}
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-card"><span class="stat-num">{{ totalSubastas }}</span><span class="stat-lbl">Total</span></div>
      <div class="stat-card green"><span class="stat-num">{{ subastasActivas }}</span><span class="stat-lbl">Activas</span></div>
      <div class="stat-card gray"><span class="stat-num">{{ subastasFinalizadas }}</span><span class="stat-lbl">Finalizadas</span></div>
    </div>

    <!-- Loading -->
    <div class="loading-state" v-if="cargando">
      <div class="spinner" /><p>Cargando subastas...</p>
    </div>

    <!-- Lista -->
    <div class="subastas-list" v-else>
      <div class="subasta-card" v-for="sub in subastasFiltradas" :key="sub.id">
        <div class="sub-img">
          <img :src="sub.imagenes?.[0]?.url || '/img/imagen-prueba.jpg'" @error="onImgError" />
          <span class="estado-badge" :class="getEstadoClass(sub.estado)">{{ sub.estado }}</span>
        </div>
        <div class="sub-info">
          <h3 class="sub-nombre">{{ sub.nombre }}</h3>
          <p class="sub-cat">{{ sub.categoria }}</p>
          <div class="sub-meta">
            <span>💰 ${{ formatPrice(sub.precioBase) }}</span>
            <span>🔨 {{ sub.numero_ofertas || 0 }} ofertas</span>
          </div>
          <p class="sub-fecha">📅 Cierra: {{ formatFecha(sub.fechaCierre) }}</p>
        </div>
        <div class="sub-actions" v-if="sub.estado === 'Disponible'">
          <button class="btn-cancelar" @click="cancelarSubasta(sub)" :disabled="procesando === sub.id">
            {{ procesando === sub.id ? '...' : '🚫 Cancelar' }}
          </button>
        </div>
      </div>
      <div class="empty-state" v-if="subastasFiltradas.length === 0"><p>No se encontraron subastas</p></div>
    </div>

    <div class="toast" v-if="toast.visible" :class="toast.tipo">{{ toast.mensaje }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/firebase/FirebaseConfig'

const cargando = ref(true)
const procesando = ref(null)
const busqueda = ref('')
const filtroActivo = ref('todas')
const subastas = ref([])
const toast = ref({ visible: false, mensaje: '', tipo: 'success' })

const filtros = [
  { label: 'Todas', value: 'todas' },
  { label: 'Activas', value: 'Disponible' },
  { label: 'Finalizadas', value: 'Finalizada' },
  { label: 'Canceladas', value: 'Cancelada' },
]

const totalSubastas = computed(() => subastas.value.length)
const subastasActivas = computed(() => subastas.value.filter(s => s.estado === 'Disponible').length)
const subastasFinalizadas = computed(() => subastas.value.filter(s => s.estado === 'Finalizada').length)

const subastasFiltradas = computed(() => {
  let lista = subastas.value
  if (filtroActivo.value !== 'todas') lista = lista.filter(s => s.estado === filtroActivo.value)
  if (busqueda.value) {
    const q = busqueda.value.toLowerCase()
    lista = lista.filter(s => s.nombre?.toLowerCase().includes(q) || s.categoria?.toLowerCase().includes(q))
  }
  return lista
})

const getEstadoClass = (estado) => {
  if (estado === 'Disponible') return 'badge-activa'
  if (estado === 'Finalizada') return 'badge-finalizada'
  return 'badge-cancelada'
}

const formatPrice = (val) => {
  if (!val) return '0'
  if (typeof val === 'object') return Number(Object.values(val)[0] || 0).toLocaleString('es-CO')
  return Number(val).toLocaleString('es-CO')
}

const formatFecha = (fecha) => {
  if (!fecha) return '—'
  try {
    const d = fecha?.toDate ? fecha.toDate() : new Date(fecha)
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return '—' }
}

const onImgError = (e) => { e.target.src = '/img/imagen-prueba.jpg' }

const mostrarToast = (mensaje, tipo = 'success') => {
  toast.value = { visible: true, mensaje, tipo }
  setTimeout(() => { toast.value.visible = false }, 3000)
}

const cancelarSubasta = async (sub) => {
  if (!confirm(`¿Cancelar la subasta "${sub.nombre}"?`)) return
  procesando.value = sub.id
  try {
    await updateDoc(doc(db, 'products', sub.id), {
      estado: 'Cancelada',
      motivoCierre: 'cancelada_admin',
      fechaCierreReal: new Date().toISOString()
    })
    sub.estado = 'Cancelada'
    mostrarToast('Subasta cancelada correctamente')
  } catch (e) {
    mostrarToast('Error al cancelar subasta', 'error')
  } finally {
    procesando.value = null
  }
}

onMounted(async () => {
  try {
    const snap = await getDocs(collection(db, 'products'))
    subastas.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const fa = a.fechaCierre?.toDate ? a.fechaCierre.toDate() : new Date(a.fechaCierre || 0)
        const fb = b.fechaCierre?.toDate ? b.fechaCierre.toDate() : new Date(b.fechaCierre || 0)
        return fb - fa
      })
  } catch (e) {
    console.error('Error:', e)
  } finally {
    cargando.value = false
  }
})
</script>

<style scoped>
.admin-subastas { padding-bottom: 40px; }
.page-header { background: #fff; border-radius: 16px; padding: 16px; margin-bottom: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
.search-wrap { display: flex; align-items: center; gap: 8px; background: #F5F5F5; border-radius: 10px; padding: 10px 14px; margin-bottom: 12px; }
.search-input { border: none; background: none; outline: none; font-size: 0.88rem; color: #111; flex: 1; }
.filtros { display: flex; gap: 8px; flex-wrap: wrap; }
.filtro-btn { background: #F5F5F5; border: none; border-radius: 20px; padding: 6px 14px; font-size: 0.75rem; font-weight: 700; color: #666; cursor: pointer; }
.filtro-btn.active { background: #1A1D2E; color: #F5A623; }
.stats-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 12px; }
.stat-card { background: #fff; border-radius: 14px; padding: 14px 10px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.stat-card.green { border-top: 3px solid #27AE60; }
.stat-card.gray { border-top: 3px solid #aaa; }
.stat-num { display: block; font-size: 1.4rem; font-weight: 900; color: #111; }
.stat-lbl { font-size: 0.62rem; font-weight: 700; color: #aaa; letter-spacing: 0.06em; }
.loading-state { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #aaa; gap: 12px; }
.spinner { width: 32px; height: 32px; border: 3px solid #F5F5F5; border-top-color: #F5A623; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.subastas-list { display: flex; flex-direction: column; gap: 10px; }
.subasta-card { background: #fff; border-radius: 16px; padding: 14px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); display: flex; gap: 12px; }
.sub-img { position: relative; width: 70px; height: 70px; border-radius: 12px; overflow: hidden; flex-shrink: 0; background: #f0f0f0; }
.sub-img img { width: 100%; height: 100%; object-fit: cover; }
.estado-badge { position: absolute; top: 4px; left: 4px; font-size: 0.48rem; font-weight: 800; padding: 2px 5px; border-radius: 4px; }
.badge-activa { background: #27AE60; color: #fff; }
.badge-finalizada { background: #555; color: #fff; }
.badge-cancelada { background: #E53935; color: #fff; }
.sub-info { flex: 1; min-width: 0; }
.sub-nombre { font-size: 0.88rem; font-weight: 800; color: #111; margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sub-cat { font-size: 0.7rem; color: #F5A623; font-weight: 700; margin: 0 0 6px; }
.sub-meta { display: flex; gap: 10px; font-size: 0.7rem; color: #888; margin-bottom: 4px; }
.sub-fecha { font-size: 0.68rem; color: #aaa; margin: 0; }
.sub-actions { display: flex; align-items: center; }
.btn-cancelar { background: #FFF0F0; border: none; border-radius: 8px; padding: 7px 10px; font-size: 0.68rem; font-weight: 700; color: #E53935; cursor: pointer; white-space: nowrap; }
.empty-state { text-align: center; padding: 40px; color: #bbb; font-size: 0.85rem; }
.toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #1A1D2E; color: #fff; padding: 12px 24px; border-radius: 20px; font-size: 0.82rem; font-weight: 700; z-index: 2000; }
.toast.error { background: #E53935; }
</style>