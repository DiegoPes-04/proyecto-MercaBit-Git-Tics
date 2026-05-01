<template>
  <div class="admin-reportes">

    <div class="stats-row">
      <div class="stat-card red"><span class="stat-num">{{ reportesPendientes }}</span><span class="stat-lbl">Pendientes</span></div>
      <div class="stat-card green"><span class="stat-num">{{ reportesResueltos }}</span><span class="stat-lbl">Resueltos</span></div>
    </div>

    <div class="loading-state" v-if="cargando">
      <div class="spinner" /><p>Cargando reportes...</p>
    </div>

    <div class="list" v-else>
      <div class="reporte-card" v-for="rep in reportes" :key="rep.id">
        <div class="rep-header">
          <span class="rep-tipo">🚨 {{ rep.motivo || 'Reporte' }}</span>
          <span class="rep-estado" :class="rep.estado === 'resuelto' ? 'badge-green' : 'badge-red'">
            {{ rep.estado || 'Pendiente' }}
          </span>
        </div>
        <p class="rep-desc">{{ rep.descripcion || 'Sin descripción' }}</p>
        <div class="rep-meta">
          <span>👤 Denunciante: {{ maskId(rep.denuncianteId) }}</span>
          <span>👤 Denunciado: {{ maskId(rep.denunciadoId) }}</span>
        </div>
        <p class="rep-fecha">📅 {{ formatFecha(rep.fecha) }}</p>
        <div class="rep-actions" v-if="rep.estado !== 'resuelto'">
          <button class="btn-resolver" @click="resolverReporte(rep)">✅ Marcar resuelto</button>
        </div>
      </div>

      <div class="empty-state" v-if="reportes.length === 0">
        <div style="font-size: 3rem; margin-bottom: 12px;">✅</div>
        <p>No hay reportes pendientes</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/firebase/FirebaseConfig'

const cargando = ref(true)
const reportes = ref([])

const reportesPendientes = computed(() => reportes.value.filter(r => r.estado !== 'resuelto').length)
const reportesResueltos = computed(() => reportes.value.filter(r => r.estado === 'resuelto').length)

const maskId = (id) => id ? id.slice(0, 4) + '****' : '—'

const formatFecha = (fecha) => {
  if (!fecha) return '—'
  try {
    const d = fecha?.toDate ? fecha.toDate() : new Date(fecha)
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return '—' }
}

const resolverReporte = async (rep) => {
  try {
    await updateDoc(doc(db, 'reportes', rep.id), { estado: 'resuelto' })
    rep.estado = 'resuelto'
  } catch (e) {
    console.error('Error:', e)
  }
}

onMounted(async () => {
  try {
    const snap = await getDocs(collection(db, 'reportes'))
    reportes.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('Error:', e)
  } finally {
    cargando.value = false
  }
})
</script>

<style scoped>
.admin-reportes { padding-bottom: 40px; }
.stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
.stat-card { background: #fff; border-radius: 14px; padding: 16px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.stat-card.red { border-top: 3px solid #E53935; }
.stat-card.green { border-top: 3px solid #27AE60; }
.stat-num { display: block; font-size: 1.4rem; font-weight: 900; color: #111; }
.stat-lbl { font-size: 0.62rem; font-weight: 700; color: #aaa; }
.loading-state { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #aaa; gap: 12px; }
.spinner { width: 32px; height: 32px; border: 3px solid #F5F5F5; border-top-color: #F5A623; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.list { display: flex; flex-direction: column; gap: 10px; }
.reporte-card { background: #fff; border-radius: 16px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.rep-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.rep-tipo { font-size: 0.85rem; font-weight: 800; color: #111; }
.rep-estado { font-size: 0.6rem; font-weight: 800; padding: 3px 8px; border-radius: 6px; }
.badge-green { background: #E8F5E9; color: #27AE60; }
.badge-red { background: #FFF0F0; color: #E53935; }
.rep-desc { font-size: 0.82rem; color: #555; margin: 0 0 8px; }
.rep-meta { display: flex; gap: 12px; font-size: 0.7rem; color: #888; margin-bottom: 4px; flex-wrap: wrap; }
.rep-fecha { font-size: 0.68rem; color: #aaa; margin: 0 0 10px; }
.rep-actions { border-top: 1px solid #F5F5F5; padding-top: 10px; }
.btn-resolver { background: #E8F5E9; border: none; border-radius: 8px; padding: 8px 16px; font-size: 0.75rem; font-weight: 700; color: #27AE60; cursor: pointer; }
.empty-state { text-align: center; padding: 60px 20px; color: #bbb; font-size: 0.85rem; }
</style>