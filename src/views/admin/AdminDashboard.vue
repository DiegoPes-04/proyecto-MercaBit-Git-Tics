<template>
  <div class="dashboard">

    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card" v-for="kpi in kpis" :key="kpi.label">
        <div class="kpi-icon-wrap" :style="{ background: kpi.color + '22' }">
          <ion-icon :icon="kpi.icon" :style="{ color: kpi.color }" />
        </div>
        <div class="kpi-info">
          <p class="kpi-label">{{ kpi.label }}</p>
          <h2 class="kpi-val">{{ kpi.valor }}</h2>
          <p class="kpi-sub" :class="kpi.tendencia > 0 ? 'up' : 'down'">
            {{ kpi.tendencia > 0 ? '▲' : '▼' }} {{ Math.abs(kpi.tendencia) }}% vs ayer
          </p>
        </div>
      </div>
    </div>

    <!-- Fila: Subastas activas + Alertas -->
    <div class="row-2">

      <!-- Subastas activas recientes -->
      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">Subastas Activas</h3>
          <button class="panel-link" @click="navigate('/admin/subastas')">Ver todas →</button>
        </div>
        <div class="loading-mini" v-if="cargando">
          <div class="spinner-sm" />
        </div>
        <div v-else>
          <div class="subasta-row" v-for="sub in subastasRecientes" :key="sub.id">
            <div class="sub-img">
              <img :src="sub.imagenes?.[0]?.url || '/img/imagen-prueba.jpg'" @error="onImgError" />
            </div>
            <div class="sub-info">
              <p class="sub-nombre">{{ sub.nombre }}</p>
              <p class="sub-meta">{{ sub.categoria }} · {{ sub.numero_ofertas || 0 }} ofertas</p>
            </div>
            <div class="sub-right">
              <span class="sub-precio">${{ formatPrice(sub.precioBase) }}</span>
              <button class="btn-danger-sm" @click="cancelarSubasta(sub.id)">Cancelar</button>
            </div>
          </div>
          <div class="empty-panel" v-if="subastasRecientes.length === 0">
            <p>No hay subastas activas</p>
          </div>
        </div>
      </div>

      <!-- Alertas y actividad -->
      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">Actividad Reciente</h3>
        </div>
        <div class="actividad-list">
          <div class="actividad-item" v-for="(act, i) in actividad" :key="i">
            <div class="act-dot" :style="{ background: act.color }" />
            <div class="act-info">
              <p class="act-texto">{{ act.texto }}</p>
              <p class="act-tiempo">{{ act.tiempo }}</p>
            </div>
          </div>
          <div class="empty-panel" v-if="actividad.length === 0">
            <p>Sin actividad reciente</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Usuarios recientes -->
    <div class="panel">
      <div class="panel-header">
        <h3 class="panel-title">Usuarios Recientes</h3>
        <button class="panel-link" @click="navigate('/admin/usuarios')">Ver todos →</button>
      </div>
      <div class="usuarios-table">
        <div class="table-header">
          <span>Usuario</span>
          <span>Email</span>
          <span>Registro</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>
        <div class="table-row" v-for="user in usuariosRecientes" :key="user.id">
          <div class="user-cell">
            <div class="user-avatar-sm">{{ getIniciales(user.name) }}</div>
            <span>{{ user.name || 'Sin nombre' }}</span>
          </div>
          <span class="user-email">{{ user.email }}</span>
          <span class="user-fecha">{{ formatFecha(user.createdAt) }}</span>
          <span class="estado-chip" :class="user.suspendido ? 'suspendido' : 'activo'">
            {{ user.suspendido ? 'Suspendido' : 'Activo' }}
          </span>
          <div class="acciones-cell">
            <button class="btn-sm" @click="navigate(`/admin/usuarios`)">Ver</button>
          </div>
        </div>
        <div class="empty-panel" v-if="usuariosRecientes.length === 0">
          <p>No hay usuarios registrados</p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { IonIcon } from '@ionic/vue'
import {
  peopleOutline, hammerOutline, cardOutline,
  trendingUpOutline, alertCircleOutline, checkmarkCircleOutline
} from 'ionicons/icons'
import { ref, computed, onMounted } from 'vue'
import { collection, getDocs, query, where, orderBy, limit, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/firebase/FirebaseConfig'
import { useRouter } from 'vue-router'

const router = useRouter()
const navigate = (path) => router.push(path)
const cargando = ref(true)

const totalUsuarios = ref(0)
const totalSubastas = ref(0)
const subastasActivas = ref(0)
const totalTransacciones = ref(0)
const subastasRecientes = ref([])
const usuariosRecientes = ref([])
const actividad = ref([])

const kpis = computed(() => [
  { label: 'Usuarios Totales', valor: totalUsuarios.value, icon: peopleOutline, color: '#4A90D9', tendencia: 12 },
  { label: 'Subastas Activas', valor: subastasActivas.value, icon: hammerOutline, color: '#F5A623', tendencia: 5 },
  { label: 'Subastas Totales', valor: totalSubastas.value, icon: trendingUpOutline, color: '#27AE60', tendencia: 8 },
  { label: 'Transacciones', valor: totalTransacciones.value, icon: cardOutline, color: '#8E44AD', tendencia: -2 },
])

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

const getIniciales = (nombre) => {
  if (!nombre) return '?'
  return nombre.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

const onImgError = (e) => { e.target.src = '/img/imagen-prueba.jpg' }

const cancelarSubasta = async (id) => {
  if (!confirm('¿Cancelar esta subasta?')) return
  try {
    await updateDoc(doc(db, 'products', id), {
      estado: 'Cancelada',
      motivoCierre: 'cancelada_admin',
      fechaCierreReal: new Date().toISOString()
    })
    subastasRecientes.value = subastasRecientes.value.filter(s => s.id !== id)
    subastasActivas.value--
  } catch (e) {
    console.error('Error cancelando subasta:', e)
  }
}

onMounted(async () => {
  try {
    const ahora = new Date()

    // Usuarios
    const usersSnap = await getDocs(collection(db, 'users'))
    totalUsuarios.value = usersSnap.size
    usuariosRecientes.value = usersSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const fa = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
        const fb = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
        return fb - fa
      })
      .slice(0, 5)

    // Subastas
    const prodsSnap = await getDocs(collection(db, 'products'))
    totalSubastas.value = prodsSnap.size
    const todos = prodsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const activas = todos.filter(p => {
      const fc = p.fechaCierre?.toDate ? p.fechaCierre.toDate() : new Date(p.fechaCierre)
      return p.estado === 'Disponible' && fc > ahora
    })
    subastasActivas.value = activas.length
    subastasRecientes.value = activas.slice(0, 5)

    // Transacciones (compras)
    const comprasSnap = await getDocs(collection(db, 'compras'))
    totalTransacciones.value = comprasSnap.size

    // Actividad reciente (últimas notificaciones del sistema)
    const notifsSnap = await getDocs(
      query(collection(db, 'notificaciones'), orderBy('timestamp', 'desc'), limit(8))
    )
    actividad.value = notifsSnap.docs.map(d => {
      const data = d.data()
      return {
        texto: data.mensaje || data.titulo || 'Actividad',
        tiempo: formatFecha(data.timestamp),
        color: data.tipo === 'ganaste' ? '#27AE60' : data.tipo === 'superado' ? '#F5A623' : '#4A90D9'
      }
    })

  } catch (e) {
    console.error('Error cargando dashboard:', e)
  } finally {
    cargando.value = false
  }
})
</script>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 16px; }

/* KPIs */
.kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.kpi-card {
  background: #fff; border-radius: 16px; padding: 16px;
  display: flex; align-items: center; gap: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
}
.kpi-icon-wrap {
  width: 46px; height: 46px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.kpi-icon-wrap ion-icon { font-size: 1.3rem; }
.kpi-label { font-size: 0.62rem; font-weight: 700; color: #aaa; letter-spacing: 0.06em; margin: 0 0 3px; }
.kpi-val { font-size: 1.4rem; font-weight: 900; color: #111; margin: 0 0 2px; }
.kpi-sub { font-size: 0.62rem; font-weight: 700; margin: 0; }
.kpi-sub.up { color: #27AE60; }
.kpi-sub.down { color: #E53935; }

/* Row 2 */
.row-2 { display: grid; grid-template-columns: 1fr; gap: 12px; }

/* Panels */
.panel {
  background: #fff; border-radius: 18px; padding: 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.panel-title { font-size: 0.88rem; font-weight: 800; color: #111; margin: 0; }
.panel-link { background: none; border: none; font-size: 0.75rem; font-weight: 700; color: #F5A623; cursor: pointer; }

.loading-mini { display: flex; justify-content: center; padding: 20px; }
.spinner-sm { width: 24px; height: 24px; border: 2px solid #F5F5F5; border-top-color: #F5A623; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Subastas */
.subasta-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #F5F5F5; }
.subasta-row:last-child { border-bottom: none; }
.sub-img { width: 44px; height: 44px; border-radius: 10px; overflow: hidden; background: #f0f0f0; flex-shrink: 0; }
.sub-img img { width: 100%; height: 100%; object-fit: cover; }
.sub-info { flex: 1; min-width: 0; }
.sub-nombre { font-size: 0.82rem; font-weight: 700; color: #111; margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sub-meta { font-size: 0.65rem; color: #aaa; margin: 0; }
.sub-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.sub-precio { font-size: 0.75rem; font-weight: 800; color: #111; }
.btn-danger-sm { background: #FFF0F0; border: none; border-radius: 6px; padding: 3px 8px; font-size: 0.62rem; font-weight: 700; color: #E53935; cursor: pointer; }

/* Actividad */
.actividad-list { display: flex; flex-direction: column; gap: 10px; }
.actividad-item { display: flex; align-items: flex-start; gap: 10px; }
.act-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
.act-texto { font-size: 0.78rem; color: #333; margin: 0 0 2px; line-height: 1.3; }
.act-tiempo { font-size: 0.65rem; color: #aaa; margin: 0; }

/* Tabla usuarios */
.usuarios-table { display: flex; flex-direction: column; gap: 0; }
.table-header { display: grid; grid-template-columns: 1.5fr 2fr 1fr 0.8fr 0.8fr; gap: 8px; padding: 8px 0; font-size: 0.6rem; font-weight: 800; color: #aaa; letter-spacing: 0.06em; border-bottom: 1px solid #F5F5F5; }
.table-row { display: grid; grid-template-columns: 1.5fr 2fr 1fr 0.8fr 0.8fr; gap: 8px; padding: 10px 0; align-items: center; border-bottom: 1px solid #F5F5F5; font-size: 0.75rem; }
.table-row:last-child { border-bottom: none; }

.user-cell { display: flex; align-items: center; gap: 6px; }
.user-avatar-sm { width: 28px; height: 28px; background: #1A1D2E; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; font-weight: 800; color: #fff; flex-shrink: 0; }
.user-email { font-size: 0.68rem; color: #666; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.user-fecha { font-size: 0.68rem; color: #aaa; }

.estado-chip { font-size: 0.6rem; font-weight: 800; padding: 3px 7px; border-radius: 6px; text-align: center; }
.estado-chip.activo { background: #E8F5E9; color: #27AE60; }
.estado-chip.suspendido { background: #FFF0F0; color: #E53935; }

.acciones-cell { display: flex; gap: 4px; }
.btn-sm { background: #F5F5F5; border: none; border-radius: 6px; padding: 4px 10px; font-size: 0.65rem; font-weight: 700; color: #555; cursor: pointer; }

.empty-panel { text-align: center; padding: 20px; color: #bbb; font-size: 0.82rem; }
</style>