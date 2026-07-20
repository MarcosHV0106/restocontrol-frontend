<template>
  <div class="layout">
    <SidebarComponent />
    <div class="main-content">
      <NavbarComponent />
      <main class="alerts-page">
        <header class="alerts-heading">
          <div class="alerts-title">
            <span class="alerts-title-icon"><i class="bi bi-bell-fill"></i></span>
            <div>
              <h1>Centro de Alertas de Inventario</h1>
              <p>Monitorea y atiende existencias críticas y lotes próximos a vencer.</p>
            </div>
          </div>
          <div class="alerts-summary">
            <article class="summary-active"><small>Alertas activas</small><strong>{{ resumen.activas + resumen.revisadas }}</strong></article>
            <article class="summary-done"><small>Atendidas</small><strong>{{ resumen.atendidas }}</strong></article>
          </div>
        </header>

        <section class="alerts-panel">
          <div class="alerts-toolbar">
            <label class="alerts-search">
              <i class="bi bi-search"></i>
              <input v-model.trim="busqueda" type="search" placeholder="Buscar insumo, lote o detalle..." />
            </label>
            <select v-model="filtroTipo" aria-label="Filtrar por tipo">
              <option value="">Todos los tipos</option>
              <option value="STOCK_BAJO">Stock bajo</option>
              <option value="VENCIMIENTO_PROXIMO">Vencimiento próximo</option>
              <option value="LOTE_VENCIDO">Lote vencido</option>
            </select>
            <select v-model="filtroEstado" aria-label="Filtrar por estado">
              <option value="">Todos los estados</option>
              <option value="ACTIVA">Activas</option>
              <option value="REVISADA">Revisadas</option>
              <option value="ATENDIDA">Atendidas</option>
            </select>
            <button class="alerts-refresh" :disabled="cargando" @click="cargar">
              <i class="bi bi-arrow-clockwise" :class="{ spinning: cargando }"></i>
              Actualizar alertas
            </button>
          </div>

          <div v-if="error" class="alert alert-danger alerts-message"><i class="bi bi-exclamation-triangle"></i>{{ error }}</div>
          <div v-if="cargando && !alertas.length" class="alerts-loading">
            <span class="spinner-border" role="status"></span><strong>Analizando inventario...</strong>
          </div>

          <div v-else class="table-responsive">
            <table class="alerts-table">
              <thead><tr><th>Insumo</th><th>Lote</th><th>Motivo</th><th>Detalle</th><th>Generada</th><th>Estado</th><th>Acción</th></tr></thead>
              <tbody>
                <tr v-for="alerta in alertasFiltradas" :key="alerta.idAlerta">
                  <td><div class="product-cell"><span :class="`alert-icon type-${alerta.tipo.toLowerCase()}`"><i :class="iconoTipo(alerta.tipo)"></i></span><strong>{{ alerta.nombreInsumo }}</strong></div></td>
                  <td><span v-if="alerta.codigoLote" class="lot-code">{{ alerta.codigoLote }}</span><span v-else class="text-muted">—</span></td>
                  <td><span class="type-badge" :class="`badge-${alerta.tipo.toLowerCase()}`">{{ etiquetaTipo(alerta.tipo) }}</span></td>
                  <td class="detail-cell">{{ alerta.detalle }}</td>
                  <td>{{ fecha(alerta.fechaGeneracion) }}</td>
                  <td><span class="status-badge" :class="`status-${alerta.estado.toLowerCase()}`">{{ etiquetaEstado(alerta.estado) }}</span></td>
                  <td>
                    <button v-if="alerta.estado !== 'ATENDIDA'" class="attend-button" @click="abrirAtencion(alerta)">Atender</button>
                    <span v-else class="attended-copy"><i class="bi bi-check2"></i>{{ alerta.accion ? etiquetaAccion(alerta.accion) : 'Resuelta' }}</span>
                  </td>
                </tr>
                <tr v-if="alertasFiltradas.length === 0"><td colspan="7"><div class="alerts-empty"><i class="bi bi-check-circle"></i><strong>No hay alertas con estos filtros</strong><span>El inventario no presenta coincidencias pendientes.</span></div></td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>

    <div v-if="alertaSeleccionada" class="alert-modal-backdrop" @click.self="cerrarAtencion">
      <section class="alert-modal" role="dialog" aria-modal="true" aria-labelledby="alert-modal-title">
        <header>
          <div><small>ATENDER ALERTA</small><h2 id="alert-modal-title">{{ alertaSeleccionada.nombreInsumo }}</h2></div>
          <button aria-label="Cerrar" @click="cerrarAtencion"><i class="bi bi-x-lg"></i></button>
        </header>
        <div class="alert-context">
          <span :class="`alert-icon type-${alertaSeleccionada.tipo.toLowerCase()}`"><i :class="iconoTipo(alertaSeleccionada.tipo)"></i></span>
          <div><strong>{{ etiquetaTipo(alertaSeleccionada.tipo) }}</strong><p>{{ alertaSeleccionada.detalle }}</p></div>
        </div>
        <fieldset class="action-options">
          <legend>Selecciona la acción a realizar</legend>
          <label v-for="opcion in accionesPermitidas" :key="opcion.valor" :class="{ selected: atencion.accion === opcion.valor }">
            <input v-model="atencion.accion" type="radio" name="accion" :value="opcion.valor" />
            <span><i :class="opcion.icono"></i></span>
            <div><strong>{{ opcion.titulo }}</strong><small>{{ opcion.descripcion }}</small></div>
          </label>
        </fieldset>
        <label class="observation-field">Observación opcional<textarea v-model.trim="atencion.observacion" maxlength="250" rows="3" placeholder="Añade una nota para la auditoría..."></textarea></label>
        <p v-if="errorAtencion" class="modal-error">{{ errorAtencion }}</p>
        <footer><button class="btn btn-outline-secondary" :disabled="procesando" @click="cerrarAtencion">Cancelar</button><button class="btn btn-primary" :disabled="!atencion.accion || procesando" @click="confirmarAtencion"><span v-if="procesando" class="spinner-border spinner-border-sm"></span>{{ procesando ? 'Registrando...' : 'Registrar atención' }}</button></footer>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import NavbarComponent from '@/components/NavbarComponent.vue'
import SidebarComponent from '@/components/SidebarComponent.vue'
import { atenderAlerta, obtenerAlertas, obtenerResumenAlertas, sincronizarAlertas } from '@/services/alertaInventarioService'
import '@/assets/css/alertas-inventario.css'

const alertas = ref([])
const router = useRouter()
const resumen = reactive({ activas: 0, revisadas: 0, atendidas: 0 })
const busqueda = ref('')
const filtroTipo = ref('')
const filtroEstado = ref('')
const cargando = ref(false)
const procesando = ref(false)
const error = ref('')
const errorAtencion = ref('')
const alertaSeleccionada = ref(null)
const atencion = reactive({ accion: '', observacion: '' })

const alertasFiltradas = computed(() => {
  const termino = busqueda.value.toLocaleUpperCase('es')
  return alertas.value.filter((alerta) => {
    const texto = `${alerta.nombreInsumo} ${alerta.codigoLote || ''} ${alerta.detalle}`.toLocaleUpperCase('es')
    return (!termino || texto.includes(termino))
      && (!filtroTipo.value || alerta.tipo === filtroTipo.value)
      && (!filtroEstado.value || alerta.estado === filtroEstado.value)
  })
})

const accionesPermitidas = computed(() => alertaSeleccionada.value?.tipo === 'STOCK_BAJO'
  ? [
      { valor: 'SOLICITAR_REPOSICION', titulo: 'Solicitar reposición', descripcion: 'Registra que el insumo debe ser reabastecido.', icono: 'bi bi-cart-plus' },
      { valor: 'SOLO_SEGUIMIENTO', titulo: 'Solo seguimiento', descripcion: 'Marca la alerta como revisada y conserva el stock.', icono: 'bi bi-eye' },
    ]
  : [
      { valor: 'RETIRAR_LOTE_MERMA', titulo: 'Retirar lote / merma', descripcion: 'Retira toda la existencia del lote y registra la salida.', icono: 'bi bi-trash3' },
      { valor: 'SOLO_SEGUIMIENTO', titulo: 'Solo seguimiento', descripcion: 'Marca la alerta como revisada sin retirar el lote.', icono: 'bi bi-eye' },
    ])

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    await sincronizarAlertas()
    const [lista, datosResumen] = await Promise.all([obtenerAlertas(), obtenerResumenAlertas()])
    alertas.value = lista
    Object.assign(resumen, datosResumen)
  } catch (err) {
    error.value = mensajeError(err, 'No se pudieron cargar las alertas de inventario.')
  } finally {
    cargando.value = false
  }
}

function abrirAtencion(alerta) {
  alertaSeleccionada.value = alerta
  atencion.accion = ''
  atencion.observacion = ''
  errorAtencion.value = ''
}

function cerrarAtencion() {
  if (procesando.value) return
  alertaSeleccionada.value = null
}

async function confirmarAtencion() {
  if (!alertaSeleccionada.value || !atencion.accion) return
  procesando.value = true
  errorAtencion.value = ''
  try {
    const abrirReposicion = atencion.accion === 'SOLICITAR_REPOSICION'
    const idInsumo = alertaSeleccionada.value.idInsumo
    await atenderAlerta(alertaSeleccionada.value.idAlerta, { ...atencion })
    alertaSeleccionada.value = null
    if (abrirReposicion) {
      await router.push({ path: '/abastecimiento', query: { nuevaCompra: '1', idInsumo } })
      return
    }
    await cargar()
  } catch (err) {
    errorAtencion.value = mensajeError(err, 'No se pudo registrar la atención.')
  } finally {
    procesando.value = false
  }
}

function mensajeError(err, alternativo) { return err?.response?.data?.mensaje || err?.response?.data?.message || alternativo }
function etiquetaTipo(tipo) { return ({ STOCK_BAJO: 'Stock bajo', VENCIMIENTO_PROXIMO: 'Vencimiento próximo', LOTE_VENCIDO: 'Lote vencido' })[tipo] || tipo }
function etiquetaEstado(estado) { return ({ ACTIVA: 'Activa', REVISADA: 'Revisada', ATENDIDA: 'Atendida' })[estado] || estado }
function etiquetaAccion(accion) { return ({ SOLICITAR_REPOSICION: 'Reposición solicitada', RETIRAR_LOTE_MERMA: 'Lote retirado', SOLO_SEGUIMIENTO: 'Seguimiento' })[accion] || accion }
function iconoTipo(tipo) { return tipo === 'STOCK_BAJO' ? 'bi bi-box-seam' : tipo === 'LOTE_VENCIDO' ? 'bi bi-x-octagon' : 'bi bi-clock-history' }
function fecha(valor) { return valor ? new Date(valor).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '—' }

onMounted(cargar)
</script>
