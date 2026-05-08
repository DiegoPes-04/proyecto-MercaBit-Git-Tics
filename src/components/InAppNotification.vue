<template>
  <transition name="notif-slide">
    <div
      v-if="state.visible"
      class="in-app-notif"
      @click="handleTap"
      role="alert"
    >
      <!-- Ícono MercaBit -->
      <div class="notif-icon">
        <svg width="18" height="18" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="11" height="11" rx="2" fill="#F5A623"/>
          <rect x="21" y="4" width="11" height="11" rx="2" fill="#F5A623"/>
          <rect x="4" y="21" width="11" height="11" rx="2" fill="#F5A623"/>
          <rect x="21" y="21" width="11" height="11" rx="2" fill="#F5A623"/>
        </svg>
      </div>

      <!-- Contenido -->
      <div class="notif-body">
        <div class="notif-header-row">
          <span class="notif-app-name">MERCABIT</span>
          <span class="notif-time">ahora</span>
        </div>
        <p class="notif-title">{{ state.title }}</p>
        <p class="notif-message">{{ state.body }}</p>
      </div>

      <!-- Botón cerrar -->
      <button class="notif-close" @click.stop="dismiss" aria-label="Cerrar">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="#aaa" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </button>

      <!-- Barra de progreso -->
      <div class="notif-progress-track">
        <div class="notif-progress-bar" :key="animKey" />
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { state, dismissNotification } from '@/composables/useInAppNotification'

const router = useRouter()
const animKey = ref(0)
let timer: ReturnType<typeof setTimeout> | null = null

watch(
  () => state.visible,
  (visible) => {
    if (!visible) return
    if (timer) clearTimeout(timer)
    animKey.value++
    timer = setTimeout(() => {
      dismissNotification()
    }, 6000)
  }
)

const dismiss = () => {
  if (timer) { clearTimeout(timer); timer = null }
  dismissNotification()
}

const handleTap = () => {
  dismiss()
  router.push('/Notification')
}
</script>

<style scoped>
.in-app-notif {
  position: fixed;
  top: max(env(safe-area-inset-top, 0px), 12px);
  left: 12px;
  right: 12px;
  z-index: 99999;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 13px 14px 0;
  cursor: pointer;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
}

.in-app-notif:active {
  opacity: 0.92;
}

/* Ícono */
.notif-icon {
  width: 40px;
  height: 40px;
  background: #1A1D2E;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-bottom: 13px;
}

/* Contenido central */
.notif-body {
  flex: 1;
  min-width: 0;
  padding-bottom: 13px;
}

.notif-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 3px;
}

.notif-app-name {
  font-size: 0.58rem;
  font-weight: 800;
  color: #F5A623;
  letter-spacing: 0.1em;
}

.notif-time {
  font-size: 0.58rem;
  color: #bbb;
  font-weight: 500;
}

.notif-title {
  font-size: 0.88rem;
  font-weight: 800;
  color: #111;
  margin: 0 0 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notif-message {
  font-size: 0.75rem;
  color: #777;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Botón cerrar */
.notif-close {
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

/* Barra de progreso */
.notif-progress-track {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #F5F5F5;
}

.notif-progress-bar {
  height: 100%;
  width: 100%;
  background: #F5A623;
  transform-origin: left center;
  animation: drain 6s linear forwards;
}

@keyframes drain {
  from { width: 100%; }
  to   { width: 0%; }
}

/* Transición entrada/salida */
.notif-slide-enter-active {
  animation: slideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.notif-slide-leave-active {
  animation: slideUp 0.25s ease-in forwards;
}

@keyframes slideDown {
  from { transform: translateY(-110%); opacity: 0; }
  to   { transform: translateY(0);     opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(0);     opacity: 1; }
  to   { transform: translateY(-110%); opacity: 0; }
}
</style>
