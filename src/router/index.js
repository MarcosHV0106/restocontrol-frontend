import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { getHomeRouteForRole, normalizeRole } from '@/router/roleNavigation'

const LoginView = () => import('@/views/LoginView.vue')
const ActivarCuentaView = () => import('@/views/ActivarCuentaView.vue')
const DashboardView = () => import('@/views/DashboardView.vue')
const MenuView = () => import('@/views/MenuView.vue')
const UsuarioView = () => import('@/views/UsuarioView.vue')
const MesaView = () => import('@/views/MesaView.vue')
const PedidoView = () => import('@/views/PedidoView.vue')
const NuevoPedidoView = () => import('@/views/NuevoPedidoView.vue')
const ConfiguracionView = () => import('@/views/ConfiguracionView.vue')
const ReporteView = () => import('@/views/ReporteView.vue')
const CajaView = () => import('@/views/CajaView.vue')
const CocinaView = () => import('@/views/CocinaView.vue')
const InventarioView = () => import('@/views/InventarioView.vue')
const AlertasInventarioView = () => import('@/views/AlertasInventarioView.vue')
const MovimientosInventarioView = () => import('@/views/MovimientosInventarioView.vue')
const AbastecimientoView = () => import('@/views/AbastecimientoView.vue')
const AuditoriaView = () => import('@/views/AuditoriaView.vue')

const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'login', component: LoginView, meta: { requiresGuest: true } },
    { path: '/activar-cuenta', redirect: '/login' },
    { path: '/activar-cuenta/:token', name: 'activar-cuenta', component: ActivarCuentaView },

    // Vistas ejecutivas de solo consulta para administracion y gerencia
    { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true, roles: ['ADMIN', 'GERENTE'] } },
    { path: '/menu', name: 'menu', component: MenuView, meta: { requiresAuth: true, roles: ['ADMIN', 'ALMACENERO'] } },
    { path: '/inventario', name: 'inventario', component: InventarioView, meta: { requiresAuth: true, roles: ['ADMIN', 'ALMACENERO'] } },
    { path: '/movimientos-inventario', name: 'movimientos-inventario', component: MovimientosInventarioView, meta: { requiresAuth: true, roles: ['ADMIN', 'ALMACENERO'] } },
    { path: '/abastecimiento', name: 'abastecimiento', component: AbastecimientoView, meta: { requiresAuth: true, roles: ['ADMIN', 'ALMACENERO'] } },
    { path: '/alertas-inventario', name: 'alertas-inventario', component: AlertasInventarioView, meta: { requiresAuth: true, roles: ['ADMIN', 'ALMACENERO'] } },
    { path: '/usuarios', name: 'usuarios', component: UsuarioView, meta: { requiresAuth: true, roles: ['ADMIN'] } },
    { path: '/reportes', name: 'reportes', component: ReporteView, meta: { requiresAuth: true, roles: ['ADMIN', 'GERENTE'] } },
    { path: '/auditoria', name: 'auditoria', component: AuditoriaView, meta: { requiresAuth: true, roles: ['ADMIN', 'GERENTE'] } },

    // Ruta exclusiva para el personal de cocina
    { path: '/cocina', name: 'cocina', component: CocinaView, meta: { requiresAuth: true, roles: ['COCINERO'] } },

    // Rutas operativas compartidas por salon y caja
    { path: '/mesas', name: 'mesas', component: MesaView, meta: { requiresAuth: true, roles: ['ADMIN', 'MESERO', 'CAJERO'] } },
    { path: '/pedidos', name: 'pedidos', component: PedidoView, meta: { requiresAuth: true, roles: ['ADMIN', 'MESERO', 'CAJERO'] } },
    { path: '/nuevo-pedido', name: 'nuevo-pedido', component: NuevoPedidoView, meta: { requiresAuth: true, roles: ['ADMIN', 'MESERO', 'CAJERO'] } },
    { path: '/caja', name: 'caja', component: CajaView, meta: { requiresAuth: true, roles: ['ADMIN', 'CAJERO'] } },
    { path: '/configuracion', name: 'configuracion', component: ConfiguracionView, meta: { requiresAuth: true } }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior: () => ({ top: 0 })
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
        return getHomeRouteForRole(authStore.usuario?.rol)
    }

    // 3. VERIFICACIÓN DE ROLES (RBAC)
    if (requiresAuth && isAuthenticated && allowedRoles) {
        const userRole = normalizeRole(authStore.usuario?.rol)

        // Si el rol del usuario NO está en la lista de roles permitidos de la ruta
        if (!allowedRoles.includes(userRole)) {

            // Enviamos una alerta al usuario (opcional, o podrías usar un toast/sweetalert)
            alert('Acceso denegado: No tienes permisos para ver esta sección.')

            // Lo devolvemos a la ruta segura definida para su rol.
            return getHomeRouteForRole(userRole)
        }
    }

    // Si pasa todas las validaciones, permitimos que la navegación continúe
    return true
})

export default router
