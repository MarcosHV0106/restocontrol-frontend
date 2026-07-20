<template>
  <div class="layout management-layout">
    <SidebarComponent />
    <div class="main-content">
      <NavbarComponent />
      <main class="management-page alerts-page">
        <header class="management-heading">
          <div class="management-title-group">
            <span class="management-title-icon"><i class="bi bi-bell-fill"></i></span>
            <div>
              <h1>Centro de alertas de inventario</h1>
              <p>Monitorea el stock y los vencimientos, registra la decisión y continúa con la acción correctiva.</p>
            </div>
          </div>
          <span class="management-count"><i class="bi bi-diagram-3"></i>Alerta → atención → abastecimiento</span>
        </header>

        <section class="management-summary" aria-label="Resumen de alertas de inventario">
          <article><i class="bi bi-exclamation-triangle"></i><div><span>Pendientes de resolver</span><strong>{{ pendientes }}</strong></div></article>
          <article><i class="bi bi-box-seam"></i><div><span>Stock bajo</span><strong>{{ stockBajoPendiente }}</strong></div></article>
          <article><i class="bi bi-clock-history"></i><div><span>Lotes por vencer / vencidos</span><strong>{{ vencimientosPendientes }}</strong></div></article>
          <article><i class="bi bi-check2-circle"></i><div><span>Histórico atendido</span><strong>{{ resumen.atendidas }}</strong></div></article>
        </section>

        <div v-if="mensaje" class="alerts-message alerts-success" role="status">
          <i class="bi bi-check-circle-fill"></i><span>{{ mensaje }}</span>
          <button type="button" aria-label="Cerrar mensaje" @click="mensaje = ''"><i class="bi bi-x-lg"></i></button>
        </div>
        <div v-if="error" class="alerts-message alerts-error" role="alert"><i class="bi bi-exclamation-triangle-fill"></i>{{ error }}</div>

        <section class="management-toolbar alerts-toolbar" aria-label="Filtros de alertas">
          <label class="input-group management-search alerts-search">
            <span class="input-group-text bg-transparent border-0"><i class="bi bi-search"></i></span>
            <input v-model.trim="busqueda" class="form-control border-0 bg-transparent" type="search" placeholder="Buscar insumo, lote o detalle...">
          </label>
          <div class="alerts-filters">
            <select v-model="filtroTipo" aria-label="Filtrar por tipo">
              <option value="">Todos los tipos</option>
              <option value="STOCK_BAJO">Stock bajo</option>
              <option value="VENCIMIENTO_PROXIMO">Vencimiento próximo</option>
              <option value="LOTE_VENCIDO">Lote vencido</option>
            </select>
            <select v-model="filtroEstado" aria-label="Filtrar por estado">
              <option value="">Todos los estados</option>
              <option value="ACTIVA">Activas</option>
              <option value="REVISADA">En seguimiento</option>
              <option value="ATENDIDA">Atendidas</option>
            </select>
            <button type="button" class="btn btn-brand alerts-refresh" :disabled="cargando" @click="cargar">
              <i class="bi bi-arrow-clockwise" :class="{ spinning: cargando }"></i>{{ cargando ? 'Actualizando...' : 'Actualizar' }}
            </button>
          </div>
        </section>

        <section class="custom-table-card management-table-card alerts-panel">
          <div v-if="cargando && !alertas.length" class="alerts-loading">
            <span class="spinner-border" role="status"></span><strong>Analizando inventario...</strong><small>Revisamos mínimos de stock y fechas de vencimiento.</small>
          </div>
          <div v-else class="table-responsive">
            <table class="table align-middle mb-0 alerts-table">
              <thead><tr><th>Insumo</th><th>Motivo</th><th>Situación actual</th><th>Generada</th><th>Estado</th><th class="text-end">Acción</th></tr></thead>
              <tbody>
                <tr v-for="alerta in alertasFiltradas" :key="alerta.idAlerta" :class="{ 'alert-row-attended': alerta.estado === 'ATENDIDA' }">
                  <td data-label="Insumo">
                    <div class="alert-product">
                      <span class="alert-icon" :class="`type-${alerta.tipo.toLowerCase()}`"><i :class="iconoTipo(alerta.tipo)"></i></span>
                      <span><strong>{{ alerta.nombreInsumo }}</strong><small>{{ alerta.codigoLote ? `Lote ${alerta.codigoLote}` : alerta.unidadMedida }}</small></span>
                    </div>
                  </td>
                  <td data-label="Motivo"><span class="type-badge" :class="`badge-${alerta.tipo.toLowerCase()}`">{{ etiquetaTipo(alerta.tipo) }}</span></td>
                  <td data-label="Situación actual" class="alert-detail-cell">
                    <div v-if="alerta.tipo === 'STOCK_BAJO'" class="stock-detail">
                      <span><strong>{{ cantidad(alerta.stockActual) }} {{ alerta.unidadMedida }}</strong><small>Mínimo: {{ cantidad(alerta.stockMinimo) }} {{ alerta.unidadMedida }}</small></span>
                      <span class="stock-meter" aria-hidden="true"><i :style="{ width: `${porcentajeStock(alerta)}%` }"></i></span>
                    </div>
                    <div v-else class="lot-detail">
                      <strong>{{ cantidad(alerta.cantidadLote) }} {{ alerta.unidadMedida }}</strong>
                      <small>{{ textoVencimiento(alerta) }}</small>
                    </div>
                    <small class="detail-copy">{{ alerta.estado === 'ATENDIDA' ? `Condición registrada: ${alerta.detalle}` : alerta.detalle }}</small>
                  </td>
                  <td data-label="Generada"><span class="alert-date">{{ fecha(alerta.fechaGeneracion) }}</span></td>
                  <td data-label="Estado">
                    <span class="status-badge" :class="`status-${alerta.estado.toLowerCase()}`">{{ etiquetaEstado(alerta.estado) }}</span>
                    <small v-if="alerta.usuarioAtencion" class="attention-audit">{{ alerta.usuarioAtencion }} · {{ fecha(alerta.fechaAtencion || alerta.fechaRevision) }}</small>
                  </td>
                  <td data-label="Acción" class="text-end">
                    <button v-if="alerta.estado !== 'ATENDIDA'" type="button" class="attend-button" @click="abrirAtencion(alerta)"><i class="bi bi-check2-square"></i>Atender</button>
                    <span v-else class="attended-copy"><i class="bi bi-check2"></i>{{ alerta.accion ? etiquetaAccion(alerta.accion) : 'Resuelta automáticamente' }}</span>
                  </td>
                </tr>
                <tr v-if="alertasFiltradas.length === 0"><td colspan="6"><div class="management-empty alerts-empty"><i class="bi bi-shield-check"></i><strong>No hay alertas con estos filtros</strong><span>El inventario no presenta coincidencias pendientes.</span></div></td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>

    <div v-if="alertaSeleccionada" class="alert-modal-backdrop" @click.self="cerrarAtencion">
      <section class="alert-modal" role="dialog" aria-modal="true" aria-labelledby="alert-modal-title">
        <header>
          <div><small>ATENDER ALERTA #{{ alertaSeleccionada.idAlerta }}</small><h2 id="alert-modal-title">{{ alertaSeleccionada.nombreInsumo }}</h2><p>Registra la decisión para mantener la trazabilidad del inventario.</p></div>
          <button type="button" aria-label="Cerrar" @click="cerrarAtencion"><i class="bi bi-x-lg"></i></button>
        </header>
        <div class="alert-context">
          <span class="alert-icon" :class="`type-${alertaSeleccionada.tipo.toLowerCase()}`"><i :class="iconoTipo(alertaSeleccionada.tipo)"></i></span>
          <div>
            <strong>{{ etiquetaTipo(alertaSeleccionada.tipo) }}</strong>
            <p>{{ alertaSeleccionada.detalle }}</p>
            <small v-if="alertaSeleccionada.tipo === 'STOCK_BAJO'">Compra sugerida: {{ cantidad(alertaSeleccionada.cantidadSugeridaReposicion) }} {{ alertaSeleccionada.unidadMedida }} para superar el mínimo.</small>
            <small v-else>Lote {{ alertaSeleccionada.codigoLote }} · {{ cantidad(alertaSeleccionada.cantidadLote) }} {{ alertaSeleccionada.unidadMedida }}.</small>
          </div>
        </div>
        <fieldset class="action-options">
          <legend>¿Qué acción corresponde?</legend>
          <label v-for="opcion in accionesPermitidas" :key="opcion.valor" :class="{ selected: atencion.accion === opcion.valor }">
            <input v-model="atencion.accion" type="radio" name="accion" :value="opcion.valor">
            <span><i :class="opcion.icono"></i></span>
            <div><strong>{{ opcion.titulo }}</strong><small>{{ opcion.descripcion }}</small></div>
          </label>
        </fieldset>
        <label class="observation-field">Observación opcional<textarea v-model.trim="atencion.observacion" maxlength="250" rows="3" placeholder="Añade una nota para la auditoría..."></textarea><small>{{ atencion.observacion.length }}/250</small></label>
        <p v-if="esRetiro" class="alert-warning"><i class="bi bi-exclamation-triangle"></i>Se retirará toda la existencia del lote y se registrará una salida por merma.</p>
        <p v-if="errorAtencion" class="modal-error">{{ errorAtencion }}</p>
        <footer>
          <button type="button" class="btn btn-outline-secondary" :disabled="procesando" @click="cerrarAtencion">Cancelar</button>
          <button type="button" class="btn" :class="esRetiro ? 'btn-danger' : 'btn-brand'" :disabled="!atencion.accion || procesando" @click="confirmarAtencion"><span v-if="procesando" class="spinner-border spinner-border-sm"></span>{{ procesando ? 'Registrando...' : textoConfirmacion }}</button>
        </footer>
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
import '@/assets/css/management.css'
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
const mensaje = ref('')
const errorAtencion = ref('')
const alertaSeleccionada = ref(null)
const atencion = reactive({ accion: '', observacion: '' })

const pendientes = computed(() => resumen.activas + resumen.revisadas)
const alertasPendientes = computed(() => alertas.value.filter(alerta => alerta.estado !== 'ATENDIDA'))
const stockBajoPendiente = computed(() => alertasPendientes.value.filter(alerta => alerta.tipo === 'STOCK_BAJO').length)
const vencimientosPendientes = computed(() => alertasPendientes.value.filter(alerta => alerta.tipo === 'VENCIMIENTO_PROXIMO' || alerta.tipo === 'LOTE_VENCIDO').length)
const esRetiro = computed(() => atencion.accion === 'RETIRAR_LOTE_MERMA')
const textoConfirmacion = computed(() => atencion.accion === 'SOLICITAR_REPOSICION' ? 'Registrar y abastecer' : esRetiro.value ? 'Retirar lote y registrar' : 'Registrar seguimiento')

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
      { valor: 'SOLICITAR_REPOSICION', titulo: 'Solicitar reposición', descripcion: 'Registra el seguimiento y abre una compra con insumo y cantidad sugerida.', icono: 'bi bi-cart-plus' },
      { valor: 'SOLO_SEGUIMIENTO', titulo: 'Solo seguimiento', descripcion: 'Deja constancia de la revisión sin modificar el stock.', icono: 'bi bi-eye' },
    ]
  : [
      { valor: 'RETIRAR_LOTE_MERMA', titulo: 'Retirar lote / merma', descripcion: 'Descuenta el lote deteriorado y registra el movimiento de salida.', icono: 'bi bi-trash3' },
      { valor: 'SOLO_SEGUIMIENTO', titulo: 'Solo seguimiento', descripcion: 'Registra la revisión y mantiene el lote bajo observación.', icono: 'bi bi-eye' },
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
  mensaje.value = ''
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
    const alerta = alertaSeleccionada.value
    const abrirReposicion = atencion.accion === 'SOLICITAR_REPOSICION'
    await atenderAlerta(alerta.idAlerta, { ...atencion })
    alertaSeleccionada.value = null
    if (abrirReposicion) {
      await router.push({
        path: '/abastecimiento',
        query: {
          nuevaCompra: '1',
          idInsumo: alerta.idInsumo,
          cantidad: alerta.cantidadSugeridaReposicion,
          origen: 'alerta',
          idAlerta: alerta.idAlerta,
          insumo: alerta.nombreInsumo,
        },
      })
      return
    }
    mensaje.value = esRetiro.value ? 'Lote retirado: el stock, el movimiento y las alertas fueron sincronizados.' : 'Seguimiento registrado con responsable y fecha.'
    await cargar()
  } catch (err) {
    errorAtencion.value = mensajeError(err, 'No se pudo registrar la atención.')
  } finally {
    procesando.value = false
  }
}

function porcentajeStock(alerta) {
  const minimo = Number(alerta.stockMinimo || 0)
  const actual = Number(alerta.stockActual || 0)
  if (minimo <= 0) return actual > 0 ? 100 : 0
  return Math.max(0, Math.min(100, (actual / minimo) * 100))
}

function textoVencimiento(alerta) {
  if (!alerta.fechaVencimiento) return 'Sin fecha de vencimiento'
  return alerta.tipo === 'LOTE_VENCIDO' ? `Venció el ${fechaCorta(alerta.fechaVencimiento)}` : `Vence el ${fechaCorta(alerta.fechaVencimiento)}`
}

function mensajeError(err, alternativo) { return err?.response?.data?.mensaje || err?.response?.data?.message || alternativo }
function etiquetaTipo(tipo) { return ({ STOCK_BAJO: 'Stock bajo', VENCIMIENTO_PROXIMO: 'Vencimiento próximo', LOTE_VENCIDO: 'Lote vencido' })[tipo] || tipo }
function etiquetaEstado(estado) { return ({ ACTIVA: 'Activa', REVISADA: 'En seguimiento', ATENDIDA: 'Atendida' })[estado] || estado }
function etiquetaAccion(accion) { return ({ SOLICITAR_REPOSICION: 'Reposición solicitada', RETIRAR_LOTE_MERMA: 'Lote retirado', SOLO_SEGUIMIENTO: 'Seguimiento' })[accion] || accion }
function iconoTipo(tipo) { return tipo === 'STOCK_BAJO' ? 'bi bi-box-seam' : tipo === 'LOTE_VENCIDO' ? 'bi bi-x-octagon' : 'bi bi-clock-history' }
function fecha(valor) { return valor ? new Date(valor).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '—' }
function fechaCorta(valor) { return valor ? new Date(`${valor}T00:00:00`).toLocaleDateString('es-PE') : '—' }
function cantidad(valor) { return Number(valor || 0).toLocaleString('es-PE', { maximumFractionDigits: 4 }) }

onMounted(cargar)
</script>
