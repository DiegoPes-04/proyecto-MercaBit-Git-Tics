<template>
  <ion-page>
    <ion-header class="soporte-header">
      <ion-toolbar class="soporte-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" text="" class="back-btn" />
        </ion-buttons>
        <div class="toolbar-center">
          <div class="admin-avatar-sm">AD</div>
          <div>
            <p class="toolbar-title">Soporte MercaBit</p>
            <p class="toolbar-sub">{{ adminOnline ? 'En línea' : 'Responde en &lt;24h' }}</p>
          </div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content class="soporte-content" ref="contentRef" :scroll-events="false">

      <!-- Banner bienvenida -->
      <div class="welcome-banner">
        <div class="welcome-icon-wrap">
          <ion-icon :icon="chatbubblesOutline" />
        </div>
        <div>
          <p class="welcome-title">Centro de Soporte</p>
          <p class="welcome-sub">Estamos aquí para ayudarte. Escríbenos con tu problema y nuestro equipo te atenderá a la brevedad.</p>
        </div>
      </div>

      <!-- Contexto de producto si viene desde una subasta -->
      <div class="product-context-banner" v-if="productoNombre">
        <ion-icon :icon="cubeOutline" />
        <span>Consultando sobre: <strong>{{ productoNombre }}</strong></span>
      </div>

      <!-- Lista de mensajes -->
      <div class="messages-wrap" id="messages-container">

        <div class="empty-chat" v-if="!mensajes.length && !cargando">
          <ion-icon :icon="chatbubbleEllipsesOutline" class="empty-icon" />
          <p>Inicia la conversación con soporte</p>
        </div>

        <template v-for="msg in mensajes" :key="msg.id">
          <div class="msg-row" :class="msg.autorRol === 'usuario' ? 'right' : 'left'">
            <div v-if="msg.autorRol === 'admin'" class="msg-admin-avatar">AD</div>

            <div class="msg-bubble" :class="msg.autorRol === 'usuario' ? 'bubble-user' : 'bubble-admin'">

              <!-- Adjuntos -->
              <div v-if="msg.adjuntos?.length" class="adjuntos-wrap">
                <div
                  v-for="(adj, i) in msg.adjuntos"
                  :key="i"
                  class="adjunto-item"
                  @click="abrirAdjunto(adj.url)"
                >
                  <template v-if="adj.tipo?.startsWith('image/')">
                    <img :src="adj.url" class="adjunto-img" />
                  </template>
                  <template v-else>
                    <div class="adjunto-file">
                      <ion-icon :icon="documentOutline" />
                      <span>{{ adj.nombre }}</span>
                    </div>
                  </template>
                </div>
              </div>

              <p class="msg-text" v-if="msg.texto">{{ msg.texto }}</p>
              <span class="msg-time">{{ formatHora(msg.timestamp) }}</span>
            </div>
          </div>
        </template>

        <div ref="anchorRef" style="height: 1px" />
      </div>

    </ion-content>

    <!-- Input area -->
    <div class="input-area">

      <!-- Preview de archivos pendientes -->
      <div class="pending-files" v-if="pendientes.length">
        <div v-for="(f, i) in pendientes" :key="i" class="pending-item">
          <img v-if="f.tipo.startsWith('image/')" :src="f.preview" class="pending-thumb" />
          <ion-icon v-else :icon="documentOutline" class="pending-doc-icon" />
          <span class="pending-name">{{ f.nombre }}</span>
          <button class="pending-remove" @click="quitarPendiente(i)">✕</button>
        </div>
      </div>

      <div class="input-row">
        <label class="attach-btn" :class="{ disabled: enviando }">
          <ion-icon :icon="attachOutline" />
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xlsx,.txt,.zip"
            style="display:none"
            @change="seleccionarArchivos"
            :disabled="enviando"
          />
        </label>

        <textarea
          v-model="texto"
          class="msg-input"
          placeholder="Escribe tu mensaje..."
          rows="1"
          @input="autoResize"
          @keydown.enter.exact.prevent="enviar"
        />

        <button
          class="send-btn"
          @click="enviar"
          :disabled="enviando || (!texto.trim() && !pendientes.length)"
        >
          <div v-if="enviando" class="send-spinner" />
          <ion-icon v-else :icon="sendOutline" />
        </button>
      </div>
    </div>

    <ion-toast
      :is-open="toastVisible"
      :message="toastMsg"
      :duration="3000"
      :color="toastColor"
      @didDismiss="toastVisible = false"
    />
  </ion-page>
</template>

<script setup>
import {
  IonPage, IonHeader, IonToolbar, IonContent,
  IonButtons, IonBackButton, IonIcon, IonToast
} from '@ionic/vue'
import {
  chatbubblesOutline, chatbubbleEllipsesOutline,
  sendOutline, attachOutline, documentOutline, cubeOutline
} from 'ionicons/icons'
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { auth, db, storage } from '@/firebase/FirebaseConfig'
import {
  collection, addDoc, onSnapshot, doc, setDoc, getDoc,
  serverTimestamp, query, orderBy
} from 'firebase/firestore'
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage'

const route = useRoute()

const mensajes = ref([])
const texto = ref('')
const pendientes = ref([])
const enviando = ref(false)
const cargando = ref(true)
const adminOnline = ref(false)
const anchorRef = ref(null)
const contentRef = ref(null)
const toastVisible = ref(false)
const toastMsg = ref('')
const toastColor = ref('success')
const userName = ref('')
let unsubscribe = null

const userId = auth.currentUser?.uid
const productoId = route.query.productoId || null
const productoNombre = route.query.productoNombre || null

const formatHora = (ts) => {
  if (!ts) return ''
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

const scrollBottom = async () => {
  await nextTick()
  anchorRef.value?.scrollIntoView({ behavior: 'smooth' })
}

const abrirAdjunto = (url) => window.open(url, '_blank')

const autoResize = (e) => {
  e.target.style.height = 'auto'
  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
}

onMounted(async () => {
  if (!userId) return

  try {
    const snap = await getDoc(doc(db, 'users', userId))
    if (snap.exists()) userName.value = snap.data().name || ''
  } catch (_) {}

  const q = query(collection(db, 'soportes', userId, 'mensajes'), orderBy('timestamp', 'asc'))
  unsubscribe = onSnapshot(q, (snap) => {
    mensajes.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    cargando.value = false
    scrollBottom()
  })
})

onUnmounted(() => { if (unsubscribe) unsubscribe() })

const seleccionarArchivos = (e) => {
  Array.from(e.target.files).forEach(file => {
    const item = { archivo: file, nombre: file.name, tipo: file.type, preview: null }
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = ev => { item.preview = ev.target.result }
      reader.readAsDataURL(file)
    }
    pendientes.value.push(item)
  })
  e.target.value = ''
}

const quitarPendiente = (i) => pendientes.value.splice(i, 1)

const subirArchivo = (file) => new Promise((resolve, reject) => {
  const path = `soporte/${userId}/${Date.now()}_${file.name}`
  const ref = storageRef(storage, path)
  const tarea = uploadBytesResumable(ref, file)
  tarea.on('state_changed', null, reject, async () => {
    const url = await getDownloadURL(tarea.snapshot.ref)
    resolve({ url, nombre: file.name, tipo: file.type, path })
  })
})

const mostrarToast = (msg, color = 'danger') => {
  toastMsg.value = msg; toastColor.value = color; toastVisible.value = true
}

const enviar = async () => {
  if (enviando.value) return
  const msg = texto.value.trim()
  if (!msg && !pendientes.value.length) return
  if (!userId) return

  try {
    enviando.value = true

    const adjuntos = pendientes.value.length
      ? await Promise.all(pendientes.value.map(f => subirArchivo(f.archivo)))
      : []

    const ts = serverTimestamp()

    await setDoc(doc(db, 'soportes', userId), {
      userId,
      userName: userName.value,
      userEmail: auth.currentUser?.email || '',
      lastMessage: msg || `[${adjuntos.length} archivo(s)]`,
      lastTimestamp: ts,
      unreadAdmin: mensajes.value.filter(m => m.autorRol === 'usuario').length + 1,
      estado: 'abierto',
      ...(productoId ? { productoId, productoNombre } : {})
    }, { merge: true })

    await addDoc(collection(db, 'soportes', userId, 'mensajes'), {
      texto: msg,
      autorRol: 'usuario',
      autorId: userId,
      timestamp: ts,
      adjuntos
    })

    texto.value = ''
    pendientes.value = []
  } catch (e) {
    console.error(e)
    mostrarToast('Error al enviar el mensaje')
  } finally {
    enviando.value = false
  }
}
</script>

<style scoped>
.soporte-header { --background: #fff; border-bottom: 1px solid #eee; }
.soporte-toolbar { --background: #fff; --min-height: 64px; padding: 0 8px; }
.back-btn { --color: #111; }

.toolbar-center {
  display: flex; align-items: center; gap: 10px; flex: 1; padding: 0 4px;
}
.admin-avatar-sm {
  width: 38px; height: 38px; background: #1A1D2E;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 0.7rem; font-weight: 900; color: #F5A623; flex-shrink: 0;
}
.toolbar-title { font-size: 0.9rem; font-weight: 800; color: #111; margin: 0 0 1px; }
.toolbar-sub { font-size: 0.65rem; color: #27AE60; font-weight: 600; margin: 0; }

.soporte-content { --background: #F5F5F5; }

/* ── Contexto producto ──────────────────────────────── */
.product-context-banner {
  background: #EEF4FF; border-left: 3px solid #4A90D9;
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; font-size: 0.78rem; color: #1A5CA8;
}
.product-context-banner ion-icon { font-size: 1rem; flex-shrink: 0; }
.product-context-banner strong { font-weight: 700; }

/* ── Bienvenida ─────────────────────────────────────── */
.welcome-banner {
  background: #fff;
  display: flex; align-items: flex-start; gap: 14px;
  padding: 20px 16px; margin-bottom: 8px;
  border-bottom: 1px solid #F0F0F0;
}
.welcome-icon-wrap {
  width: 44px; height: 44px; background: #1A1D2E;
  border-radius: 12px; display: flex; align-items: center;
  justify-content: center; flex-shrink: 0;
}
.welcome-icon-wrap ion-icon { font-size: 1.3rem; color: #F5A623; }
.welcome-title { font-size: 0.9rem; font-weight: 800; color: #111; margin: 0 0 4px; }
.welcome-sub { font-size: 0.75rem; color: #888; line-height: 1.5; margin: 0; }

/* ── Mensajes ───────────────────────────────────────── */
.messages-wrap {
  padding: 12px 12px 16px;
  display: flex; flex-direction: column; gap: 10px;
  min-height: 100%;
}

.empty-chat {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 60px 20px; gap: 12px;
  text-align: center;
}
.empty-icon { font-size: 3rem; color: #ddd; }
.empty-chat p { font-size: 0.85rem; color: #bbb; margin: 0; }

.msg-row {
  display: flex; align-items: flex-end; gap: 8px;
}
.msg-row.right { justify-content: flex-end; }
.msg-row.left  { justify-content: flex-start; }

.msg-admin-avatar {
  width: 30px; height: 30px; background: #1A1D2E;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 0.55rem; font-weight: 900; color: #F5A623; flex-shrink: 0;
}

.msg-bubble {
  max-width: 75%; border-radius: 18px; padding: 10px 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
}
.bubble-user {
  background: #1A1D2E; border-bottom-right-radius: 4px;
}
.bubble-admin {
  background: #fff; border-bottom-left-radius: 4px;
}

.msg-text {
  font-size: 0.88rem; line-height: 1.5; margin: 0 0 4px; word-break: break-word;
}
.bubble-user .msg-text { color: #fff; }
.bubble-admin .msg-text { color: #111; }

.msg-time {
  font-size: 0.58rem; font-weight: 600; display: block; text-align: right;
}
.bubble-user .msg-time { color: rgba(255,255,255,0.45); }
.bubble-admin .msg-time { color: #bbb; }

/* ── Adjuntos ───────────────────────────────────────── */
.adjuntos-wrap { display: flex; flex-direction: column; gap: 6px; margin-bottom: 6px; }

.adjunto-item { cursor: pointer; }

.adjunto-img {
  width: 100%; max-width: 220px; border-radius: 10px;
  display: block; object-fit: cover;
}

.adjunto-file {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,0.12); border-radius: 10px;
  padding: 8px 12px;
}
.bubble-admin .adjunto-file { background: #F5F5F5; }
.adjunto-file ion-icon { font-size: 1.1rem; flex-shrink: 0; }
.bubble-user .adjunto-file ion-icon { color: #F5A623; }
.bubble-admin .adjunto-file ion-icon { color: #555; }
.adjunto-file span { font-size: 0.78rem; font-weight: 600; }
.bubble-user .adjunto-file span { color: rgba(255,255,255,0.85); }
.bubble-admin .adjunto-file span { color: #333; }

/* ── Input area ─────────────────────────────────────── */
.input-area {
  background: #fff;
  border-top: 1px solid #eee;
  padding: 8px 12px;
  padding-bottom: max(8px, env(safe-area-inset-bottom));
}

.pending-files {
  display: flex; gap: 8px; padding: 6px 0 10px;
  overflow-x: auto; -webkit-overflow-scrolling: touch;
}
.pending-item {
  display: flex; align-items: center; gap: 6px;
  background: #F5F5F5; border-radius: 10px;
  padding: 6px 10px; flex-shrink: 0; max-width: 160px;
}
.pending-thumb {
  width: 28px; height: 28px; border-radius: 6px; object-fit: cover; flex-shrink: 0;
}
.pending-doc-icon { font-size: 1.1rem; color: #F5A623; flex-shrink: 0; }
.pending-name {
  font-size: 0.65rem; color: #555; font-weight: 600;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;
}
.pending-remove {
  background: none; border: none; color: #bbb;
  font-size: 0.75rem; cursor: pointer; flex-shrink: 0; padding: 0 2px;
}

.input-row { display: flex; align-items: flex-end; gap: 8px; }

.attach-btn {
  width: 40px; height: 40px; background: #F5F5F5; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}
.attach-btn ion-icon { font-size: 1.2rem; color: #888; }
.attach-btn.disabled { opacity: 0.4; pointer-events: none; }

.msg-input {
  flex: 1; border: 1.5px solid #eee; border-radius: 20px;
  padding: 10px 16px; font-size: 0.88rem; color: #111;
  background: #F9F9F9; outline: none; resize: none;
  font-family: inherit; line-height: 1.4; max-height: 120px;
  transition: border-color 0.2s;
}
.msg-input:focus { border-color: #F5A623; }
.msg-input::placeholder { color: #bbb; }

.send-btn {
  width: 40px; height: 40px; background: #1A1D2E; border: none;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0; transition: background 0.2s;
}
.send-btn:disabled { background: #ddd; }
.send-btn:not(:disabled):active { background: #F5A623; }
.send-btn ion-icon { font-size: 1.1rem; color: #fff; }

.send-spinner {
  width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
