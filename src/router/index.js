import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

import LoginView from '@/views/LoginView.vue'
import ActivarCuentaView from '@/views/ActivarCuentaView.vue'
import DashboardView from '@/views/DashboardView.vue'
import MenuView from '@/views/MenuView.vue'
import UsuarioView from '@/views/UsuarioView.vue'
import MesaView from '@/views/MesaView.vue'
import PedidoView from '@/views/PedidoView.vue'
import NuevoPedidoView from '@/views/NuevoPedidoView.vue'

const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'login', component: LoginView, meta: { requiresGuest: true } },
    { path: '/activar-cuenta', redirect: '/login' },
    { path: '/activar-cuenta/:token', name: 'activar-cuenta', component: ActivarCuentaView },

    // Rutas exclusivas para ADMIN
    { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true, roles: ['ADMIN'] } },
    { path: '/menu', name: 'menu', component: MenuView, meta: { requiresAuth: true, roles: ['ADMIN'] } },
    { path: '/usuarios', name: 'usuarios', component: UsuarioView, meta: { requiresAuth: true, roles: ['ADMIN'] } },

    // Rutas compartidas (ADMIN y MESERO pueden entrar)
    { path: '/mesas', name: 'mesas', component: MesaView, meta: { requiresAuth: true, roles: ['ADMIN', 'MESERO'] } },
    { path: '/pedidos', name: 'pedidos', component: PedidoView, meta: { requiresAuth: true, roles: ['ADMIN', 'MESERO'] } },
    { path: '/nuevo-pedido', name: 'nuevo-pedido', component: NuevoPedidoView, meta: { requiresAuth: true, roles: ['ADMIN', 'MESERO'] } }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// --- NAVIGATION GUARD CON PINIA ---
router.beforeEach((to) => {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    const requiresGuest = to.matched.some(record => record.meta.requiresGuest)

    // Obtenemos los roles permitidos para la ruta a la que intenta ir
    const allowedRoles = to.meta.roles

    const authStore = useAuthStore()
    const isAuthenticated = authStore.isAuthenticated

    // 1. Si no está logueado y la ruta requiere Auth -> Al login
    if (requiresAuth && !isAuthenticated) {
        return '/login'
    }

    // 2. Si ya está logueado e intenta ir al login -> A su página principal
    if (requiresGuest && isAuthenticated) {
        const userRole = authStore.usuario?.rol?.toUpperCase()
        return userRole === 'ADMIN' ? '/dashboard' : '/mesas'
    }

    // 3. VERIFICACIÓN DE ROLES (RBAC)
    if (requiresAuth && isAuthenticated && allowedRoles) {
        const userRole = authStore.usuario?.rol?.toUpperCase()

        // Si el rol del usuario NO está en la lista de roles permitidos de la ruta
        if (!allowedRoles.includes(userRole)) {

            // Enviamos una alerta al usuario (opcional, o podrías usar un toast/sweetalert)
            alert('Acceso denegado: No tienes permisos para ver esta sección.')

            // Lo devolvemos a una ruta segura dependiendo de su rol
            if (userRole === 'MESERO') {
                return '/mesas'
            } else {
                return '/dashboard'
            }
        }
    }

    // Si pasa todas las validaciones, permitimos que la navegación continúe
    return true
})

export default router
