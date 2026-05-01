<template>
  <div class="admin-transacciones">

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-card"><span class="stat-num">{{ totalCompras }}</span><span class="stat-lbl">Transacciones</span></div>
      <div class="stat-card green"><span class="stat-num">${{ formatPrice(totalIngresos) }}</span><span class="stat-lbl">Total COP</span></div>
    </div>

    <!-- Filtro estado -->
    <div class="filtros-wrap">
      <button v-for="f in filtros" :key="f.value" class="filtro-btn" :class="{ active: filtroActivo === f.value }" @click="filtroActivo = f.value">
        {{ f.label }}
      </button>
    </div>

    <div class="loading-state" v-if="cargando">
      <div class="spinner" /><p>Cargando transacciones...</p>
    </div>

    <div class="list" v-else>
      <div class="compra-card" v-for="compra in comprasFiltradas" :key="compra.id">
        <div class="compra-icon">💳</div>
        <div class="compra-info">
          <p class="compra-producto">{{ compra.nombreProducto || 'Producto' }}</p>
          <p class="compra-meta">Comprador: {{ compra.compradorNombre || maskId(compra.userId) }}</p>
          <p class="compra-meta">Vendedor: {{ compra.vendedorNombre || maskId(compra.vendedorId) }}</p>
          <p class="compra-fecha">📅 {{ formatFecha(compra.fechaCompra) }}</p>
        </div>
        <div class="compra-right">
          <span class="compra-precio">${{ formatPrice(compra.precioTotal) }}</span>
          <span class="estado-badge" :class="getEstadoClass(compra.estado)">{{ compra.estado || 'En proceso' }}</span>
        </div>
      </div>
      <div class="empty-state" v-if="comprasFiltradas.length === 0"><p>No hay transacciones</p></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase/FirebaseConfig'

const cargando = ref(true)
const compras = ref([])
const filtroActivo = ref('todas')

const filtros = [
  { label: 'Todas', value: 'todas' },
  { label: 'En proceso', value: 'En proceso' },
  { label: 'Completadas', value: 'completado' },
]

const totalCompras = computed(() => compras.value.length)
const totalIngresos = computed(() => compras.value.reduce((s, c) => s + (Number(c.precioTotal) || 0), 0))

const comprasFiltradas = computed(() => {
  if (filtroActivo.value === 'todas') return compras.value
  return compras.value.filter(c => c.estado === filtroActivo.value)
})

const formatPrice = (val) => Number(val || 0).toLocaleString('es-CO')

const maskId = (id) => id ? id.slice(0, 4) + '****' : '—'

const formatFecha = (fecha) => {
  if (!fecha) return '—'
  try {
    const d = fecha?.toDate ? fecha.toDate() : new Date(fecha)
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return '—' }
}

const getEstadoClass = (estado) => {
  if (estado === 'completado') return 'badge-green'
  if (estado === 'En proceso') return 'badge-orange'
  return 'badge-gray'
}

onMounted(async () => {
  try {
    const snap = await getDocs(collection(db, 'compras'))
    const lista = await Promise.all(snap.docs.map(async (d) => {
      const data = { id: d.id, ...d.data() }
      // Obtener nombre del producto
      if (data.productoId) {
        try {
          const pSnap = await getDoc(doc(db, 'products', data.productoId))
          if (pSnap.exists()) data.nombreProducto = pSnap.data().nombre
        } catch (_) {}
      }
      return data
    }))
    compras.value = lista.sort((a, b) => {
      const fa = a.fechaCompra?.toDate ? a.fechaCompra.toDate() : new Date(a.fechaCompra || 0)
      const fb = b.fechaCompra?.toDate ? b.fechaCompra.toDate() : new Date(b.fechaCompra || 0)
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
.admin-transacciones { padding-bottom: 40px; }
.stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
.stat-card { background: #fff; border-radius: 14px; padding: 16px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.stat-card.green { border-top: 3px solid #27AE60; }
.stat-num { display: block; font-size: 1.2rem; font-weight: 900; color: #111; }
.stat-lbl { font-size: 0.62rem; font-weight: 700; color: #aaa; }
.filtros-wrap { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.filtro-btn { background: #F5F5F5; border: none; border-radius: 20px; padding: 6px 14px; font-size: 0.75rem; font-weight: 700; color: #666; cursor: pointer; }
.filtro-btn.active { background: #1A1D2E; color: #F5A623; }
.loading-state { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #aaa; gap: 12px; }
.spinner { width: 32px; height: 32px; border: 3px solid #F5F5F5; border-top-color: #F5A623; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.list { display: flex; flex-direction: column; gap: 10px; }
.compra-card { background: #fff; border-radius: 16px; padding: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); display: flex; gap: 12px; align-items: flex-start; }
.compra-icon { font-size: 1.5rem; flex-shrink: 0; }
.compra-info { flex: 1; min-width: 0; }
.compra-producto { font-size: 0.88rem; font-weight: 800; color: #111; margin: 0 0 4px; }
.compra-meta { font-size: 0.7rem; color: #888; margin: 0 0 2px; }
.compra-fecha { font-size: 0.68rem; color: #aaa; margin: 0; }
.compra-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
.compra-precio { font-size: 0.9rem; font-weight: 900; color: #111; }
.estado-badge { font-size: 0.6rem; font-weight: 800; padding: 3px 8px; border-radius: 6px; }
.badge-green { background: #E8F5E9; color: #27AE60; }
.badge-orange { background: #FFF8EE; color: #F5A623; }
.badge-gray { background: #F5F5F5; color: #888; }
.empty-state { text-align: center; padding: 40px; color: #bbb; font-size: 0.85rem; }
</style>