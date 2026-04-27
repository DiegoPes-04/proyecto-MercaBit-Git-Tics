import { createRouter, createWebHistory } from '@ionic/vue-router';
import { auth } from '@/firebase/FirebaseConfig'; // 🔹 Importamos `auth`
import { onAuthStateChanged } from 'firebase/auth';

const routes = [
  {
    path: '',
    redirect: '/login'
  },
  {
    path: '/login',
    component: () => import('@/views/Login.vue'),
  },
  {
    path: '/registro',
    component: () => import('@/views/Registro.vue'),
  },
  {
    path: '/recuperar-contrasena',
    component: () => import('@/views/RecuperarContraseña.vue'),
  },
  {
  path: '/add-calification/:compraId', // Uso de un parámetro dinámico
  name: 'calificacion',
  component: () => import('@/views/AddCalification.vue'),
  props: true // Permite que el parámetro sea pasado como prop al componente
  },

  {
    path: '',
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      {
        path: 'home',
        component: () => import('@/views/HomePage.vue'),
        meta:
        { requiresAuth: true,
          hideLayout: true
        },
      },
      {
        path: 'agregar-producto',
        component: () => import('@/views/AgregarProductoPage.vue'),
        meta:
        {
          requiresAuth: true,
          hideLayout: true
        }
      },
      {
        path: 'mis-publicaciones',
        component: () => import('@/views/MisPublicaciones.vue'),
        meta:
        {
          requiresAuth: true,
          hideLayout: true
        }
      },
      {
        path: '/notification',
        name: 'Notification',
        component: () => import('@/views/Notification.vue'),
        meta: { requiresAuth: true, hideLayout: true }
      },
      {
        path: '/accerca-de-la-app',
        component: () => import('@/views/AcercaDeLaApp.vue'),
        meta: { requiresAuth: true, hideLayout: true  },
      },
      {
        path: '/terminos-condiciones',
        component: () => import('@/views/Terminos-condiciones.vue'),  
        meta: { hideLayout: true }
      },
      {
        path: 'producto/:id',
        name: 'DetalleProducto',
        component: () => import('@/views/DetalleProducto.vue'),
        meta: { requiresAuth: true, hideLayout: true  }
      },
      {
        path: '/oferta-exitosa',
        component: () => import('@/views/OfertaExitosa.vue'),
        meta: { requiresAuth: true, hideLayout: true }
      },
      {
        path: '/mi-cuenta',
        component: () => import('@/views/MiCuenta.vue'),
        meta: { requiresAuth: true, hideLayout: true },
      },
      {
      
  path: '/MisCalificaciones', //
  name: 'calificacion',
  component: () => import('@/views/MisCalificaciones.vue'),
      },{

        path: '/Miscompras',
        name: 'MisCompras',
        component: () => import('@/views/MisCompras.vue'),
        meta: { requiresAuth: true,  }
      },
      {
        path: '/ofertas-realizadas',
        name: 'MisOfertas',
        component: () => import('@/views/OfertasRealizadas.vue'),
        meta: { requiresAuth: true, hideLayout: true }
      },
      {
        path: '/categorias',
        component: () => import('@/views/Categorias.vue'),
        meta: { requiresAuth: true, hideLayout: true  },
      },
      {
        path: '/categoria/:categoriaId',
        name: 'ProductosPorCategoria',
        component: () => import('@/views/ProductosPorCategoria.vue'),
        meta: { requiresAuth: true, hideLayout: true },

      },
      {
        path: '/explorar', 
        component: () => import('@/views/ExplorarPage.vue'),
        meta: { requiresAuth: true, hideLayout: true } 
      }
      
       
      
      
    ]
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// **Navigation Guard para verificar autenticación**
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    try {
      const user = await new Promise((resolve, reject) => {
        onAuthStateChanged(auth, (user) => {
          if (user) {
            resolve(user);  // El usuario está autenticado
          } else {
            reject('No autenticado'); // No está autenticado
          }
        });
      });
      next(); // Si el usuario está autenticado, continua la navegación
    } catch (error) {
      next('/login'); // Si no está autenticado, redirige a login
    }
  } else {
    next(); // Si la ruta no necesita autenticación, continuar
  }
});

export default router;
