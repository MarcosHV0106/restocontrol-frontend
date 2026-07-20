<template>
  <nav class="navbar-custom" aria-label="Barra superior">
    <div class="navbar-left">
      <span class="navbar-date"><i class="bi bi-calendar3"></i>{{ fechaActual }}</span>
    </div>

    <div class="navbar-center" @click.stop>
      <label class="quick-search" for="busquedaRapida">
        <i class="bi bi-search"></i>
        <input
          id="busquedaRapida"
          v-model.trim="busquedaRapida"
          type="search"
          autocomplete="off"
          placeholder="Ir rápidamente a…"
          aria-label="Buscar una sección"
          :aria-expanded="mostrarResultados"
          aria-controls="quick-search-results"
          @focus="busquedaActiva = true"
          @keydown.enter.prevent="abrirPrimeraOpcion"
          @keydown.esc="cerrarBusqueda"
        />
        <kbd>Ctrl K</kbd>
      </label>

      <div v-if="mostrarResultados" id="quick-search-results" class="quick-results" role="listbox">
        <button
          v-for="opcion in opcionesFiltradas"
          :key="opcion.ruta"
          type="button"
          role="option"
          @click="irARuta(opcion.ruta)"
        >
          <span><i :class="opcion.icono"></i></span>
          <div><strong>{{ opcion.nombre }}</strong><small>{{ opcion.descripcion }}</small></div>
          <i class="bi bi-arrow-right"></i>
        </button>
        <div v-if="opcionesFiltradas.length === 0" class="quick-results-empty">
          <i class="bi bi-search"></i>No encontramos esa sección.
        </div>
      </div>
    </div>

    <div class="navbar-right">
      <div class="dropdown position-relative">
        <button
          type="button"
          class="navbar-user-button"
          aria-haspopup="menu"
          :aria-expanded="menuAbierto"
          @click.stop="menuAbierto = !menuAbierto"
          @keydown.esc="menuAbierto = false"
        >
          <span class="navbar-avatar">{{ iniciales }}</span>
          <span class="navbar-user-copy">
            <strong>{{ usuario?.nombre ? `Hola, ${usuario.nombre}` : 'Hola' }}</strong>
            <small>{{ nombreRol }}</small>
          </span>
          <i class="bi bi-chevron-down" :class="{ 'rotate-180': menuAbierto }"></i>
        </button>

        <ul v-show="menuAbierto" class="dropdown-menu dropdown-menu-end show navbar-account-menu" role="menu" @click.stop>
          <li class="navbar-account-summary">
            <span class="navbar-menu-avatar">{{ iniciales }}</span>
            <span><strong>{{ nombreCompleto }}</strong><small>{{ usuario?.correo || 'Cuenta de RestoControl' }}</small></span>
          </li>
          <li class="navbar-menu-separator">
            <button class="dropdown-item" role="menuitem" @click="irConfiguracion">
              <i class="bi bi-sliders2"></i>
              <span><strong>Configuración</strong><small>Seguridad y apariencia</small></span>
            </button>
          </li>
          <li>
            <button class="dropdown-item text-danger" role="menuitem" @click="cerrarSesion">
              <i class="bi bi-box-arrow-right"></i><span><strong>Cerrar sesión</strong><small>Salir de RestoControl</small></span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { normalizeRole } from '@/router/roleNavigation'
import '@/assets/css/navbar.css'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { usuario } = storeToRefs(authStore)
const menuAbierto = ref(false)
const busquedaActiva = ref(false)
const busquedaRapida = ref('')

const rolActual = computed(() => normalizeRole(usuario.value?.rol))
const nombreRol = computed(() => {
  const rol = String(usuario.value?.rol || 'Usuario').toLowerCase()
  return rol.charAt(0).toUpperCase() + rol.slice(1)
})
const nombreCompleto = computed(() => {
  const nombre = [usuario.value?.nombre, usuario.value?.apellido].filter(Boolean).join(' ').trim()
  return nombre || 'Usuario'
})
const iniciales = computed(() => nombreCompleto.value.split(/\s+/).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase())
const fechaActual = computed(() => new Date().toLocaleDateString('es-PE', {
  weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
}))

const navegacion = [
  { nombre: 'Dashboard', descripcion: 'Resumen ejecutivo', ruta: '/dashboard', icono: 'bi bi-grid-1x2', roles: ['ADMIN', 'GERENTE'] },
  { nombre: 'Estimación diaria', descripcion: 'Demanda prevista y faltantes', ruta: '/menu?tab=estimacion', icono: 'bi bi-calendar2-check', roles: ['ADMIN', 'ALMACENERO'] },
  { nombre: 'Menú y categorías', descripcion: 'Platos, recetas y categorías', ruta: '/menu', icono: 'bi bi-tags', roles: ['ADMIN'] },
  { nombre: 'Inventario', descripcion: 'Insumos y lotes', ruta: '/inventario', icono: 'bi bi-box-seam', roles: ['ADMIN', 'ALMACENERO'] },
  { nombre: 'Movimientos de inventario', descripcion: 'Entradas, mermas y consumos', ruta: '/movimientos-inventario', icono: 'bi bi-arrow-left-right', roles: ['ADMIN', 'ALMACENERO'] },
  { nombre: 'Abastecimiento', descripcion: 'Proveedores, compras y lotes', ruta: '/abastecimiento', icono: 'bi bi-truck', roles: ['ADMIN', 'ALMACENERO'] },
  { nombre: 'Alertas de inventario', descripcion: 'Stock y vencimientos', ruta: '/alertas-inventario', icono: 'bi bi-bell', roles: ['ADMIN', 'ALMACENERO'] },
  { nombre: 'Gestión de mesas', descripcion: 'Disponibilidad y atención', ruta: '/mesas', icono: 'bi bi-grid-3x3-gap', roles: ['ADMIN', 'MESERO', 'CAJERO'] },
  { nombre: 'Pedidos', descripcion: 'Órdenes del restaurante', ruta: '/pedidos', icono: 'bi bi-receipt', roles: ['ADMIN', 'MESERO', 'CAJERO'] },
  { nombre: 'Caja', descripcion: 'Cobros y comprobantes', ruta: '/caja', icono: 'bi bi-wallet2', roles: ['ADMIN', 'CAJERO'] },
  { nombre: 'Cocina', descripcion: 'Flujo de preparación', ruta: '/cocina', icono: 'bi bi-fire', roles: ['COCINERO'] },
  { nombre: 'Usuarios y roles', descripcion: 'Personal y permisos', ruta: '/usuarios', icono: 'bi bi-people', roles: ['ADMIN'] },
  { nombre: 'Reportes', descripcion: 'Indicadores operativos', ruta: '/reportes', icono: 'bi bi-bar-chart-line', roles: ['ADMIN', 'GERENTE'] },
  { nombre: 'Auditoría', descripcion: 'Historial de operaciones por usuario', ruta: '/auditoria', icono: 'bi bi-shield-check', roles: ['ADMIN', 'GERENTE'] },
  { nombre: 'Configuración', descripcion: 'Seguridad y apariencia', ruta: '/configuracion', icono: 'bi bi-sliders2', roles: ['ADMIN', 'GERENTE', 'MESERO', 'CAJERO', 'COCINERO', 'ALMACENERO'] },
]

const opcionesPermitidas = computed(() => navegacion.filter((opcion) => opcion.roles.includes(rolActual.value)))
const opcionesFiltradas = computed(() => {
  const termino = busquedaRapida.value.toLocaleLowerCase('es')
  if (!termino) return opcionesPermitidas.value.slice(0, 5)
  return opcionesPermitidas.value.filter((opcion) => `${opcion.nombre} ${opcion.descripcion}`.toLocaleLowerCase('es').includes(termino)).slice(0, 6)
})
const mostrarResultados = computed(() => busquedaActiva.value && Boolean(busquedaRapida.value))

function cerrarMenus() {
  menuAbierto.value = false
  busquedaActiva.value = false
}
function cerrarBusqueda() {
  busquedaActiva.value = false
  busquedaRapida.value = ''
}
function irARuta(ruta) {
  cerrarBusqueda()
  if (route.path !== ruta) router.push(ruta)
}
function abrirPrimeraOpcion() {
  if (opcionesFiltradas.value[0]) irARuta(opcionesFiltradas.value[0].ruta)
}
function manejarAtajo(evento) {
  if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'k') {
    evento.preventDefault()
    document.getElementById('busquedaRapida')?.focus()
  }
}
function cerrarSesion() {
  authStore.logout()
  router.push('/login')
}
function irConfiguracion() {
  menuAbierto.value = false
  router.push('/configuracion')
}

onMounted(() => {
  document.addEventListener('click', cerrarMenus)
  document.addEventListener('keydown', manejarAtajo)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', cerrarMenus)
  document.removeEventListener('keydown', manejarAtajo)
})
watch(() => route.fullPath, cerrarMenus)
</script>
