<template>
  <div class="admin-categorias">

    <!-- Agregar categoría -->
    <div class="add-card">
      <h3 class="add-title">➕ Nueva Categoría</h3>
      <input v-model="nuevaCat.nombre" type="text" placeholder="Nombre de la categoría" class="add-input" />
      <input v-model="nuevaCat.foto" type="text" placeholder="URL de la imagen" class="add-input" />
      <button class="add-btn" @click="agregarCategoria" :disabled="!nuevaCat.nombre || guardando">
        {{ guardando ? 'Guardando...' : 'Agregar' }}
      </button>
    </div>

    <div class="loading-state" v-if="cargando">
      <div class="spinner" /><p>Cargando categorías...</p>
    </div>

    <div class="list" v-else>
      <div class="cat-card" v-for="cat in categorias" :key="cat.id">
        <div class="cat-img">
          <img :src="cat.foto_categoria || '/img/imagen-prueba.jpg'" @error="onImgError" />
        </div>
        <div class="cat-info">
          <p class="cat-nombre">{{ cat.nombre_categoria }}</p>
          <p class="cat-id">ID: {{ cat.id.slice(0, 8) }}...</p>
        </div>
        <button class="btn-eliminar" @click="eliminarCategoria(cat.id)">🗑️</button>
      </div>
      <div class="empty-state" v-if="categorias.length === 0"><p>No hay categorías</p></div>
    </div>

    <div class="toast" v-if="toast.visible" :class="toast.tipo">{{ toast.mensaje }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/firebase/FirebaseConfig'

const cargando = ref(true)
const guardando = ref(false)
const categorias = ref([])
const nuevaCat = ref({ nombre: '', foto: '' })
const toast = ref({ visible: false, mensaje: '', tipo: 'success' })

const mostrarToast = (mensaje, tipo = 'success') => {
  toast.value = { visible: true, mensaje, tipo }
  setTimeout(() => { toast.value.visible = false }, 3000)
}

const onImgError = (e) => { e.target.src = '/img/imagen-prueba.jpg' }

const agregarCategoria = async () => {
  if (!nuevaCat.value.nombre) return
  guardando.value = true
  try {
    const docRef = await addDoc(collection(db, 'categorias'), {
      nombre_categoria: nuevaCat.value.nombre,
      foto_categoria: nuevaCat.value.foto || ''
    })
    categorias.value.unshift({
      id: docRef.id,
      nombre_categoria: nuevaCat.value.nombre,
      foto_categoria: nuevaCat.value.foto
    })
    nuevaCat.value = { nombre: '', foto: '' }
    mostrarToast('Categoría agregada correctamente')
  } catch (e) {
    mostrarToast('Error al agregar categoría', 'error')
  } finally {
    guardando.value = false
  }
}

const eliminarCategoria = async (id) => {
  if (!confirm('¿Eliminar esta categoría?')) return
  try {
    await deleteDoc(doc(db, 'categorias', id))
    categorias.value = categorias.value.filter(c => c.id !== id)
    mostrarToast('Categoría eliminada')
  } catch (e) {
    mostrarToast('Error al eliminar', 'error')
  }
}

onMounted(async () => {
  try {
    const snap = await getDocs(collection(db, 'categorias'))
    categorias.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('Error:', e)
  } finally {
    cargando.value = false
  }
})
</script>

<style scoped>
.admin-categorias { padding-bottom: 40px; }
.add-card { background: #fff; border-radius: 16px; padding: 16px; margin-bottom: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
.add-title { font-size: 0.9rem; font-weight: 800; color: #111; margin: 0 0 12px; }
.add-input { width: 100%; padding: 10px 14px; border: 1.5px solid #eee; border-radius: 10px; font-size: 0.85rem; outline: none; box-sizing: border-box; margin-bottom: 10px; }
.add-input:focus { border-color: #F5A623; }
.add-btn { width: 100%; padding: 12px; background: #1A1D2E; border: none; border-radius: 10px; color: #fff; font-size: 0.85rem; font-weight: 700; cursor: pointer; }
.add-btn:disabled { opacity: 0.5; }
.loading-state { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #aaa; gap: 12px; }
.spinner { width: 32px; height: 32px; border: 3px solid #F5F5F5; border-top-color: #F5A623; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.list { display: flex; flex-direction: column; gap: 10px; }
.cat-card { background: #fff; border-radius: 14px; padding: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 12px; }
.cat-img { width: 50px; height: 50px; border-radius: 10px; overflow: hidden; background: #f0f0f0; flex-shrink: 0; }
.cat-img img { width: 100%; height: 100%; object-fit: cover; }
.cat-info { flex: 1; }
.cat-nombre { font-size: 0.88rem; font-weight: 800; color: #111; margin: 0 0 2px; }
.cat-id { font-size: 0.65rem; color: #aaa; margin: 0; }
.btn-eliminar { background: #FFF0F0; border: none; border-radius: 8px; padding: 8px 10px; font-size: 0.9rem; cursor: pointer; }
.empty-state { text-align: center; padding: 40px; color: #bbb; font-size: 0.85rem; }
.toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #1A1D2E; color: #fff; padding: 12px 24px; border-radius: 20px; font-size: 0.82rem; font-weight: 700; z-index: 2000; }
.toast.error { background: #E53935; }
</style>