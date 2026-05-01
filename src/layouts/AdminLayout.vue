<template>
  <div class="admin-layout">
      <!-- Sidebar admin -->
      <div class="admin-sidebar" :class="{ open: sidebarOpen }">
        <div class="sidebar-header">
          <div class="brand-row">
            <div class="brand-icon">
              <svg width="20" height="20" viewBox="0 0 36 36" fill="none">
                <rect x="4" y="4" width="11" height="11" rx="2" fill="#F5A623"/>
                <rect x="21" y="4" width="11" height="11" rx="2" fill="#F5A623"/>
                <rect x="4" y="21" width="11" height="11" rx="2" fill="#F5A623"/>
                <rect x="21" y="21" width="11" height="11" rx="2" fill="#F5A623"/>
              </svg>
            </div>
            <div>
              <span class="brand-name">MercaBit</span>
              <span class="brand-badge">ADMIN</span>
            </div>
          </div>
          <button class="close-sidebar" @click="sidebarOpen = false">✕</button>
        </div>

        <nav class="sidebar-nav">
          <div
            v-for="item in navItems"
            :key="item.path"
            class="nav-item"
            :class="{ active: currentPath === item.path }"
            @click="navegar(item.path)"
          >
            <ion-icon :icon="item.icon" class="nav-icon" />
            <span>{{ item.label }}</span>
          </div>
        </nav>

        <div class="sidebar-footer">
          <div class="admin-user">
            <div class="admin-avatar">AD</div>
            <div>
              <p class="admin-name">Administrador</p>
              <p class="admin-role">Super Admin</p>
            </div>
          </div>
          <button class="logout-btn" @click="cerrarSesion">
            <ion-icon :icon="logOutOutline" />
          </button>
        </div>
      </div>

      <!-- Overlay -->
      <div class="sidebar-overlay" v-if="sidebarOpen" @click="sidebarOpen = false" />

      <!-- Main content -->
      <div class="admin-main">
        <!-- Top bar -->
        <div class="admin-topbar">
          <button class="menu-toggle" @click="sidebarOpen = true">
            <ion-icon :icon="menuOutline" />
          </button>
          <h1 class="topbar-title">{{ paginaActual }}</h1>
          <div class="topbar-right">
            <button class="topbar-btn" @click="cerrarSesion">
              <ion-icon :icon="logOutOutline" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>

        <!-- Router outlet -->
        <div class="admin-content">
          <RouterView />
        </div>
      </div>
  </div>
</template>

<script setup>
import { IonApp, IonPage, IonIcon } from '@ionic/vue'
import { RouterView } from 'vue-router'
import {
  gridOutline, peopleOutline, hammerOutline, cardOutline,
  flagOutline, folderOutline, menuOutline, logOutOutline, exitOutline
} from 'ionicons/icons'
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { logoutUser } from '@/services/authService'

const router = useRouter()
const route = useRoute()
const sidebarOpen = ref(false)

const navItems = [
  { path: '/admin/dashboard',     label: 'Dashboard',      icon: gridOutline },
  { path: '/admin/usuarios',      label: 'Usuarios',       icon: peopleOutline },
  { path: '/admin/subastas',      label: 'Subastas',       icon: hammerOutline },
  { path: '/admin/transacciones', label: 'Transacciones',  icon: cardOutline },
  { path: '/admin/reportes',      label: 'Reportes',       icon: flagOutline },
  { path: '/admin/categorias',    label: 'Categorías',     icon: folderOutline },
]

const currentPath = computed(() => route.path)

const paginaActual = computed(() => {
  const item = navItems.find(n => route.path.startsWith(n.path))
  return item?.label || 'Admin'
})

const navegar = (path) => {
  sidebarOpen.value = false
  router.push(path)
}

const cerrarSesion = async () => {
  await logoutUser()
  window.location.href = '/login'
}
</script>

<style scoped>
.admin-layout { 
  height: 100vh; 
  overflow: hidden;
  display: flex; 
  flex-direction: column; 
}

.admin-sidebar {
  position: fixed; left: -280px; top: 0; bottom: 0;
  width: 260px; background: #1A1D2E;
  z-index: 1000; transition: left 0.3s ease;
  display: flex; flex-direction: column;
}
.admin-sidebar.open { left: 0; }

.sidebar-header {
  padding: 24px 16px 20px;
  display: flex; align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.brand-row { display: flex; align-items: center; gap: 10px; }
.brand-icon { width: 36px; height: 36px; background: #111; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.brand-name { display: block; font-size: 1rem; font-weight: 900; color: #fff; }
.brand-badge { display: block; font-size: 0.55rem; font-weight: 800; color: #F5A623; letter-spacing: 0.1em; }
.close-sidebar { background: none; border: none; color: #666; font-size: 1rem; cursor: pointer; padding: 4px; }

.sidebar-nav { flex: 1; padding: 12px 10px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }

.nav-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; border-radius: 12px;
  cursor: pointer; color: #888; font-size: 0.88rem;
  font-weight: 600; transition: all 0.15s;
}
.nav-item:hover { background: rgba(255,255,255,0.05); color: #fff; }
.nav-item.active { background: rgba(245,166,35,0.15); color: #F5A623; }
.nav-icon { font-size: 1.1rem; flex-shrink: 0; }

.sidebar-footer {
  padding: 16px; border-top: 1px solid rgba(255,255,255,0.08);
  display: flex; align-items: center; gap: 10px;
}
.admin-user { flex: 1; display: flex; align-items: center; gap: 10px; }
.admin-avatar { width: 36px; height: 36px; background: #F5A623; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; color: #000; flex-shrink: 0; }
.admin-name { font-size: 0.82rem; font-weight: 700; color: #fff; margin: 0 0 1px; }
.admin-role { font-size: 0.62rem; color: #666; margin: 0; }
.logout-btn { background: rgba(255,255,255,0.06); border: none; border-radius: 8px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; color: #888; cursor: pointer; font-size: 1rem; }

.sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999; }

/* Main */
.admin-main { 
  height: 100vh; 
  display: flex; 
  flex-direction: column; 
  background: #F5F5F5;
  overflow: hidden;
}

.admin-content { 
  flex: 1; 
  padding: 20px 16px; 
  overflow-y: auto; 
  background: #F5F5F5;
}

.admin-topbar {
  height: 60px; background: #fff;
  border-bottom: 1px solid #eee;
  display: flex; align-items: center;
  padding: 0 16px; gap: 14px;
  position: sticky; top: 0; z-index: 100;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.menu-toggle { background: none; border: none; font-size: 1.4rem; color: #111; cursor: pointer; padding: 4px; display: flex; align-items: center; }
.topbar-title { font-size: 1rem; font-weight: 800; color: #111; flex: 1; margin: 0; }
.topbar-right { display: flex; align-items: center; gap: 8px; }
.topbar-btn { display: flex; align-items: center; gap: 5px; background: #F5F5F5; border: none; border-radius: 8px; padding: 7px 12px; font-size: 0.75rem; font-weight: 700; color: #555; cursor: pointer; }
.topbar-btn ion-icon { font-size: 1rem; }

.admin-content { flex: 1; padding: 20px 16px; overflow-y: auto; height: calc(100vh - 60px); background: #F5F5F5; }
</style>