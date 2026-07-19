<template>
  <div class="layout">
    <SidebarComponent />
    <div class="main-content">
      <NavbarComponent />

      <main class="pedidos-page orders-page">
        <header class="orders-heading">
          <div class="orders-title-group">
            <span class="orders-title-icon"><i class="bi bi-receipt"></i></span>
            <div>
              <h1>Gestión de pedidos</h1>
              <p>
                {{ puedeVerTodos
                  ? 'Coordina los pedidos de salón, para llevar y delivery desde un único flujo.'
                  : 'Administra tus comandas y coordina su avance con Cocina y Caja.' }}
              </p>
            </div>
          </div>
          <div class="orders-heading-actions">
            <button class="orders-refresh" :disabled="cargando" @click="cargarPedidos">
              <span v-if="cargando" class="spinner-border spinner-border-sm"></span>
              <i v-else class="bi bi-arrow-clockwise"></i>
              Actualizar
            </button>
            <button class="orders-new" @click="nuevoPedido">
              <i class="bi bi-plus-lg"></i>
              Nuevo pedido
            </button>
          </div>
        </header>

        <section class="orders-summary" aria-label="Resumen de pedidos">
          <article><i class="bi bi-pencil-square"></i><div><span>Borradores</span><strong>{{ resumen.borradores }}</strong></div></article>
          <article><i class="bi bi-fire"></i><div><span>En Cocina</span><strong>{{ resumen.cocina }}</strong></div></article>
          <article><i class="bi bi-wallet2"></i><div><span>Por cobrar</span><strong>{{ resumen.cuenta }}</strong></div></article>
          <article><i class="bi bi-shield-check"></i><div><span>Cerrados</span><strong>{{ resumen.cerrados }}</strong></div></article>
        </section>

        <div v-if="mensajeExito" class="alert alert-success d-flex align-items-center gap-2" role="status">
          <i class="bi bi-check-circle-fill"></i><span>{{ mensajeExito }}</span>
        </div>
        <div v-if="errorCarga" class="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <i class="bi bi-exclamation-triangle-fill"></i><span>{{ errorCarga }}</span>
        </div>

        <section class="pedidos-card">
          <div class="orders-filters">
            <div class="filter-search">
              <label for="buscarPedido">Buscar pedido</label>
              <div class="input-with-icon">
                <i class="bi bi-search"></i>
                <input id="buscarPedido" v-model.trim="busqueda" type="search" placeholder="Pedido, cliente, mesa o responsable" />
              </div>
            </div>
            <div>
              <label for="estadoPedido">Etapa</label>
              <select id="estadoPedido" v-model="filtroEstado">
                <option value="TODOS">Todas las etapas</option>
                <option v-for="estado in estadosDisponibles" :key="estado" :value="estado">{{ etiquetaEtapa(estado) }}</option>
              </select>
            </div>
          </div>

          <div class="table-responsive">
            <table class="orders-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Fecha</th>
                  <th>Atención</th>
                  <th v-if="puedeVerTodos">Responsable</th>
                  <th>Total</th>
                  <th>Etapa</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="cargando">
                  <td :colspan="puedeVerTodos ? 7 : 6" class="empty-row">
                    <span class="spinner-border spinner-border-sm"></span> Cargando pedidos…
                  </td>
                </tr>
                <tr v-else-if="pedidosFiltrados.length === 0">
                  <td :colspan="puedeVerTodos ? 7 : 6" class="empty-row">
                    <i class="bi bi-receipt"></i><strong>No hay pedidos que coincidan</strong><span>Prueba otro filtro o registra una nueva orden.</span>
                  </td>
                </tr>
                <tr v-for="pedido in pedidosFiltrados" v-else :key="pedido.idPedido">
                  <td data-label="Pedido"><strong>#{{ pedido.idPedido }}</strong></td>
                  <td data-label="Fecha" class="text-nowrap">{{ formatearFecha(pedido.fechaPedido) }}</td>
                  <td data-label="Atención">
                    <div class="service-cell">
                      <span class="service-icon"><i :class="iconoModalidad(pedido)"></i></span>
                      <div><strong>{{ ubicacionPedido(pedido) }}</strong><small>{{ pedido.modalidadPedido?.nombreModalidad || 'Sin modalidad' }}</small></div>
                    </div>
                  </td>
                  <td v-if="puedeVerTodos" data-label="Responsable">
                    <strong>{{ nombreCreador(pedido) }}</strong>
                    <small class="responsible-role">{{ pedido.usuario?.rol?.nombreRol || 'Sin rol' }}</small>
                  </td>
                  <td data-label="Total" class="total-cell">S/ {{ formatearMonto(pedido.total) }}</td>
                  <td data-label="Etapa"><span class="flow-badge" :class="`flow-${String(pedido.etapaFlujo || '').toLowerCase()}`">{{ etiquetaEtapa(pedido.etapaFlujo) }}</span></td>
                  <td data-label="Acciones">
                    <div class="order-actions">
                      <button v-if="pedido.editable" class="action-button primary" @click="abrirPedido(pedido)"><i class="bi bi-pencil-square"></i> Editar</button>
                      <button v-if="pedido.puedeEnviarCocina" class="action-button primary" @click="abrirAccion('ENVIAR', pedido)"><i class="bi bi-send"></i> Enviar</button>
                      <button v-if="pedido.puedeReabrir" class="action-button" @click="abrirAccion('REABRIR', pedido)"><i class="bi bi-arrow-counterclockwise"></i> Reabrir</button>
                      <button v-if="puedeRegistrarSolicitud(pedido)" class="action-button" @click="abrirAccion('OBSERVACION', pedido)"><i class="bi bi-chat-left-text"></i> Solicitud</button>
                      <button v-if="puedeCambiarMesa(pedido)" class="action-button" @click="abrirAccion('MESA', pedido)"><i class="bi bi-arrow-left-right"></i> Mesa</button>
                      <button v-if="puedeTransferir(pedido)" class="action-button" @click="abrirAccion('RESPONSABLE', pedido)"><i class="bi bi-person-up"></i> Transferir</button>
                      <button v-if="pedido.puedeSolicitarCuenta" class="action-button primary" @click="abrirAccion('CUENTA', pedido)"><i class="bi bi-receipt-cutoff"></i> {{ pedido.mesa ? 'Solicitar cuenta' : 'Pasar a Caja' }}</button>
                      <button v-if="pedido.etapaFlujo === 'CUENTA_SOLICITADA' && puedeCobrar" class="action-button primary" @click="irACaja(pedido)"><i class="bi bi-wallet2"></i> Cobrar</button>
                      <button v-if="puedeAnular(pedido)" class="action-button danger" @click="abrirAccion('ANULAR', pedido)"><i class="bi bi-x-circle"></i> Anular</button>
                      <button v-if="!pedido.editable" class="action-button" @click="abrirPedido(pedido)"><i class="bi bi-eye"></i> Detalle</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>

    <Teleport to="body">
      <div v-if="modalAccion" class="order-modal-backdrop" @mousedown.self="cerrarModal">
        <section class="order-action-dialog" role="dialog" aria-modal="true" aria-labelledby="order-action-title" @keydown.esc="cerrarModal">
          <div class="dialog-icon"><i :class="configuracionAccion.icono"></i></div>
          <div class="dialog-heading">
            <span>Pedido #{{ pedidoAccion?.idPedido }}</span>
            <h2 id="order-action-title">{{ configuracionAccion.titulo }}</h2>
            <p>{{ configuracionAccion.detalle }}</p>
          </div>

          <label v-if="modalAccion === 'ANULAR'" for="motivoAnulacion">Motivo de anulación</label>
          <textarea v-if="modalAccion === 'ANULAR'" id="motivoAnulacion" v-model.trim="valorAccion" rows="3" maxlength="200" placeholder="Explica brevemente por qué se anula"></textarea>

          <label v-if="modalAccion === 'OBSERVACION'" for="solicitudAdicional">Solicitud adicional</label>
          <textarea v-if="modalAccion === 'OBSERVACION'" id="solicitudAdicional" v-model="valorAccion" rows="4" maxlength="250" placeholder="Ej. servir salsa aparte"></textarea>

          <label v-if="modalAccion === 'MESA'" for="mesaDestino">Nueva mesa</label>
          <select v-if="modalAccion === 'MESA'" id="mesaDestino" v-model.number="valorAccion">
            <option :value="null" disabled>Selecciona una mesa disponible</option>
            <option v-for="mesa in mesasLibres" :key="mesa.idMesa" :value="mesa.idMesa">Mesa {{ mesa.numeroMesa }} · Piso {{ mesa.piso }}</option>
          </select>

          <label v-if="modalAccion === 'RESPONSABLE'" for="responsableDestino">Nuevo responsable</label>
          <select v-if="modalAccion === 'RESPONSABLE'" id="responsableDestino" v-model.number="valorAccion">
            <option :value="null" disabled>Selecciona un usuario autorizado</option>
            <option v-for="responsable in responsablesDisponibles" :key="responsable.idUsuario" :value="responsable.idUsuario">{{ responsable.nombreCompleto }}</option>
          </select>

          <div v-if="errorAccion" class="dialog-error"><i class="bi bi-exclamation-triangle"></i>{{ errorAccion }}</div>

          <div class="dialog-actions">
            <button class="secondary" :disabled="procesandoAccion" @click="cerrarModal">Cancelar</button>
            <button :class="{ danger: modalAccion === 'ANULAR' }" :disabled="!accionValida || procesandoAccion" @click="confirmarAccion">
              <span v-if="procesandoAccion" class="spinner-border spinner-border-sm"></span>
              <i v-else :class="configuracionAccion.icono"></i>
              {{ procesandoAccion ? 'Procesando…' : configuracionAccion.confirmar }}
            </button>
          </div>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import NavbarComponent from '@/components/NavbarComponent.vue'
import SidebarComponent from '@/components/SidebarComponent.vue'
import pedidoService from '@/services/pedidoService'
import { obtenerMesas } from '@/services/mesaService'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const pedidos = ref([])
const mesas = ref([])
const responsables = ref([])
const cargando = ref(false)
const errorCarga = ref('')
const mensajeExito = ref('')
const busqueda = ref('')
const filtroEstado = ref('TODOS')
const modalAccion = ref('')
const pedidoAccion = ref(null)
const valorAccion = ref(null)
const procesandoAccion = ref(false)
const errorAccion = ref('')

const rolActual = computed(() => String(authStore.usuario?.rol || '').toUpperCase())
const puedeVerTodos = computed(() => ['ADMIN', 'CAJERO'].includes(rolActual.value))
const puedeCobrar = computed(() => ['ADMIN', 'CAJERO'].includes(rolActual.value))
const estadosDisponibles = computed(() => [...new Set(pedidos.value.map((pedido) => pedido.etapaFlujo).filter(Boolean))])
const resumen = computed(() => ({
  borradores: pedidos.value.filter((pedido) => pedido.etapaFlujo === 'BORRADOR').length,
  cocina: pedidos.value.filter((pedido) => ['RECIBIDO', 'EN_PREPARACION', 'LISTO', 'ENTREGADO'].includes(pedido.etapaFlujo)).length,
  cuenta: pedidos.value.filter((pedido) => pedido.etapaFlujo === 'CUENTA_SOLICITADA').length,
  cerrados: pedidos.value.filter(pedidoCerrado).length,
}))
const pedidosFiltrados = computed(() => {
  const termino = busqueda.value.toLocaleLowerCase('es-PE')
  return pedidos.value.filter((pedido) => {
    const coincideEstado = filtroEstado.value === 'TODOS' || pedido.etapaFlujo === filtroEstado.value
    const campos = [
      pedido.idPedido,
      pedido.mesa?.numeroMesa,
      pedido.clienteNombre,
      pedido.modalidadPedido?.nombreModalidad,
      pedido.observacion,
      nombreCreador(pedido),
    ].filter(Boolean).join(' ').toLocaleLowerCase('es-PE')
    return coincideEstado && (!termino || campos.includes(termino))
  })
})
const mesasLibres = computed(() => mesas.value.filter((mesa) =>
  ['libre', 'reservada'].includes(String(mesa.estadoMesa?.descripcion || '').toLowerCase())
  && mesa.idMesa !== pedidoAccion.value?.mesa?.idMesa,
))
const responsablesDisponibles = computed(() => responsables.value.filter((responsable) =>
  responsable.idUsuario !== pedidoAccion.value?.usuario?.idUsuario,
))
const configuracionAccion = computed(() => ({
  ENVIAR: { titulo: 'Enviar pedido a Cocina', detalle: 'Los productos quedarán bloqueados y Cocina recibirá la comanda.', confirmar: 'Enviar a Cocina', icono: 'bi bi-send' },
  REABRIR: { titulo: 'Reabrir comanda', detalle: 'El pedido volverá a borrador mientras Cocina aún no haya iniciado la preparación.', confirmar: 'Reabrir pedido', icono: 'bi bi-arrow-counterclockwise' },
  CUENTA: { titulo: pedidoAccion.value?.mesa ? 'Solicitar cuenta' : 'Enviar pedido a Caja', detalle: 'Caja podrá seleccionar y cobrar este pedido.', confirmar: 'Enviar a Caja', icono: 'bi bi-wallet2' },
  ANULAR: { titulo: 'Anular pedido', detalle: 'La anulación quedará registrada y, si corresponde, la mesa será liberada.', confirmar: 'Anular pedido', icono: 'bi bi-x-circle' },
  MESA: { titulo: 'Cambiar mesa', detalle: 'El consumo y la atención pasarán a la nueva mesa seleccionada.', confirmar: 'Cambiar mesa', icono: 'bi bi-arrow-left-right' },
  RESPONSABLE: { titulo: 'Transferir atención', detalle: 'El nuevo responsable podrá continuar administrando esta comanda.', confirmar: 'Transferir', icono: 'bi bi-person-up' },
  OBSERVACION: { titulo: 'Registrar solicitud adicional', detalle: 'Actualiza las indicaciones visibles para el personal de Cocina.', confirmar: 'Guardar solicitud', icono: 'bi bi-chat-left-text' },
})[modalAccion.value] || { titulo: '', detalle: '', confirmar: 'Confirmar', icono: 'bi bi-check2' })
const accionValida = computed(() => {
  if (['ANULAR', 'OBSERVACION'].includes(modalAccion.value)) return Boolean(String(valorAccion.value || '').trim())
  if (['MESA', 'RESPONSABLE'].includes(modalAccion.value)) return Boolean(valorAccion.value)
  return Boolean(modalAccion.value)
})

async function cargarPedidos() {
  cargando.value = true
  errorCarga.value = ''
  try {
    pedidos.value = await pedidoService.getPedidos()
  } catch (error) {
    pedidos.value = []
    errorCarga.value = mensajeError(error, 'No se pudieron cargar los pedidos.')
  } finally {
    cargando.value = false
  }
}

async function cargarDatosDeApoyo() {
  const [mesasResultado, responsablesResultado] = await Promise.allSettled([
    obtenerMesas(),
    pedidoService.getResponsables(),
  ])
  mesas.value = mesasResultado.status === 'fulfilled' ? mesasResultado.value : []
  responsables.value = responsablesResultado.status === 'fulfilled' ? responsablesResultado.value : []
}

function nuevoPedido() {
  router.push({ path: '/nuevo-pedido', query: { origen: 'pedidos' } })
}

function abrirPedido(pedido) {
  router.push({
    path: '/nuevo-pedido',
    query: {
      idPedido: pedido.idPedido,
      idMesa: pedido.mesa?.idMesa,
      numeroMesa: pedido.mesa?.numeroMesa,
      origen: 'pedidos',
    },
  })
}

function irACaja(pedido) {
  router.push({ path: '/caja', query: { idPedido: pedido.idPedido } })
}

function abrirAccion(tipo, pedido) {
  modalAccion.value = tipo
  pedidoAccion.value = pedido
  errorAccion.value = ''
  valorAccion.value = tipo === 'OBSERVACION' ? pedido.observacion || '' : null
}

function cerrarModal() {
  if (procesandoAccion.value) return
  modalAccion.value = ''
  pedidoAccion.value = null
  valorAccion.value = null
  errorAccion.value = ''
}

async function confirmarAccion() {
  if (!accionValida.value || procesandoAccion.value) return
  procesandoAccion.value = true
  errorAccion.value = ''
  try {
    const id = pedidoAccion.value.idPedido
    const mensajes = {
      ENVIAR: 'Pedido enviado a Cocina correctamente.',
      REABRIR: 'Pedido reabierto como borrador.',
      CUENTA: 'Pedido enviado a Caja correctamente.',
      ANULAR: 'Pedido anulado y registrado correctamente.',
      MESA: 'Mesa cambiada correctamente.',
      RESPONSABLE: 'Atención transferida correctamente.',
      OBSERVACION: 'Solicitud adicional actualizada.',
    }
    if (modalAccion.value === 'ENVIAR') await pedidoService.enviarACocina(id)
    if (modalAccion.value === 'REABRIR') await pedidoService.reabrir(id)
    if (modalAccion.value === 'CUENTA') await pedidoService.solicitarCuenta(id)
    if (modalAccion.value === 'ANULAR') await pedidoService.anular(id, valorAccion.value)
    if (modalAccion.value === 'MESA') await pedidoService.cambiarMesa(id, valorAccion.value)
    if (modalAccion.value === 'RESPONSABLE') await pedidoService.transferirResponsable(id, valorAccion.value)
    if (modalAccion.value === 'OBSERVACION') await pedidoService.actualizarObservacion(id, valorAccion.value)
    mensajeExito.value = mensajes[modalAccion.value]
    procesandoAccion.value = false
    cerrarModal()
    await Promise.all([cargarPedidos(), cargarDatosDeApoyo()])
  } catch (error) {
    errorAccion.value = mensajeError(error, 'No se pudo completar la acción.')
  } finally {
    procesandoAccion.value = false
  }
}

function puedeRegistrarSolicitud(pedido) {
  return !pedido.editable && !pedidoCerrado(pedido) && pedido.etapaFlujo !== 'CUENTA_SOLICITADA'
}

function puedeCambiarMesa(pedido) {
  return Boolean(pedido.mesa) && !pedidoCerrado(pedido) && pedido.etapaFlujo !== 'CUENTA_SOLICITADA'
}

function puedeTransferir(pedido) {
  return Boolean(pedido.mesa) && !pedidoCerrado(pedido)
}

function puedeAnular(pedido) {
  return pedido.etapaFlujo === 'BORRADOR' || pedido.puedeReabrir
}

function pedidoCerrado(pedido) {
  return ['PAGADO', 'CANCELADO'].includes(pedido.etapaFlujo)
}

function etiquetaEtapa(etapa) {
  return ({
    BORRADOR: 'Borrador',
    RECIBIDO: 'Recibido',
    EN_PREPARACION: 'En preparación',
    LISTO: 'Listo',
    ENTREGADO: 'Entregado',
    CUENTA_SOLICITADA: 'Cuenta solicitada',
    PAGADO: 'Pagado',
    CANCELADO: 'Cancelado',
  })[etapa] || etapa || 'Sin etapa'
}

function ubicacionPedido(pedido) {
  if (pedido.mesa) return `Mesa ${pedido.mesa.numeroMesa}`
  return pedido.clienteNombre || pedido.modalidadPedido?.nombreModalidad || 'Sin mesa'
}

function iconoModalidad(pedido) {
  const modalidad = String(pedido.modalidadPedido?.nombreModalidad || '').toUpperCase()
  if (modalidad.includes('DELIVERY')) return 'bi bi-bicycle'
  if (modalidad.includes('LLEVAR')) return 'bi bi-bag'
  return 'bi bi-grid-3x3-gap'
}

function nombreCreador(pedido) {
  return [pedido.usuario?.nombre, pedido.usuario?.apellido].filter(Boolean).join(' ') || pedido.usuario?.correo || 'No disponible'
}

function formatearMonto(monto) {
  return Number(monto || 0).toFixed(2)
}

function formatearFecha(fecha) {
  const valor = fecha ? new Date(fecha) : null
  return valor && !Number.isNaN(valor.getTime())
    ? new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(valor)
    : '-'
}

function mensajeError(error, alternativo) {
  return error.response?.data?.mensaje || error.response?.data?.message || error.response?.data?.error || alternativo
}

onMounted(() => Promise.all([cargarPedidos(), cargarDatosDeApoyo()]))
</script>

<style scoped>
.pedidos-page { background: var(--rc-page); min-height: calc(100vh - 68px); padding: 1.25rem 1.5rem 2rem; }
.orders-heading { align-items: center; display: flex; gap: 1rem; justify-content: space-between; margin-bottom: .85rem; }
.orders-title-group { align-items: center; display: flex; gap: .75rem; }
.orders-title-icon { align-items: center; background: linear-gradient(135deg,var(--rc-primary),#e88960); border-radius: 12px; box-shadow: 0 5px 14px rgba(190,80,42,.2); color: #fff; display: flex; flex: 0 0 auto; font-size: 1.1rem; height: 44px; justify-content: center; width: 44px; }
.orders-heading h1 { color: var(--rc-ink); font-size: clamp(1.45rem,2vw,1.8rem); font-weight: 780; letter-spacing: -.035em; margin: 0; }
.orders-heading p { color: var(--rc-muted); font-size: .78rem; margin: .18rem 0 0; }
.orders-heading-actions { display: flex; gap: .55rem; }
.orders-refresh,.orders-new { align-items: center; border-radius: 9px; display: inline-flex; font-size: .68rem; font-weight: 730; gap: .4rem; justify-content: center; min-height: 40px; padding: .45rem .75rem; }
.orders-refresh { background: var(--rc-surface); border: 1px solid var(--rc-border-strong); color: var(--rc-ink-soft); }
.orders-new { background: var(--rc-primary); border: 1px solid var(--rc-primary); color: #fff; }
.orders-summary { display: grid; gap: .7rem; grid-template-columns: repeat(4,minmax(0,1fr)); margin-bottom: .85rem; }
.orders-summary article { align-items: center; background: var(--rc-surface); border: 1px solid var(--rc-border); border-radius: 11px; display: flex; gap: .65rem; padding: .68rem .78rem; }
.orders-summary article > i { align-items: center; background: var(--rc-primary-soft); border-radius: 8px; color: var(--rc-primary-hover); display: flex; height: 34px; justify-content: center; width: 34px; }
.orders-summary article:nth-child(2) > i { background: var(--rc-warning-soft); color: var(--rc-warning); }
.orders-summary article:nth-child(3) > i { background: var(--rc-info-soft); color: var(--rc-info); }
.orders-summary article:nth-child(4) > i { background: var(--rc-success-soft); color: var(--rc-success); }
.orders-summary span { color: var(--rc-muted); display: block; font-size: .56rem; }
.orders-summary strong { color: var(--rc-ink); display: block; font-size: .9rem; }
.pedidos-page > .alert { border: 1px solid var(--rc-border); border-radius: 9px; font-size: .7rem; }
.pedidos-card { background: var(--rc-surface); border: 1px solid var(--rc-border); border-radius: 13px; box-shadow: var(--rc-shadow-xs); overflow: hidden; }
.orders-filters { align-items: end; border-bottom: 1px solid var(--rc-border); display: grid; gap: .75rem; grid-template-columns: minmax(260px,1fr) minmax(170px,240px); padding: .85rem; }
.orders-filters label { color: var(--rc-ink-soft); display: block; font-size: .62rem; font-weight: 730; margin-bottom: .3rem; }
.orders-filters input,.orders-filters select { background: var(--rc-surface); border: 1px solid var(--rc-border); border-radius: 8px; color: var(--rc-ink); font-size: .68rem; min-height: 39px; padding: .4rem .65rem; width: 100%; }
.input-with-icon { position: relative; }
.input-with-icon i { color: var(--rc-muted); left: .7rem; position: absolute; top: 50%; transform: translateY(-50%); }
.input-with-icon input { padding-left: 2rem; }
.orders-table { border-collapse: collapse; min-width: 940px; width: 100%; }
.orders-table th { background: #f8f4f1; color: #6b625d; font-size: .59rem; letter-spacing: .04em; padding: .72rem; text-align: left; text-transform: uppercase; }
.orders-table td { border-top: 1px solid var(--rc-border); color: var(--rc-ink-soft); font-size: .66rem; padding: .72rem; vertical-align: middle; }
.orders-table tbody tr:hover { background: rgba(220,116,72,.035); }
.service-cell { align-items: center; display: flex; gap: .55rem; }
.service-icon { align-items: center; background: var(--rc-primary-soft); border-radius: 8px; color: var(--rc-primary-hover); display: flex; flex: 0 0 auto; height: 31px; justify-content: center; width: 31px; }
.service-cell strong,.service-cell small,.responsible-role { display: block; }
.service-cell small,.responsible-role { color: var(--rc-muted); font-size: .55rem; margin-top: .08rem; }
.total-cell { color: var(--rc-ink) !important; font-weight: 780; white-space: nowrap; }
.flow-badge { border-radius: 999px; display: inline-flex; font-size: .56rem; font-weight: 760; padding: .34rem .5rem; white-space: nowrap; }
.flow-borrador { background: var(--rc-warning-soft); color: var(--rc-warning); }
.flow-recibido,.flow-en_preparacion { background: var(--rc-info-soft); color: var(--rc-info); }
.flow-listo,.flow-entregado { background: #ece8ff; color: #6550a5; }
.flow-cuenta_solicitada { background: #fff0d9; color: #9a5a08; }
.flow-pagado { background: var(--rc-success-soft); color: var(--rc-success); }
.flow-cancelado { background: var(--rc-danger-soft); color: var(--rc-danger); }
.order-actions { display: flex; flex-wrap: wrap; gap: .3rem; min-width: 210px; }
.action-button { align-items: center; background: var(--rc-surface); border: 1px solid var(--rc-border-strong); border-radius: 7px; color: var(--rc-ink-soft); display: inline-flex; font-size: .55rem; font-weight: 710; gap: .25rem; min-height: 30px; padding: .28rem .46rem; }
.action-button.primary { background: var(--rc-primary); border-color: var(--rc-primary); color: #fff; }
.action-button.danger { border-color: #e6b9b5; color: var(--rc-danger); }
.empty-row { color: var(--rc-muted) !important; padding: 2.5rem !important; text-align: center; }
.empty-row > i,.empty-row > strong,.empty-row > span { display: block; margin: .2rem auto; }
.empty-row > i { font-size: 1.6rem; }
body.dark-theme .orders-table th { background: #333334; color: #c8c0ba; }
body.dark-theme .orders-filters input,body.dark-theme .orders-filters select { background: #303031; }
@media (max-width: 991.98px) { .orders-summary { grid-template-columns: 1fr 1fr; } }
@media (max-width: 767.98px) {
  .pedidos-page { padding: 1rem; }
  .orders-heading { align-items: flex-start; flex-direction: column; }
  .orders-heading-actions { width: 100%; }
  .orders-heading-actions > button { flex: 1; }
  .orders-filters { grid-template-columns: 1fr; }
  .pedidos-card { background: transparent; border: 0; box-shadow: none; overflow: visible; }
  .orders-filters { background: var(--rc-surface); border: 1px solid var(--rc-border); border-radius: 12px; margin-bottom: .7rem; }
  .pedidos-card .table-responsive { overflow: visible; }
  .orders-table { min-width: 0; }
  .orders-table thead { display: none; }
  .orders-table tbody { display: grid; gap: .7rem; }
  .orders-table tbody tr { background: var(--rc-surface); border: 1px solid var(--rc-border); border-radius: 12px; display: block; padding: .35rem .75rem; }
  .orders-table tbody td { align-items: center; border-top: 0; border-bottom: 1px solid var(--rc-border); display: flex; gap: .75rem; justify-content: space-between; min-height: 40px; padding: .5rem 0; text-align: right; }
  .orders-table tbody td::before { color: var(--rc-muted); content: attr(data-label); flex: 0 0 27%; font-size: .52rem; font-weight: 760; text-align: left; text-transform: uppercase; }
  .orders-table tbody td:last-child { border-bottom: 0; }
  .orders-table tbody td[colspan] { display: block; }
  .orders-table tbody td[colspan]::before { display: none; }
  .order-actions { justify-content: flex-end; min-width: 0; }
}
</style>

<style>
.order-modal-backdrop { align-items: center; background: rgba(27,22,19,.58); display: flex; inset: 0; justify-content: center; padding: 1rem; position: fixed; z-index: 2100; }
.order-action-dialog { background: var(--rc-surface); border: 1px solid var(--rc-border); border-radius: 15px; box-shadow: 0 22px 70px rgba(20,15,12,.28); max-width: 460px; padding: 1.15rem; width: 100%; }
.dialog-icon { align-items: center; background: var(--rc-primary-soft); border-radius: 11px; color: var(--rc-primary-hover); display: flex; font-size: 1.05rem; height: 42px; justify-content: center; margin-bottom: .7rem; width: 42px; }
.dialog-heading > span { color: var(--rc-primary-hover); font-size: .58rem; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; }
.dialog-heading h2 { color: var(--rc-ink); font-size: 1.1rem; font-weight: 780; margin: .18rem 0; }
.dialog-heading p { color: var(--rc-muted); font-size: .68rem; line-height: 1.5; margin: 0 0 .8rem; }
.order-action-dialog label { color: var(--rc-ink-soft); display: block; font-size: .62rem; font-weight: 730; margin-bottom: .3rem; }
.order-action-dialog textarea,.order-action-dialog select { background: var(--rc-surface); border: 1px solid var(--rc-border-strong); border-radius: 8px; color: var(--rc-ink); font-size: .7rem; padding: .55rem .65rem; resize: vertical; width: 100%; }
.dialog-error { align-items: center; background: var(--rc-danger-soft); border-radius: 8px; color: var(--rc-danger); display: flex; font-size: .63rem; gap: .4rem; margin-top: .65rem; padding: .55rem; }
.dialog-actions { display: flex; gap: .55rem; justify-content: flex-end; margin-top: 1rem; }
.dialog-actions button { align-items: center; background: var(--rc-primary); border: 1px solid var(--rc-primary); border-radius: 8px; color: #fff; display: inline-flex; font-size: .65rem; font-weight: 730; gap: .35rem; justify-content: center; min-height: 38px; padding: .45rem .7rem; }
.dialog-actions button.secondary { background: var(--rc-surface); border-color: var(--rc-border-strong); color: var(--rc-ink-soft); }
.dialog-actions button.danger { background: var(--rc-danger); border-color: var(--rc-danger); }
.dialog-actions button:disabled { opacity: .55; }
body.dark-theme .order-action-dialog textarea,body.dark-theme .order-action-dialog select { background: #303031; }
</style>
