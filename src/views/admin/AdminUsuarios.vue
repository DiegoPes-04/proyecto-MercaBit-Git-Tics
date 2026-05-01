<template>
  <div class="admin-usuarios">

    <!-- Búsqueda -->
    <div class="search-wrap">
      <span>🔍</span>
      <input v-model="busqueda" type="text" placeholder="Buscar por nombre o email..." class="search-input" />
    </div>

    <!-- Filtros -->
    <div class="filtros">
      <button v-for="f in filtros" :key="f.value" class="filtro-btn" :class="{ active: filtroActivo === f.value }" @click="filtroActivo = f.value">
        {{ f.label }} <span class="filtro-count">{{ f.count }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div class="loading-state" v-if="cargando">
      <div class="spinner" />
      <p>Cargando usuarios...</p>
    </div>

    <!-- Lista -->
    <div class="usuarios-list" v-else>

      <!-- Card usuario -->
      <div class="usuario-card" v-for="user in usuariosFiltrados" :key="user.id">

        <!-- Fila principal -->
        <div class="card-row">
          <div class="user-avatar" :class="user.suspendido ? 'avatar-suspendido' : ''">
            {{ getIniciales(user.name) }}
          </div>
          <div class="user-data">
            <p class="user-name">{{ user.name || 'Sin nombre' }}</p>
            <p class="user-email">{{ user.email }}</p>
          </div>
          <span class="estado-pill" :class="user.suspendido ? 'pill-red' : 'pill-green'">
            {{ user.suspendido ? 'Suspendido' : 'Activo' }}
          </span>
        </div>

        <!-- Info adicional -->
        <div class="card-meta">
          <div class="meta-chip">💰 ${{ formatSaldo(user.saldo) }}</div>
          <div class="meta-chip">📅 {{ formatFecha(user.createdAt) }}</div>
        </div>

        <!-- Acciones -->
        <div class="card-actions">
          <button class="act-btn btn-toggle" :class="user.suspendido ? 'green' : 'orange'" @click="toggleSuspension(user)" :disabled="procesando === user.id">
            {{ user.suspendido ? '✅ Activar' : '🚫 Suspender' }}
          </button>
          <button class="act-btn btn-blue" @click="abrirModalSaldo(user)">💰 Saldo</button>
          <button class="act-btn btn-red" @click="eliminarUsuario(user)" :disabled="procesando === user.id">🗑️</button>
        </div>
      </div>

      <div class="empty-state" v-if="usuariosFiltrados.length === 0">
        <p>No se encontraron usuarios</p>
      </div>
    </div>

    <!-- Modal saldo -->
    <div class="modal-overlay" v-if="modalSaldo" @click.self="modalSaldo = false">
      <div class="modal-card">
        <h3 class="modal-title">💰 Ajustar Saldo</h3>
        <p class="modal-sub">{{ usuarioSeleccionado?.name }}</p>
        <p class="modal-actual">Actual: <strong>${{ formatSaldo(usuarioSeleccionado?.saldo) }}</strong></p>
        <input v-model.number="nuevoSaldo" type="number" class="modal-input" placeholder="Nuevo saldo en COP" />
        <div class="modal-btns">
          <button class="modal-btn cancel" @click="modalSaldo = false">Cancelar</button>
          <button class="modal-btn confirm" @click="actualizarSaldo">Guardar</button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <transition name="toast-fade">
      <div class="toast" v-if="toast.visible" :class="toast.tipo">{{ toast.mensaje }}</div>
    </transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/firebase/FirebaseConfig'

const cargando = ref(true)
const procesando = ref(null)
const busqueda = ref('')
const filtroActivo = ref('todos')
const usuarios = ref([])
const modalSaldo = ref(false)
const usuarioSeleccionado = ref(null)
const nuevoSaldo = ref(0)
const toast = ref({ visible: false, mensaje: '', tipo: '' })

const totalUsuarios = computed(() => usuarios.value.length)
const usuariosActivos = computed(() => usuarios.value.filter(u => !u.suspendido).length)
const usuariosSuspendidos = computed(() => usuarios.value.filter(u => u.suspendido).length)

const filtros = computed(() => [
  { label: 'Todos', value: 'todos', count: totalUsuarios.value },
  { label: 'Activos', value: 'activos', count: usuariosActivos.value },
  { label: 'Suspendidos', value: 'suspendidos', count: usuariosSuspendidos.value },
])

const usuariosFiltrados = computed(() => {
  let lista = usuarios.value
  if (filtroActivo.value === 'activos') lista = lista.filter(u => !u.suspendido)
  if (filtroActivo.value === 'suspendidos') lista = lista.filter(u => u.suspendido)
  if (busqueda.value) {
    const q = busqueda.value.toLowerCase()
    lista = lista.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    )
  }
  return lista
})

const getIniciales = (n) => n ? n.split(' ').map(p => p[0]).join('').toUpperCase().slice(0,2) : '?'
const formatSaldo = (v) => Number(v || 0).toLocaleString('es-CO')
const formatFecha = (f) => {
  if (!f) return '—'
  try { const d = f?.toDate ? f.toDate() : new Date(f); return d.toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' }) }
  catch { return '—' }
}

const mostrarToast = (mensaje, tipo = 'success') => {
  toast.value = { visible: true, mensaje, tipo }
  setTimeout(() => { toast.value.visible = false }, 3000)
}

const toggleSuspension = async (user) => {
  procesando.value = user.id
  try {
    const nuevo = !user.suspendido
    await updateDoc(doc(db, 'users', user.id), { suspendido: nuevo })
    user.suspendido = nuevo
    mostrarToast(nuevo ? 'Usuario suspendido' : 'Usuario activado')
  } catch { mostrarToast('Error al actualizar', 'error') }
  finally { procesando.value = null }
}

const eliminarUsuario = async (user) => {
  if (!confirm(`¿Eliminar a "${user.name || user.email}"?\n\nEsta acción no se puede deshacer.`)) return
  procesando.value = user.id
  try {
    await deleteDoc(doc(db, 'users', user.id))
    usuarios.value = usuarios.value.filter(u => u.id !== user.id)
    mostrarToast('Usuario eliminado')
  } catch { mostrarToast('Error al eliminar', 'error') }
  finally { procesando.value = null }
}

const abrirModalSaldo = (user) => {
  usuarioSeleccionado.value = user
  nuevoSaldo.value = user.saldo || 0
  modalSaldo.value = true
}

const actualizarSaldo = async () => {
  if (!usuarioSeleccionado.value) return
  try {
    await updateDoc(doc(db, 'users', usuarioSeleccionado.value.id), { saldo: nuevoSaldo.value })
    usuarioSeleccionado.value.saldo = nuevoSaldo.value
    modalSaldo.value = false
    mostrarToast('Saldo actualizado')
  } catch { mostrarToast('Error al actualizar saldo', 'error') }
}

onMounted(async () => {
  try {
    const snap = await getDocs(collection(db, 'users'))
    usuarios.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const fa = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
        const fb = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
        return fb - fa
      })
  } catch (e) { console.error(e) }
  finally { cargando.value = false }
})
</script>

<style scoped>
.admin-usuarios { padding-bottom: 40px; display: flex; flex-direction: column; gap: 12px; }

/* Búsqueda */
.search-wrap {
  display: flex; align-items: center; gap: 10px;
  background: #fff; border-radius: 14px; padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.search-input { border: none; outline: none; font-size: 0.88rem; color: #111; flex: 1; background: none; }

/* Filtros */
.filtros { display: flex; gap: 8px; }
.filtro-btn {
  flex: 1; background: #fff; border: 1.5px solid #eee;
  border-radius: 12px; padding: 10px 8px;
  font-size: 0.75rem; font-weight: 700; color: #888;
  cursor: pointer; display: flex; flex-direction: column;
  align-items: center; gap: 2px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
}
.filtro-btn.active { background: #1A1D2E; border-color: #1A1D2E; color: #F5A623; }
.filtro-count { font-size: 1rem; font-weight: 900; color: inherit; }

/* Loading */
.loading-state { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #aaa; gap: 12px; }
.spinner { width: 32px; height: 32px; border: 3px solid #F5F5F5; border-top-color: #F5A623; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Cards */
.usuarios-list { display: flex; flex-direction: column; gap: 10px; }
.usuario-card {
  background: #fff; border-radius: 16px; padding: 14px 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  display: flex; flex-direction: column; gap: 10px;
}

/* Fila principal */
.card-row { display: flex; align-items: center; gap: 10px; }
.user-avatar {
  width: 42px; height: 42px; background: #1A1D2E;
  border-radius: 50%; display: flex; align-items: center;
  justify-content: center; font-size: 0.82rem; font-weight: 800;
  color: #fff; flex-shrink: 0;
}
.avatar-suspendido { background: #ccc; }
.user-data { flex: 1; min-width: 0; }
.user-name { font-size: 0.88rem; font-weight: 800; color: #111; margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-email { font-size: 0.7rem; color: #aaa; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.estado-pill { font-size: 0.6rem; font-weight: 800; padding: 4px 10px; border-radius: 20px; flex-shrink: 0; }
.pill-green { background: #E8F5E9; color: #27AE60; }
.pill-red { background: #FFF0F0; color: #E53935; }

/* Meta */
.card-meta { display: flex; gap: 8px; flex-wrap: wrap; }
.meta-chip { font-size: 0.7rem; color: #666; background: #F5F5F5; border-radius: 8px; padding: 4px 10px; }

/* Acciones */
.card-actions { display: flex; gap: 8px; border-top: 1px solid #F5F5F5; padding-top: 10px; }
.act-btn { flex: 1; border: none; border-radius: 10px; padding: 8px 6px; font-size: 0.72rem; font-weight: 700; cursor: pointer; }
.act-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-toggle.orange { background: #FFF8EE; color: #E07010; }
.btn-toggle.green { background: #E8F5E9; color: #27AE60; }
.btn-blue { background: #EEF2FF; color: #4A90D9; }
.btn-red { background: #FFF0F0; color: #E53935; flex: 0; padding: 8px 14px; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal-card { background: #fff; border-radius: 20px; padding: 24px; width: 100%; max-width: 320px; }
.modal-title { font-size: 1rem; font-weight: 800; color: #111; margin: 0 0 4px; }
.modal-sub { font-size: 0.82rem; color: #888; margin: 0 0 6px; }
.modal-actual { font-size: 0.85rem; color: #555; margin: 0 0 16px; }
.modal-actual strong { color: #F5A623; }
.modal-input { width: 100%; padding: 12px 14px; border: 1.5px solid #eee; border-radius: 10px; font-size: 0.9rem; outline: none; box-sizing: border-box; margin-bottom: 16px; }
.modal-input:focus { border-color: #F5A623; }
.modal-btns { display: flex; gap: 10px; }
.modal-btn { flex: 1; padding: 12px; border: none; border-radius: 10px; font-size: 0.85rem; font-weight: 700; cursor: pointer; }
.modal-btn.cancel { background: #F5F5F5; color: #555; }
.modal-btn.confirm { background: #1A1D2E; color: #fff; }

/* Toast */
.toast { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: #1A1D2E; color: #fff; padding: 12px 24px; border-radius: 20px; font-size: 0.82rem; font-weight: 700; z-index: 2000; white-space: nowrap; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
.toast.error { background: #E53935; }
.toast-fade-enter-active, .toast-fade-leave-active { transition: all 0.3s; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }

.empty-state { text-align: center; padding: 40px; color: #bbb; font-size: 0.85rem; }
</style>