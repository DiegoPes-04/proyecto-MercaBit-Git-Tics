<template>
  <ion-page>
    <ion-header class="agregar-header">
      <ion-toolbar class="agregar-toolbar">
        <ion-buttons slot="start">
          <ion-menu-button class="menu-btn" />
        </ion-buttons>
        <ion-title class="agregar-title">Nuevo Producto</ion-title>
        <ion-buttons slot="end">
          <ion-button class="cancel-btn" @click="cancelar">Cancelar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="agregar-content">

      <!-- Hero -->
      <div class="hero-section">
        <h1 class="hero-title">Crear<br /><span class="hero-accent">Subasta</span></h1>
        <p class="hero-sub">Tu producto quedará en revisión antes de publicarse</p>
      </div>

      <form @submit.prevent="crearProducto" class="form-wrap">

        <!-- ── Información básica ── -->
        <div class="form-section">
          <h3 class="form-section-title">Información básica</h3>

          <div class="field-group">
            <label class="field-label">Nombre del producto</label>
            <input
              v-model="producto.nombre"
              type="text"
              class="field-input"
              placeholder="Ej: iPhone 15 Pro Max"
              required
            />
          </div>

          <div class="field-group">
            <label class="field-label">Categoría</label>
            <!-- Selector visual de categorías -->
          <div class="cat-selector">
            <div
              v-for="cat in categoriasList"
              :key="cat.value"
              class="cat-chip"
              :class="{ selected: producto.categoria === cat.value }"
              @click="producto.categoria = cat.value"
            >
              <ion-icon :icon="cat.icon" class="cat-chip-icon" />
              <span>{{ cat.label }}</span>
            </div>
          </div>
          </div>

          <div class="field-group" v-if="producto.categoria === 'otra'">
            <label class="field-label">Nueva categoría</label>
            <input
              v-model="producto.nuevaCategoria"
              type="text"
              class="field-input"
              placeholder="Nombre de la nueva categoría"
            />
          </div>

          <div class="field-group">
            <label class="field-label">Descripción</label>
            <textarea
              v-model="producto.descripcion"
              class="field-textarea"
              placeholder="Describe tu producto en detalle..."
              rows="4"
              required
            />
          </div>
        </div>

        <!-- ── Fotos ── -->
        <div class="form-section">
          <h3 class="form-section-title">Fotos del producto</h3>

          <!-- Grid de 3 slots -->
          <div class="fotos-slots">
            <!-- Slots con imagen -->
            <div
              class="foto-slot filled"
              v-for="(preview, index) in imagenesPreview"
              :key="'preview-' + index"
            >
              <img :src="preview" class="slot-img" />
              <button class="slot-remove" type="button" @click="eliminarImagenPreview(index)">
                <ion-icon :icon="closeCircle" />
              </button>
              <span class="slot-num">{{ index + 1 }}</span>
            </div>

            <!-- Slots vacíos hasta 3 -->
            <label
              class="foto-slot empty"
              v-for="i in (3 - imagenesPreview.length)"
              :key="'empty-' + i"
              v-if="imagenesPreview.length < 3"
            >
              <ion-icon :icon="cameraOutline" class="slot-add-icon" />
              <span class="slot-add-text">Foto {{ imagenesPreview.length + i }}</span>
              <input
                type="file"
                accept="image/*"
                style="display:none"
                @change="cargarImagenes"
              />
            </label>
          </div>
          <p class="fotos-hint">{{ imagenesPreview.length }}/3 fotos · Toca un slot vacío para agregar</p>

          <!-- Progreso -->
          <div class="progreso-wrap" v-if="cargandoImagenes">
            <div class="progreso-bar">
              <div class="progreso-fill" :style="{ width: (progresoSubida * 100) + '%' }" />
            </div>
            <span class="progreso-text">Subiendo... {{ Math.round(progresoSubida * 100) }}%</span>
          </div>
        </div>

        <!-- ── Fechas ── -->
        <div class="form-section">
          <h3 class="form-section-title">Duración de la subasta</h3>

          <div class="fechas-grid">
            <div class="field-group">
              <label class="field-label">Fecha apertura</label>
              <input
                :value="mostrarFecha(producto.fechaApertura)"
                class="field-input"
                placeholder="DD/MM/AAAA"
                readonly
                @click="mostrarCalendarioApertura = true"
              />
              <ion-datetime
                v-if="mostrarCalendarioApertura"
                v-model="producto.fechaApertura"
                presentation="date"
                @ionChange="onDateChangeApertura"
                @ionCancel="mostrarCalendarioApertura = false"
              />
            </div>

            <div class="field-group">
              <label class="field-label">Hora apertura</label>
              <ion-select
                v-model="producto.horaApertura"
                placeholder="Hora"
                interface="action-sheet"
                class="field-select"
              >
                <ion-select-option v-for="hora in horasDisponibles" :key="hora" :value="hora">
                  {{ hora }}:00
                </ion-select-option>
              </ion-select>
            </div>

            <div class="field-group">
              <label class="field-label">Fecha cierre</label>
              <input
                :value="mostrarFecha(producto.fechaCierre)"
                class="field-input"
                placeholder="DD/MM/AAAA"
                readonly
                @click="mostrarCalendarioCierre = true"
              />
              <ion-datetime
                v-if="mostrarCalendarioCierre"
                v-model="producto.fechaCierre"
                presentation="date"
                @ionChange="onDateChangeCierre"
                @ionCancel="mostrarCalendarioCierre = false"
              />
            </div>

            <div class="field-group">
              <label class="field-label">Hora cierre</label>
              <ion-select
                v-model="producto.horaCierre"
                placeholder="Hora"
                interface="action-sheet"
                class="field-select"
              >
                <ion-select-option v-for="hora in horasDisponibles" :key="hora" :value="hora">
                  {{ hora }}:00
                </ion-select-option>
              </ion-select>
            </div>
          </div>
        </div>

        <!-- ── Precios ── -->
        <div class="form-section">
          <h3 class="form-section-title">Precios</h3>

          <div class="field-group">
            <label class="field-label">Precio base <span class="field-badge">COP</span></label>
            <input
              v-model="producto.precioBase"
              type="number"
              min="0"
              step="0.01"
              class="field-input"
              placeholder="0"
            />
          </div>

          <div class="field-group">
            <label class="field-label">Precio cierre inmediato <span class="field-badge orange">COP</span></label>
            <input
              v-model="producto.precioVentaInmediata"
              type="number"
              min="0"
              step="0.01"
              class="field-input"
              placeholder="0"
            />
          </div>
        </div>

        <!-- ── Documentos de respaldo ── -->
        <div class="form-section">
          <h3 class="form-section-title">Documentos de respaldo</h3>
          <p class="docs-desc">Sube facturas, escrituras, certificados u otros documentos que validen tu producto. Solo el administrador los verá para verificar la subasta.</p>

          <div class="docs-list" v-if="documentosNombres.length">
            <div class="doc-item" v-for="(nombre, i) in documentosNombres" :key="i">
              <ion-icon :icon="documentOutline" class="doc-icon" />
              <span class="doc-nombre">{{ nombre }}</span>
              <button type="button" class="doc-remove" @click="eliminarDocumento(i)">
                <ion-icon :icon="closeCircle" />
              </button>
            </div>
          </div>

          <label class="doc-upload-btn" v-if="documentosNombres.length < 5">
            <ion-icon :icon="cloudUploadOutline" />
            <span>Agregar documento</span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              multiple
              style="display:none"
              @change="cargarDocumentos"
            />
          </label>
          <p class="docs-hint">PDF, imagen o Word · Máx. 5 archivos · No visibles al público</p>
        </div>

        <!-- ── Botón submit ── -->
        <div class="submit-wrap">
          <button
            type="submit"
            class="submit-btn"
            :disabled="cargandoImagenes || !formularioValido"
            :class="{ disabled: cargandoImagenes || !formularioValido }"
          >
            <ion-icon :icon="addCircleOutline" />
            {{ cargandoImagenes ? 'Enviando...' : 'Enviar a Revisión' }}
          </button>
        </div>

        <div style="height: 80px" />
      </form>
    </ion-content>

    <ion-toast
      :is-open="toastVisible"
      message="¡Producto enviado! Será revisado por el administrador antes de publicarse."
      :duration="2000"
      color="success"
      position="top"
      @didDismiss="toastVisible = false"
    />

    <!-- Bottom Nav -->
    <div class="bottom-nav">
      <div class="nav-item" @click="navigate('/home')">
        <ion-icon :icon="homeOutline" /><span>INICIO</span>
      </div>
      <div class="nav-item" @click="navigate('/categorias')">
        <ion-icon :icon="gridOutline" /><span>CATEGORÍAS</span>
      </div>
      <div class="nav-item" @click="navigate('/ofertas-realizadas')">
        <ion-icon :icon="layersOutline" /><span>MIS TRATOS</span>
      </div>
      <div class="nav-item" @click="navigate('/explorar')">
        <ion-icon :icon="searchOutline" /><span>EXPLORAR</span>
      </div>
      <div class="nav-item" @click="navigate('/Notification')">
        <ion-icon :icon="notificationsOutline" /><span>ALERTS</span>
      </div>
      <div class="nav-item" @click="navigate('/mi-cuenta')">
        <ion-icon :icon="personOutline" /><span>CUENTA</span>
      </div>
    </div>
  </ion-page>
</template>

<script setup>
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton, IonButton, IonIcon,
  IonSelect, IonSelectOption, IonDatetime, IonToast
} from '@ionic/vue'
import {
  closeCircle, cloudUploadOutline, addCircleOutline, cameraOutline,
  documentOutline, homeOutline, gridOutline, layersOutline,
  searchOutline, notificationsOutline, personOutline
} from 'ionicons/icons'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { db, auth, storage } from '../firebase/FirebaseConfig'
import { collection, addDoc, updateDoc } from 'firebase/firestore'
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { v4 as uuidv4 } from 'uuid'

const router = useRouter()

const toastVisible = ref(false)

const categoriasList = [
  { value: 'Tecnología',            label: 'Tecnología',       icon: 'laptop-outline' },
  { value: 'Autos y Motos',         label: 'Autos y Motos',    icon: 'car-outline' },
  { value: 'Ropa',                  label: 'Ropa',             icon: 'shirt-outline' },
  { value: 'Inmuebles',             label: 'Inmuebles',        icon: 'home-outline' },
  { value: 'Hogar y Decoracion',    label: 'Hogar',            icon: 'leaf-outline' },
  { value: 'Industrial y Maquinaria', label: 'Industrial',     icon: 'construct-outline' },
  { value: 'otra',                  label: 'Otra',             icon: 'add-circle-outline' },
]
const navigate = (path) => router.push(path)

const mostrarCalendarioApertura = ref(false)
const mostrarCalendarioCierre = ref(false)
const cargandoImagenes = ref(false)
const progresoSubida = ref(0)
const imagenesPreview = ref([])
const documentosArchivos = ref([])
const documentosNombres = ref([])

const horasDisponibles = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))

const producto = ref({
  nombre: '', categoria: '', nuevaCategoria: '', descripcion: '',
  fotos: [], fechaApertura: null, horaApertura: '',
  fechaCierre: null, horaCierre: '', precioBase: null, precioVentaInmediata: null
})

const formularioValido = computed(() => {
  const catOk = producto.value.categoria !== 'otra' ||
    producto.value.nuevaCategoria.trim() !== ''
  return producto.value.nombre && producto.value.categoria && catOk &&
    producto.value.descripcion && producto.value.fechaApertura &&
    producto.value.horaApertura && producto.value.fechaCierre &&
    producto.value.horaCierre && producto.value.precioBase !== null &&
    producto.value.precioVentaInmediata !== null
})

const mostrarFecha = (fechaStr) => {
  if (!fechaStr) return ''
  const f = new Date(fechaStr)
  return `${String(f.getDate()).padStart(2,'0')}/${String(f.getMonth()+1).padStart(2,'0')}/${f.getFullYear()}`
}

const onDateChangeApertura = (e) => { producto.value.fechaApertura = e.detail.value; mostrarCalendarioApertura.value = false }
const onDateChangeCierre = (e) => { producto.value.fechaCierre = e.detail.value; mostrarCalendarioCierre.value = false }

const eliminarImagenPreview = (index) => {
  imagenesPreview.value.splice(index, 1)
  producto.value.fotos.splice(index, 1)
}

const MAX_FOTOS = 3

const cargarImagenes = (event) => {
  const archivos = Array.from(event.target.files)
  if (!archivos.length) return

  const espacioDisponible = MAX_FOTOS - producto.value.fotos.length
  const nuevos = archivos.slice(0, espacioDisponible)

  nuevos.forEach(archivo => {
    producto.value.fotos.push(archivo)
    const reader = new FileReader()
    reader.onload = (e) => imagenesPreview.value.push(e.target.result)
    reader.readAsDataURL(archivo)
  })

  // Reset input para permitir re-selección
  event.target.value = ''
}

const subirImagenes = async (userId, productoId) => {
  const fotos = producto.value.fotos
  const total = fotos.length
  let subidas = 0
  const urls = []

  return new Promise((resolve, reject) => {
    if (!fotos.length) { resolve([]); return }
    fotos.forEach((foto, index) => {
      const ext = foto.name.split('.').pop()
      const nombre = `${uuidv4()}.${ext}`
      const imgRef = storageRef(storage, `productos/${userId}/${productoId}/${nombre}`)
      const tarea = uploadBytesResumable(imgRef, foto)
      tarea.on('state_changed',
        (snap) => {
          progresoSubida.value = (subidas / total) + (snap.bytesTransferred / snap.totalBytes / total)
        },
        reject,
        async () => {
          const url = await getDownloadURL(tarea.snapshot.ref)
          urls.push({ url, nombre: foto.name, path: `productos/${userId}/${productoId}/${nombre}` })
          subidas++
          if (subidas === total) resolve(urls)
        }
      )
    })
  })
}

const cargarDocumentos = (event) => {
  const archivos = Array.from(event.target.files)
  if (!archivos.length) return
  const espacioDisponible = 5 - documentosArchivos.value.length
  archivos.slice(0, espacioDisponible).forEach(archivo => {
    documentosArchivos.value.push(archivo)
    documentosNombres.value.push(archivo.name)
  })
  event.target.value = ''
}

const eliminarDocumento = (index) => {
  documentosArchivos.value.splice(index, 1)
  documentosNombres.value.splice(index, 1)
}

const subirDocumentos = async (userId, productoId) => {
  const archivos = documentosArchivos.value
  if (!archivos.length) return []
  const urls = []
  for (const archivo of archivos) {
    const ext = archivo.name.split('.').pop()
    const nombre = `doc_${uuidv4()}.${ext}`
    const fileRef = storageRef(storage, `productos/${userId}/${productoId}/${nombre}`)
    const tarea = uploadBytesResumable(fileRef, archivo)
    await new Promise((resolve, reject) => {
      tarea.on('state_changed', null, reject, async () => {
        const url = await getDownloadURL(tarea.snapshot.ref)
        urls.push({ url, nombre: archivo.name, path: `productos/${userId}/${productoId}/${nombre}` })
        resolve()
      })
    })
  }
  return urls
}

const resetForm = () => {
  producto.value = {
    nombre: '', categoria: '', nuevaCategoria: '', descripcion: '',
    fotos: [], fechaApertura: null, horaApertura: '',
    fechaCierre: null, horaCierre: '', precioBase: null, precioVentaInmediata: null
  }
  imagenesPreview.value = []
  documentosArchivos.value = []
  documentosNombres.value = []
}

const cancelar = () => { resetForm(); router.push('/home') }

const crearProducto = async () => {
  if (!auth.currentUser) return
  try {
    cargandoImagenes.value = true
    progresoSubida.value = 0

    const categoriaFinal = producto.value.categoria === 'otra'
      ? producto.value.nuevaCategoria : producto.value.categoria

    const fAp = new Date(producto.value.fechaApertura)
    fAp.setHours(parseInt(producto.value.horaApertura), 0, 0)
    const fCi = new Date(producto.value.fechaCierre)
    fCi.setHours(parseInt(producto.value.horaCierre), 0, 0)

    const fmt = (f) => {
      const p = (n) => String(n).padStart(2,'0')
      return `${f.getFullYear()}-${p(f.getMonth()+1)}-${p(f.getDate())}T${p(f.getHours())}:${p(f.getMinutes())}:00.000`
    }

    const docRef = await addDoc(collection(db, 'products'), {
      userId: auth.currentUser.uid,
      nombre: producto.value.nombre,
      descripcion: producto.value.descripcion,
      categoria: categoriaFinal,
      precioBase: producto.value.precioBase,
      precioVentaInmediata: producto.value.precioVentaInmediata,
      fechaApertura: fmt(fAp),
      fechaCierre: fmt(fCi),
      creadoEn: new Date().toISOString(),
      estado: 'PendienteAprobacion',
      imagenes: []
    })

    const imagenes = await subirImagenes(auth.currentUser.uid, docRef.id)
    const documentos = await subirDocumentos(auth.currentUser.uid, docRef.id)
    await updateDoc(docRef, { imagenes, documentos })

    await addDoc(collection(db, 'notificaciones'), {
      mensaje: `Producto enviado a revisión: ${producto.value.nombre}`,
      timestamp: new Date().toISOString(),
      productoId: docRef.id,
      userId: auth.currentUser.uid,
      tipo: 'revision'
    })

    resetForm()
    toastVisible.value = true
    setTimeout(() => router.push('/mis-publicaciones'), 2200)
  } catch (e) {
    console.error('Error al guardar producto:', e)
  } finally {
    cargandoImagenes.value = false
  }
}
</script>

<style scoped>
.agregar-header { --background: #fff; border-bottom: 1px solid #eee; }
.agregar-toolbar { --background: #fff; --color: #111; --min-height: 60px; padding: 0 8px; }
.agregar-title { font-size: 1rem; font-weight: 800; color: #111; }
.menu-btn { --color: #111; }
.cancel-btn { --color: #aaa; font-size: 0.85rem; }
.agregar-content { --background: #F5F5F5; }

/* Hero */
.hero-section { background: #fff; padding: 20px 20px 18px; margin-bottom: 10px; }
.hero-title { font-size: 1.6rem; font-weight: 900; color: #111; line-height: 1.2; margin: 0 0 4px; }
.hero-accent { color: #F5A623; }
.hero-sub { font-size: 0.82rem; color: #aaa; margin: 0; }

/* Form */
.form-wrap { padding: 0 16px; }

.form-section {
  background: #fff; border-radius: 18px;
  padding: 18px 16px; margin-bottom: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.form-section-title {
  font-size: 0.78rem; font-weight: 800;
  color: #111; letter-spacing: 0.05em;
  text-transform: uppercase; margin: 0 0 16px;
  padding-bottom: 10px; border-bottom: 1px solid #F5F5F5;
}

/* Fields */
.field-group { margin-bottom: 14px; }
.field-group:last-child { margin-bottom: 0; }

.field-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.75rem; font-weight: 700;
  color: #555; margin-bottom: 6px;
}

.field-badge {
  font-size: 0.6rem; font-weight: 700;
  background: #F5F5F5; color: #aaa;
  padding: 2px 6px; border-radius: 4px;
}
.field-badge.orange { background: #FFF3E0; color: #F5A623; }

.field-input {
  width: 100%; padding: 12px 14px;
  background: #F9F9F9; border: 1.5px solid #eee;
  border-radius: 12px; font-size: 0.88rem;
  color: #111; outline: none;
  box-sizing: border-box; font-family: inherit;
  transition: border-color 0.2s;
}
.field-input:focus { border-color: #F5A623; }

.field-textarea {
  width: 100%; padding: 12px 14px;
  background: #F9F9F9; border: 1.5px solid #eee;
  border-radius: 12px; font-size: 0.88rem;
  color: #111; outline: none; resize: none;
  box-sizing: border-box; font-family: inherit;
  transition: border-color 0.2s;
}
.field-textarea:focus { border-color: #F5A623; }

.field-select {
  background: #F9F9F9; border: 1.5px solid #eee;
  border-radius: 12px; padding: 4px 14px;
  --placeholder-color: #bbb;
  --color: #111;
  width: 100%;
}
:global(.field-select::part(text)) { color: #111 !important; }
:global(.field-select::part(placeholder)) { color: #bbb !important; }

/* Fechas grid 2 cols */
.fechas-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

/* Imágenes */
.imagenes-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 8px; margin-bottom: 12px;
}

.img-preview-wrap { position: relative; aspect-ratio: 1; border-radius: 10px; overflow: hidden; }
.img-preview { width: 100%; height: 100%; object-fit: cover; }
.img-remove-btn {
  position: absolute; top: 4px; right: 4px;
  background: rgba(0,0,0,0.5); border: none;
  border-radius: 50%; width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #fff; font-size: 0.9rem;
}

.upload-area {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 6px;
  border: 2px dashed #e0e0e0; border-radius: 14px;
  padding: 24px 16px; cursor: pointer;
  transition: border-color 0.2s; text-align: center;
}
.upload-area:active { border-color: #F5A623; }
.upload-area.has-images { padding: 14px; }
.upload-icon { font-size: 1.8rem; color: #F5A623; }
.upload-text { font-size: 0.85rem; font-weight: 700; color: #111; }
.upload-sub { font-size: 0.7rem; color: #aaa; }

.progreso-wrap { margin-top: 10px; }
.progreso-bar { height: 6px; background: #F5F5F5; border-radius: 3px; overflow: hidden; margin-bottom: 4px; }
.progreso-fill { height: 100%; background: #F5A623; border-radius: 3px; transition: width 0.2s; }
.progreso-text { font-size: 0.72rem; color: #aaa; }

/* ── Categorías chips ──────────────────────────────── */
.cat-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.cat-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  background: #F9F9F9;
  border: 1.5px solid #eee;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
  color: #555;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.cat-chip:active { transform: scale(0.97); }

.cat-chip.selected {
  background: #FFF8EE;
  border-color: #F5A623;
  color: #111;
  font-weight: 700;
}

.cat-chip-icon {
  font-size: 1rem;
  color: #aaa;
  flex-shrink: 0;
  pointer-events: none;
}

.cat-chip.selected .cat-chip-icon { color: #F5A623; }

/* ── Fotos slots ───────────────────────────────────── */
.fotos-slots {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  margin-bottom: 8px;
}

.foto-slot {
  aspect-ratio: 1;
  border-radius: 14px;
  overflow: hidden;
  position: relative;
}

.foto-slot.filled {
  background: #f0f0f0;
}

.slot-img {
  width: 100%; height: 100%;
  object-fit: cover;
}

.slot-remove {
  position: absolute; top: 5px; right: 5px;
  width: 24px; height: 24px;
  background: rgba(0,0,0,0.55);
  border: none; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #fff; font-size: 0.95rem;
  z-index: 2;
}

.slot-num {
  position: absolute; bottom: 5px; left: 7px;
  font-size: 0.6rem; font-weight: 800;
  color: rgba(255,255,255,0.8);
}

.foto-slot.empty {
  background: #F9F9F9;
  border: 2px dashed #e0e0e0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 4px; cursor: pointer;
  transition: border-color 0.2s;
}

.foto-slot.empty:active { border-color: #F5A623; }

.slot-add-icon { font-size: 1.4rem; color: #ccc; }
.slot-add-text { font-size: 0.6rem; font-weight: 600; color: #bbb; }

.fotos-hint {
  font-size: 0.7rem; color: #bbb;
  margin: 0 0 4px; text-align: center;
}

/* Documentos */
.docs-desc { font-size: 0.75rem; color: #888; margin: 0 0 12px; line-height: 1.4; }
.docs-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.doc-item {
  display: flex; align-items: center; gap: 8px;
  background: #F9F9F9; border: 1.5px solid #eee;
  border-radius: 10px; padding: 10px 12px;
}
.doc-icon { font-size: 1rem; color: #F5A623; flex-shrink: 0; }
.doc-nombre { font-size: 0.75rem; color: #333; font-weight: 600; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.doc-remove { background: none; border: none; color: #ccc; cursor: pointer; font-size: 1rem; padding: 0; display: flex; align-items: center; flex-shrink: 0; }
.doc-upload-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 12px;
  border: 2px dashed #e0e0e0; border-radius: 12px;
  cursor: pointer; color: #888; font-size: 0.82rem; font-weight: 700;
  margin-bottom: 8px; transition: border-color 0.2s;
}
.doc-upload-btn:active { border-color: #F5A623; color: #F5A623; }
.doc-upload-btn ion-icon { font-size: 1.1rem; }
.docs-hint { font-size: 0.68rem; color: #bbb; margin: 0; text-align: center; }

/* Submit */
.submit-wrap { margin-top: 4px; }
.submit-btn {
  width: 100%; padding: 16px;
  background: #111; color: #fff;
  border: none; border-radius: 16px;
  font-size: 0.95rem; font-weight: 800;
  display: flex; align-items: center;
  justify-content: center; gap: 8px;
  cursor: pointer; transition: background 0.2s;
}
.submit-btn:active { background: #333; }
.submit-btn.disabled { background: #ccc; cursor: not-allowed; }
.submit-btn ion-icon { font-size: 1.1rem; pointer-events: none; }

/* Bottom Nav */
.bottom-nav { position: absolute; bottom: 0; left: 0; right: 0; height: 64px; background: #fff; border-top: 1px solid #eee; display: flex; align-items: center; justify-content: space-around; z-index: 999; box-shadow: 0 -4px 20px rgba(0,0,0,0.07); }
.nav-item { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; flex: 1; height: 100%; color: #aaa; cursor: pointer; -webkit-tap-highlight-color: transparent; user-select: none; }
.nav-item ion-icon { font-size: 1.3rem; pointer-events: none; }
.nav-item span { font-size: 0.48rem; font-weight: 700; letter-spacing: 0.06em; pointer-events: none; }
.nav-item.active { color: #F5A623; }
</style>