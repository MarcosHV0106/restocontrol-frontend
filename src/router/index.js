import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import MenuView from '@/views/MenuView.vue'
import UsuarioView from '@/views/UsuarioView.vue'

const routes = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        name: 'login',
        component: LoginView,
        // Etiqueta para vistas donde solo entran usuarios NO logueados
        meta: { requiresGuest: true }
    },
    {
        path: '/dashboard',
        name: 'dashboard',
        component: DashboardView,
        meta: { requiresAuth: true } // <-- Ruta protegida
    },
    {
        path: '/menu',
        name: 'menu',
        component: MenuView,
        meta: { requiresAuth: true } // <-- Ruta protegida
    },
    {
        path: '/usuarios',
        name: 'usuarios',
        component: UsuarioView,
        meta: { requiresAuth: true } // <-- Ruta protegida
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// --- NAVIGATION GUARD ---
router.beforeEach((to, from, next) => {
    // 1. Verificamos las etiquetas de las rutas
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    const requiresGuest = to.matched.some(record => record.meta.requiresGuest)

    // 2. Leemos el token de localStorage (exactamente donde lo guardaste en LoginView)
    const token = localStorage.getItem('token')

    if (requiresAuth && !token) {
        // Si la ruta es privada y no hay token, lo regresamos al login
        next('/login')
    } else if (requiresGuest && token) {
        // Si quiere ir al login pero ya tiene token, lo enviamos al dashboard
        next('/dashboard')
    } else {
        // En cualquier otro caso, dejamos que pase con normalidad
        next()
    }
})

export default router
