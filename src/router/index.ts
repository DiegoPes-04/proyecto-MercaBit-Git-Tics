import { createRouter, createWebHistory } from '@ionic/vue-router';
import { auth } from '@/firebase/FirebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const routes = [
  { path: '', redirect: '/login' },
  { path: '/login', component: () => import('@/views/Login.vue') },
  { path: '/registro', component: () => import('@/views/Registro.vue') },
  { path: '/recuperar-contrasena', component: () => import('@/views/RecuperarContraseña.vue') },
  {
    path: '/add-calification/:compraId',
    name: 'AddCalification',
    component: () => import('@/views/AddCalification.vue'),
    props: true,
    meta: { requiresAuth: true, hideLayout: true }
  },

  // ── Admin ─────────────────────────────────────────────
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', name: 'AdminDashboard', component: () => import('@/views/admin/AdminDashboard.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
      { path: 'usuarios', name: 'AdminUsuarios', component: () => import('@/views/admin/AdminUsuarios.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
      { path: 'subastas', name: 'AdminSubastas', component: () => import('@/views/admin/AdminSubastas.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
      { path: 'transacciones', name: 'AdminTransacciones', component: () => import('@/views/admin/AdminTransacciones.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
      { path: 'reportes', name: 'AdminReportes', component: () => import('@/views/admin/AdminReportes.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
      { path: 'categorias', name: 'AdminCategorias', component: () => import('@/views/admin/AdminCategorias.vue'), meta: { requiresAuth: true, requiresAdmin: true } },
    ]
  },

  // ── App ───────────────────────────────────────────────
  {
    path: '',
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      { path: 'home', component: () => import('@/views/HomePage.vue'), meta: { requiresAuth: true, hideLayout: true } },
      { path: 'agregar-producto', component: () => import('@/views/AgregarProductoPage.vue'), meta: { requiresAuth: true, hideLayout: true } },
      { path: 'mis-publicaciones', component: () => import('@/views/MisPublicaciones.vue'), meta: { requiresAuth: true, hideLayout: true } },
      { path: '/Notification', name: 'Notification', component: () => import('@/views/Notification.vue'), meta: { requiresAuth: true, hideLayout: true } },
      { path: '/accerca-de-la-app', component: () => import('@/views/AcercaDeLaApp.vue'), meta: { requiresAuth: true, hideLayout: true } },
      { path: '/terminos-condiciones', component: () => import('@/views/Terminos-condiciones.vue'), meta: { hideLayout: true } },
      { path: 'producto/:id', name: 'DetalleProducto', component: () => import('@/views/DetalleProducto.vue'), meta: { requiresAuth: true, hideLayout: true } },
      { path: '/oferta-exitosa', component: () => import('@/views/OfertaExitosa.vue'), meta: { requiresAuth: true, hideLayout: true } },
      { path: '/mi-cuenta', component: () => import('@/views/MiCuenta.vue'), meta: { requiresAuth: true, hideLayout: true } },
      { path: '/MisCalificaciones', name: 'MisCalificaciones', component: () => import('@/views/MisCalificaciones.vue'), meta: { requiresAuth: true, hideLayout: true } },
      { path: '/Miscompras', name: 'MisCompras', component: () => import('@/views/MisCompras.vue'), meta: { requiresAuth: true, hideLayout: true } },
      { path: '/ofertas-realizadas', name: 'MisOfertas', component: () => import('@/views/OfertasRealizadas.vue'), meta: { requiresAuth: true, hideLayout: true } },
      { path: '/categorias', component: () => import('@/views/Categorias.vue'), meta: { requiresAuth: true, hideLayout: true } },
      { path: '/categoria/:categoriaId', name: 'ProductosPorCategoria', component: () => import('@/views/ProductosPorCategoria.vue'), meta: { requiresAuth: true, hideLayout: true } },
      { path: '/explorar', component: () => import('@/views/ExplorarPage.vue'), meta: { requiresAuth: true, hideLayout: true } },
      { path: '/perfil/:userId', name: 'PerfilVendedor', component: () => import('@/views/PerfilVendedor.vue'), meta: { requiresAuth: true, hideLayout: true } },
    ]
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// ── Guard ─────────────────────────────────────────────
router.beforeEach(async (to, from, next) => {
  // Obtener usuario autenticado
  const user = await new Promise<any>((resolve) => {
    const unsub = onAuthStateChanged(auth, (u) => { unsub(); resolve(u); })
  })

  // Ruta pública
  if (!to.meta.requiresAuth) return next()

  // No autenticado → login
  if (!user) return next('/login')

  // Leer rol del localStorage (guardado al hacer login)
  const rol = localStorage.getItem('userRol') || 'usuario'

  // Ruta de admin → verificar rol
  if (to.meta.requiresAdmin && rol !== 'admin') return next('/home')

  next()
})

export default router;