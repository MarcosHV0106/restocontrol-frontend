<template>
  <div class="layout management-layout">
    <SidebarComponent />
    <div class="main-content">
      <NavbarComponent />
      <main class="management-page supply-page">
        <header class="management-heading">
          <div class="management-title-group">
            <span class="management-title-icon"><i class="bi bi-truck"></i></span>
            <div>
              <h1>Abastecimiento</h1>
              <p>Registra proveedores y compras que alimentan los lotes del inventario.</p>
            </div>
          </div>
          <span class="management-count"><i class="bi bi-link-45deg"></i>Compra → lote → stock → alertas</span>
        </header>

        <section class="management-summary" aria-label="Resumen de abastecimiento">
          <article><i class="bi bi-buildings"></i><div><span>Proveedores activos</span><strong>{{ proveedoresActivos.length }}</strong></div></article>
          <article><i class="bi bi-receipt-cutoff"></i><div><span>Compras registradas</span><strong>{{ compras.length }}</strong></div></article>
          <article><i class="bi bi-box-seam"></i><div><span>Lotes abastecidos</span><strong>{{ lotesRegistrados }}</strong></div></article>
          <article><i class="bi bi-cash-stack"></i><div><span>Inversión registrada</span><strong>S/ {{ moneda(totalCompras) }}</strong></div></article>
        </section>

        <div v-if="mensaje" class="supply-message supply-success" role="status">
          <i class="bi bi-check-circle-fill"></i><span>{{ mensaje }}</span>
          <button v-if="origenEstimacion" type="button" @click="volverAEstimacion"><i class="bi bi-arrow-return-left"></i>Volver a estimación</button>
        </div>
        <div v-if="error" class="supply-message supply-error" role="alert"><i class="bi bi-exclamation-triangle-fill"></i>{{ error }}</div>
        <p v-if="origenEstimacion && !mensaje" class="supply-origin"><i class="bi bi-calendar2-check"></i>Reposición originada por la estimación del {{ fecha(fechaEstimacionOrigen) }}. La cantidad faltante ya está precargada.</p>

        <div class="tabs-container management-tabs supply-tabs">
          <button type="button" class="btn" :class="{ active: tabActual === 'compras' }" @click="cambiarTab('compras')">Compras y lotes</button>
          <button type="button" class="btn" :class="{ active: tabActual === 'proveedores' }" @click="cambiarTab('proveedores')">Proveedores</button>
        </div>

        <template v-if="tabActual === 'compras'">
          <section class="management-toolbar">
            <div class="input-group management-search">
              <span class="input-group-text bg-transparent border-0"><i class="bi bi-search"></i></span>
              <input v-model.trim="busquedaCompra" type="search" class="form-control border-0 bg-transparent" placeholder="Documento, proveedor, insumo o responsable...">
            </div>
            <button type="button" class="btn btn-brand management-primary" :disabled="!proveedoresActivos.length || !insumos.length" @click="abrirCompra">
              <i class="bi bi-cart-plus"></i>Nueva compra
            </button>
          </section>

          <p v-if="!proveedoresActivos.length" class="supply-hint"><i class="bi bi-info-circle"></i>Registra y activa un proveedor antes de crear una compra.</p>

          <section class="custom-table-card management-table-card">
            <div v-if="cargando" class="supply-loading"><span class="spinner-border spinner-border-sm"></span>Cargando abastecimiento...</div>
            <div v-else class="table-responsive">
              <table class="table align-middle mb-0 supply-table">
                <thead><tr><th>Documento</th><th>Proveedor</th><th>Fecha</th><th>Insumos</th><th>Responsable</th><th class="text-end">Total</th><th class="text-end">Detalle</th></tr></thead>
                <tbody>
                  <tr v-for="compra in comprasFiltradas" :key="compra.idCompra">
                    <td data-label="Documento"><strong>{{ compra.numeroDocumento }}</strong><small>#{{ compra.idCompra }}</small></td>
                    <td data-label="Proveedor"><span class="supply-provider"><i class="bi bi-building"></i><span><strong>{{ compra.proveedor }}</strong><small>RUC {{ compra.rucProveedor }}</small></span></span></td>
                    <td data-label="Fecha">{{ fecha(compra.fechaCompra) }}</td>
                    <td data-label="Insumos"><span class="supply-badge">{{ compra.detalles.length }} {{ compra.detalles.length === 1 ? 'insumo' : 'insumos' }}</span></td>
                    <td data-label="Responsable">{{ compra.responsable }}</td>
                    <td data-label="Total" class="text-end fw-bold">S/ {{ moneda(compra.total) }}</td>
                    <td data-label="Detalle" class="text-end"><button type="button" class="btn btn-sm text-muted" title="Ver detalle" @click="compraDetalle = compra"><i class="bi bi-eye"></i></button></td>
                  </tr>
                  <tr v-if="!comprasFiltradas.length"><td colspan="7" class="management-empty"><i class="bi bi-cart-x"></i><strong>No hay compras con este filtro</strong><span>Los abastecimientos registrados aparecerán aquí.</span></td></tr>
                </tbody>
              </table>
            </div>
          </section>
        </template>

        <template v-else>
          <section class="management-toolbar">
            <div class="input-group management-search">
              <span class="input-group-text bg-transparent border-0"><i class="bi bi-search"></i></span>
              <input v-model.trim="busquedaProveedor" type="search" class="form-control border-0 bg-transparent" placeholder="Razón social, RUC o contacto...">
            </div>
            <button type="button" class="btn btn-brand management-primary" @click="abrirProveedor()"><i class="bi bi-plus-lg"></i>Nuevo proveedor</button>
          </section>

          <section class="custom-table-card management-table-card">
            <div class="table-responsive">
              <table class="table align-middle mb-0 supply-table">
                <thead><tr><th>Proveedor</th><th>RUC</th><th>Contacto</th><th>Teléfono</th><th>Estado</th><th class="text-end">Acciones</th></tr></thead>
                <tbody>
                  <tr v-for="proveedor in proveedoresFiltrados" :key="proveedor.idProveedor" :class="{ 'supply-inactive': !proveedor.activo }">
                    <td data-label="Proveedor"><strong>{{ proveedor.razonSocial }}</strong><small>{{ proveedor.correo || 'Sin correo registrado' }}</small></td>
                    <td data-label="RUC"><code>{{ proveedor.ruc }}</code></td>
                    <td data-label="Contacto">{{ proveedor.contacto || '—' }}</td>
                    <td data-label="Teléfono">{{ proveedor.telefono || '—' }}</td>
                    <td data-label="Estado"><span class="supply-status" :class="proveedor.activo ? 'status-active' : 'status-inactive'">{{ proveedor.activo ? 'Activo' : 'Inactivo' }}</span></td>
                    <td data-label="Acciones" class="text-end">
                      <button type="button" class="btn btn-sm text-muted me-1" title="Editar proveedor" @click="abrirProveedor(proveedor)"><i class="bi bi-pencil"></i></button>
                      <button type="button" class="btn btn-sm text-muted" :title="proveedor.activo ? 'Desactivar proveedor' : 'Activar proveedor'" @click="cambiarEstadoProveedor(proveedor)"><i :class="proveedor.activo ? 'bi bi-pause-circle' : 'bi bi-play-circle'"></i></button>
                    </td>
                  </tr>
                  <tr v-if="!proveedoresFiltrados.length"><td colspan="6" class="management-empty"><i class="bi bi-building-x"></i><strong>No hay proveedores con este filtro</strong><span>Registra al primer proveedor para iniciar el abastecimiento.</span></td></tr>
                </tbody>
              </table>
            </div>
          </section>
        </template>
      </main>
    </div>

    <div v-if="modalProveedor" class="supply-backdrop" @click.self="cerrarProveedor">
      <section class="supply-dialog provider-dialog" role="dialog" aria-modal="true" aria-labelledby="provider-title">
        <header><div><small>PROVEEDORES</small><h2 id="provider-title">{{ proveedorForm.idProveedor ? 'Editar proveedor' : 'Nuevo proveedor' }}</h2></div><button type="button" aria-label="Cerrar" @click="cerrarProveedor"><i class="bi bi-x-lg"></i></button></header>
        <div class="supply-dialog-body supply-form-grid">
          <label class="wide">Razón social<input v-model.trim="proveedorForm.razonSocial" maxlength="150" type="text"></label>
          <label>RUC<input v-model.trim="proveedorForm.ruc" maxlength="11" inputmode="numeric" type="text"></label>
          <label>Persona de contacto<input v-model.trim="proveedorForm.contacto" maxlength="120" type="text"></label>
          <label>Teléfono<input v-model.trim="proveedorForm.telefono" maxlength="20" type="tel"></label>
          <label>Correo<input v-model.trim="proveedorForm.correo" maxlength="120" type="email"></label>
          <label class="wide">Dirección<input v-model.trim="proveedorForm.direccion" maxlength="250" type="text"></label>
          <label class="supply-switch wide"><input v-model="proveedorForm.activo" type="checkbox"><span>Proveedor habilitado para nuevas compras</span></label>
          <p v-if="errorModal" class="supply-modal-error wide">{{ errorModal }}</p>
        </div>
        <footer><button type="button" class="btn btn-outline-secondary" :disabled="guardando" @click="cerrarProveedor">Cancelar</button><button type="button" class="btn btn-brand" :disabled="guardando" @click="guardarProveedor"><span v-if="guardando" class="spinner-border spinner-border-sm"></span>{{ guardando ? 'Guardando...' : 'Guardar proveedor' }}</button></footer>
      </section>
    </div>

    <div v-if="modalCompra" class="supply-backdrop" @click.self="cerrarCompra">
      <section class="supply-dialog purchase-dialog" role="dialog" aria-modal="true" aria-labelledby="purchase-title">
        <header><div><small>ABASTECIMIENTO DE INVENTARIO</small><h2 id="purchase-title">Registrar compra</h2><p>Cada línea generará un lote y un movimiento de ingreso.</p></div><button type="button" aria-label="Cerrar" @click="cerrarCompra"><i class="bi bi-x-lg"></i></button></header>
        <div class="supply-dialog-body">
          <div class="supply-form-grid purchase-header-fields">
            <label>Proveedor<select v-model.number="compraForm.idProveedor"><option :value="null" disabled>Selecciona...</option><option v-for="proveedor in proveedoresActivos" :key="proveedor.idProveedor" :value="proveedor.idProveedor">{{ proveedor.razonSocial }}</option></select></label>
            <label>Documento<input v-model.trim="compraForm.numeroDocumento" maxlength="60" placeholder="Factura o guía" type="text"></label>
            <label>Fecha de compra<input v-model="compraForm.fechaCompra" :max="hoy" type="date"></label>
            <label class="wide">Observación<input v-model.trim="compraForm.observacion" maxlength="250" placeholder="Información adicional (opcional)" type="text"></label>
          </div>

          <div class="purchase-lines-heading"><div><strong>Insumos recibidos</strong><small>Indica cantidad, costo y vencimiento de cada lote.</small></div><button type="button" class="btn btn-sm btn-outline-primary" @click="agregarLinea"><i class="bi bi-plus"></i>Agregar insumo</button></div>
          <div class="purchase-lines">
            <article v-for="(linea, indice) in compraForm.detalles" :key="linea.clave" class="purchase-line">
              <span class="line-number">{{ indice + 1 }}</span>
              <label class="line-product">Insumo<select v-model.number="linea.idInsumo"><option :value="null" disabled>Selecciona...</option><option v-for="insumo in insumosDisponibles(linea.idInsumo)" :key="insumo.idInsumo" :value="insumo.idInsumo">{{ insumo.nombreInsumo }} · {{ insumo.unidadMedida }}</option></select></label>
              <label>Cantidad<input v-model.number="linea.cantidad" min="0.0001" step="0.0001" type="number"></label>
              <label>Costo unitario<input v-model.number="linea.costoUnitario" min="0.0001" step="0.0001" type="number"></label>
              <label>Vencimiento<input v-model="linea.fechaVencimiento" :min="hoy" type="date"></label>
              <strong class="line-subtotal">S/ {{ moneda(subtotalLinea(linea)) }}</strong>
              <button type="button" class="line-remove" aria-label="Quitar insumo" :disabled="compraForm.detalles.length === 1" @click="quitarLinea(indice)"><i class="bi bi-trash3"></i></button>
            </article>
          </div>
          <div class="purchase-total"><span>Total de compra</span><strong>S/ {{ moneda(totalFormulario) }}</strong></div>
          <p v-if="errorModal" class="supply-modal-error">{{ errorModal }}</p>
        </div>
        <footer><button type="button" class="btn btn-outline-secondary" :disabled="guardando" @click="cerrarCompra">Cancelar</button><button type="button" class="btn btn-brand" :disabled="guardando" @click="guardarCompra"><span v-if="guardando" class="spinner-border spinner-border-sm"></span>{{ guardando ? 'Registrando...' : 'Registrar compra e ingresar lotes' }}</button></footer>
      </section>
    </div>

    <div v-if="compraDetalle" class="supply-backdrop" @click.self="compraDetalle = null">
      <section class="supply-dialog detail-dialog" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <header><div><small>{{ compraDetalle.numeroDocumento }}</small><h2 id="detail-title">{{ compraDetalle.proveedor }}</h2><p>{{ fecha(compraDetalle.fechaCompra) }} · {{ compraDetalle.responsable }}</p></div><button type="button" aria-label="Cerrar" @click="compraDetalle = null"><i class="bi bi-x-lg"></i></button></header>
        <div class="supply-dialog-body"><div class="detail-lines"><article v-for="detalle in compraDetalle.detalles" :key="detalle.idCompraDetalle"><span><i class="bi bi-box-seam"></i></span><div><strong>{{ detalle.insumo }}</strong><small>Lote {{ detalle.codigoLote }} · vence {{ fecha(detalle.fechaVencimiento) }}</small></div><div class="detail-amount"><strong>{{ cantidad(detalle.cantidad) }} {{ detalle.unidadMedida }}</strong><small>S/ {{ moneda(detalle.subtotal) }}</small></div></article></div><p v-if="compraDetalle.observacion" class="detail-note"><i class="bi bi-chat-left-text"></i>{{ compraDetalle.observacion }}</p></div>
        <footer><span>Total registrado: <strong>S/ {{ moneda(compraDetalle.total) }}</strong></span><button type="button" class="btn btn-brand" @click="compraDetalle = null">Cerrar</button></footer>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavbarComponent from '@/components/NavbarComponent.vue'
import SidebarComponent from '@/components/SidebarComponent.vue'
import { actualizarProveedor, crearProveedor, obtenerCompras, obtenerProveedores, registrarCompra } from '@/services/abastecimientoService'
import { obtenerInsumos } from '@/services/insumoService'
import '@/assets/css/management.css'

const route = useRoute()
const router = useRouter()
const proveedores = ref([])
const compras = ref([])
const insumos = ref([])
const cargando = ref(false)
const guardando = ref(false)
const error = ref('')
const mensaje = ref('')
const errorModal = ref('')
const busquedaCompra = ref('')
const busquedaProveedor = ref('')
const tabActual = ref(route.query.tab === 'proveedores' ? 'proveedores' : 'compras')
const modalProveedor = ref(false)
const modalCompra = ref(false)
const compraDetalle = ref(null)
const proveedorForm = reactive(proveedorVacio())
const compraForm = reactive(compraVacia())
const hoy = fechaLocal(new Date())
let secuenciaLinea = 0

const proveedoresActivos = computed(() => proveedores.value.filter(item => item.activo))
const origenEstimacion = computed(() => route.query.origen === 'estimacion' && Boolean(route.query.fecha))
const fechaEstimacionOrigen = computed(() => String(route.query.fecha || ''))
const lotesRegistrados = computed(() => compras.value.reduce((total, compra) => total + compra.detalles.length, 0))
const totalCompras = computed(() => compras.value.reduce((total, compra) => total + Number(compra.total || 0), 0))
const totalFormulario = computed(() => compraForm.detalles.reduce((total, linea) => total + subtotalLinea(linea), 0))
const comprasFiltradas = computed(() => {
  const termino = busquedaCompra.value.toLowerCase()
  if (!termino) return compras.value
  return compras.value.filter(compra => [compra.numeroDocumento, compra.proveedor, compra.rucProveedor, compra.responsable, ...compra.detalles.map(detalle => detalle.insumo)].join(' ').toLowerCase().includes(termino))
})
const proveedoresFiltrados = computed(() => {
  const termino = busquedaProveedor.value.toLowerCase()
  if (!termino) return proveedores.value
  return proveedores.value.filter(item => [item.razonSocial, item.ruc, item.contacto, item.correo].filter(Boolean).join(' ').toLowerCase().includes(termino))
})

onMounted(async () => {
  await cargarDatos()
  if (route.query.nuevaCompra === '1' || route.query.idInsumo) {
    abrirCompra(Number(route.query.idInsumo) || null, numeroPositivo(route.query.cantidad))
  }
})

async function cargarDatos() {
  cargando.value = true
  error.value = ''
  try {
    const [listaProveedores, listaCompras, listaInsumos] = await Promise.all([obtenerProveedores(), obtenerCompras(), obtenerInsumos()])
    proveedores.value = listaProveedores
    compras.value = listaCompras
    insumos.value = listaInsumos
  } catch (err) {
    error.value = mensajeError(err, 'No se pudo cargar la información de abastecimiento.')
  } finally {
    cargando.value = false
  }
}

function cambiarTab(tab) {
  tabActual.value = tab
  router.replace({ path: '/abastecimiento', query: tab === 'proveedores' ? { tab } : {} })
}

function proveedorVacio() { return { idProveedor: null, razonSocial: '', ruc: '', contacto: '', telefono: '', correo: '', direccion: '', activo: true } }
function compraVacia() { return { idProveedor: null, fechaCompra: fechaLocal(new Date()), numeroDocumento: '', observacion: '', detalles: [] } }
function lineaVacia(idInsumo = null, cantidadInicial = null) { return { clave: ++secuenciaLinea, idInsumo, cantidad: cantidadInicial, costoUnitario: costoInsumo(idInsumo), fechaVencimiento: '' } }

function abrirProveedor(proveedor = null) {
  Object.assign(proveedorForm, proveedorVacio(), proveedor || {})
  errorModal.value = ''
  modalProveedor.value = true
}
function cerrarProveedor() { if (!guardando.value) modalProveedor.value = false }

async function guardarProveedor() {
  if (!proveedorForm.razonSocial || !/^\d{11}$/.test(proveedorForm.ruc)) {
    errorModal.value = 'Completa la razón social y un RUC válido de 11 dígitos.'
    return
  }
  guardando.value = true
  errorModal.value = ''
  try {
    if (proveedorForm.idProveedor) await actualizarProveedor(proveedorForm.idProveedor, { ...proveedorForm })
    else await crearProveedor({ ...proveedorForm })
    modalProveedor.value = false
    mensaje.value = proveedorForm.idProveedor ? 'Proveedor actualizado correctamente.' : 'Proveedor registrado correctamente.'
    proveedores.value = await obtenerProveedores()
  } catch (err) {
    errorModal.value = mensajeError(err, 'No se pudo guardar el proveedor.')
  } finally {
    guardando.value = false
  }
}

async function cambiarEstadoProveedor(proveedor) {
  error.value = ''
  try {
    await actualizarProveedor(proveedor.idProveedor, { ...proveedor, activo: !proveedor.activo })
    proveedores.value = await obtenerProveedores()
    mensaje.value = `Proveedor ${proveedor.activo ? 'desactivado' : 'activado'} correctamente.`
  } catch (err) {
    error.value = mensajeError(err, 'No se pudo cambiar el estado del proveedor.')
  }
}

function abrirCompra(idInsumo = null, cantidadInicial = null) {
  Object.assign(compraForm, compraVacia())
  compraForm.idProveedor = proveedoresActivos.value[0]?.idProveedor || null
  compraForm.observacion = origenEstimacion.value
    ? `Reposición para la estimación del ${fechaEstimacionOrigen.value}`
    : ''
  compraForm.detalles = [lineaVacia(idInsumo, cantidadInicial)]
  errorModal.value = ''
  modalCompra.value = true
}
function cerrarCompra() { if (!guardando.value) modalCompra.value = false }
function agregarLinea() { compraForm.detalles.push(lineaVacia()) }
function quitarLinea(indice) { if (compraForm.detalles.length > 1) compraForm.detalles.splice(indice, 1) }
function costoInsumo(idInsumo) { return Number(insumos.value.find(item => item.idInsumo === idInsumo)?.costoUnitario || 0) || null }
function insumosDisponibles(actual) {
  const usados = new Set(compraForm.detalles.map(linea => linea.idInsumo).filter(id => id && id !== actual))
  return insumos.value.filter(insumo => !usados.has(insumo.idInsumo))
}
function subtotalLinea(linea) { return Number(linea.cantidad || 0) * Number(linea.costoUnitario || 0) }

async function guardarCompra() {
  const errorValidacion = validarCompra()
  if (errorValidacion) { errorModal.value = errorValidacion; return }
  guardando.value = true
  errorModal.value = ''
  try {
    await registrarCompra({ idProveedor: compraForm.idProveedor, fechaCompra: compraForm.fechaCompra, numeroDocumento: compraForm.numeroDocumento, observacion: compraForm.observacion, detalles: compraForm.detalles.map(({ idInsumo, cantidad, costoUnitario, fechaVencimiento }) => ({ idInsumo, cantidad, costoUnitario, fechaVencimiento })) })
    modalCompra.value = false
    mensaje.value = 'Compra registrada: los lotes, el stock y las alertas fueron sincronizados.'
    await cargarDatos()
    await router.replace({
      path: '/abastecimiento',
      query: origenEstimacion.value
        ? { origen: 'estimacion', fecha: fechaEstimacionOrigen.value }
        : {}
    })
  } catch (err) {
    errorModal.value = mensajeError(err, 'No se pudo registrar la compra.')
  } finally {
    guardando.value = false
  }
}

function volverAEstimacion() {
  router.push({ path: '/menu', query: { tab: 'estimacion', fecha: fechaEstimacionOrigen.value } })
}

function validarCompra() {
  if (!compraForm.idProveedor) return 'Selecciona un proveedor activo.'
  if (!compraForm.numeroDocumento.trim()) return 'Ingresa el número de documento.'
  if (!compraForm.fechaCompra) return 'Selecciona la fecha de compra.'
  if (compraForm.detalles.some(linea => !linea.idInsumo || Number(linea.cantidad) <= 0 || Number(linea.costoUnitario) <= 0 || !linea.fechaVencimiento)) return 'Completa insumo, cantidad, costo y vencimiento en todas las líneas.'
  if (new Set(compraForm.detalles.map(linea => linea.idInsumo)).size !== compraForm.detalles.length) return 'No repitas un insumo en la misma compra.'
  return null
}

function fechaLocal(valor) { const fecha = new Date(valor); return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}` }
function numeroPositivo(valor) { const numero = Number(valor); return Number.isFinite(numero) && numero > 0 ? numero : null }
function fecha(valor) { if (!valor) return '—'; return new Date(`${valor}T00:00:00`).toLocaleDateString('es-PE') }
function moneda(valor) { return Number(valor || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function cantidad(valor) { return Number(valor || 0).toLocaleString('es-PE', { maximumFractionDigits: 4 }) }
function mensajeError(err, alternativo) { return err?.response?.data?.mensaje || err?.response?.data?.message || alternativo }
</script>

<style scoped>
.supply-tabs { display: flex; max-width: 410px; }
.supply-tabs .btn { flex: 1; }
.supply-message { align-items: center; border: 1px solid; border-radius: 9px; display: flex; font-size: .72rem; gap: .45rem; margin-bottom: .8rem; padding: .65rem .75rem; }
.supply-message > span { flex: 1; }
.supply-message button { align-items: center; background: transparent; border: 1px solid currentColor; border-radius: 7px; color: inherit; display: inline-flex; flex: 0 0 auto; font-size: .62rem; font-weight: 750; gap: .3rem; padding: .32rem .5rem; }
.supply-success { background: var(--rc-success-soft); border-color: #b9dec8; color: var(--rc-success); }
.supply-error, .supply-modal-error { color: var(--rc-danger); }
.supply-error { background: var(--rc-danger-soft); border-color: #edc4c0; }
.supply-hint { background: var(--rc-warning-soft); border: 1px solid #ead5aa; border-radius: 9px; color: #8a651f; font-size: .7rem; margin: 0 0 .8rem; padding: .6rem .7rem; }
.supply-origin { align-items: center; background: var(--rc-info-soft); border: 1px solid #bfdbe8; border-radius: 9px; color: var(--rc-info); display: flex; font-size: .7rem; gap: .45rem; margin: 0 0 .8rem; padding: .6rem .7rem; }
.supply-loading { align-items: center; color: var(--rc-muted); display: flex; gap: .5rem; justify-content: center; min-height: 240px; }
.supply-table td > strong, .supply-table td > small { display: block; }
.supply-table td > small, .supply-provider small { color: var(--rc-muted); font-size: .6rem; }
.supply-provider { align-items: center; display: flex; gap: .5rem; }
.supply-provider > i { align-items: center; background: var(--rc-primary-soft); border-radius: 8px; color: var(--rc-primary-hover); display: flex; height: 31px; justify-content: center; width: 31px; }
.supply-provider strong, .supply-provider small { display: block; }
.supply-badge, .supply-status { border-radius: 999px; display: inline-flex; font-size: .62rem; font-weight: 750; padding: .28rem .52rem; }
.supply-badge { background: var(--rc-info-soft); color: var(--rc-info); }
.status-active { background: var(--rc-success-soft); color: var(--rc-success); }
.status-inactive { background: #eee9e6; color: #776b65; }
.supply-inactive { opacity: .66; }
.supply-table code { background: #f3efec; border-radius: 6px; color: var(--rc-ink-soft); padding: .2rem .4rem; }
.supply-backdrop { align-items: center; background: rgba(39,30,26,.66); display: flex; inset: 0; justify-content: center; padding: 1rem; position: fixed; z-index: 1100; }
.supply-dialog { background: var(--rc-surface); border: 1px solid var(--rc-border); border-radius: 15px; box-shadow: 0 24px 75px rgba(27,19,15,.28); max-height: 94vh; overflow-y: auto; width: min(680px, 100%); }
.purchase-dialog { width: min(1100px, 100%); }
.detail-dialog { width: min(720px, 100%); }
.supply-dialog > header { align-items: flex-start; border-bottom: 1px solid var(--rc-border); display: flex; justify-content: space-between; padding: 1rem 1.1rem; }
.supply-dialog header small { color: var(--rc-primary-hover); font-size: .62rem; font-weight: 780; letter-spacing: .07em; }
.supply-dialog h2 { color: var(--rc-ink); font-size: 1.1rem; margin: .08rem 0; }
.supply-dialog header p { color: var(--rc-muted); font-size: .68rem; margin: 0; }
.supply-dialog header button, .line-remove { background: transparent; border: 0; color: var(--rc-muted); }
.supply-dialog-body { padding: 1rem 1.1rem; }
.supply-form-grid { display: grid; gap: .75rem; grid-template-columns: 1fr 1fr; }
.supply-form-grid label, .purchase-line label { color: var(--rc-ink-soft); font-size: .66rem; font-weight: 720; }
.supply-form-grid input, .supply-form-grid select, .purchase-line input, .purchase-line select { background: var(--rc-surface); border: 1px solid var(--rc-border-strong); border-radius: 8px; color: var(--rc-ink); display: block; font-size: .73rem; margin-top: .3rem; min-height: 39px; padding: .5rem .6rem; width: 100%; }
.wide { grid-column: 1 / -1; }
.supply-switch { align-items: center; display: flex; gap: .5rem; }
.supply-switch input { accent-color: var(--rc-primary); margin: 0; min-height: auto; width: auto; }
.supply-dialog footer { align-items: center; background: #fcfaf8; border-top: 1px solid var(--rc-border); display: flex; gap: .55rem; justify-content: flex-end; padding: .75rem 1.1rem; }
.supply-dialog footer .btn { font-size: .72rem; min-height: 40px; }
.purchase-header-fields { grid-template-columns: 1.25fr 1fr 1fr; }
.purchase-lines-heading { align-items: center; display: flex; justify-content: space-between; margin: 1rem 0 .55rem; }
.purchase-lines-heading strong, .purchase-lines-heading small { display: block; }
.purchase-lines-heading strong { color: var(--rc-ink); font-size: .78rem; }
.purchase-lines-heading small { color: var(--rc-muted); font-size: .62rem; }
.purchase-line { align-items: end; background: #fbf9f7; border: 1px solid var(--rc-border); border-radius: 10px; display: grid; gap: .55rem; grid-template-columns: 26px minmax(180px,1.5fr) repeat(3,minmax(105px,1fr)) 90px 28px; margin-bottom: .5rem; padding: .65rem; }
.line-number { align-items: center; align-self: center; background: var(--rc-primary-soft); border-radius: 7px; color: var(--rc-primary-hover); display: flex; font-size: .65rem; font-weight: 800; height: 26px; justify-content: center; width: 26px; }
.line-subtotal { align-self: center; color: var(--rc-ink); font-size: .74rem; text-align: right; }
.line-remove { align-self: center; color: var(--rc-danger); }
.line-remove:disabled { opacity: .3; }
.purchase-total { align-items: center; border-top: 1px solid var(--rc-border); display: flex; justify-content: flex-end; gap: .8rem; margin-top: .8rem; padding-top: .8rem; }
.purchase-total span { color: var(--rc-muted); font-size: .7rem; }
.purchase-total strong { color: var(--rc-primary-hover); font-size: 1.05rem; }
.supply-modal-error { font-size: .7rem; margin: .7rem 0 0; }
.detail-lines { display: grid; gap: .55rem; }
.detail-lines article { align-items: center; background: #fbf9f7; border: 1px solid var(--rc-border); border-radius: 9px; display: grid; gap: .6rem; grid-template-columns: 34px 1fr auto; padding: .65rem; }
.detail-lines article > span { align-items: center; background: var(--rc-primary-soft); border-radius: 8px; color: var(--rc-primary-hover); display: flex; height: 34px; justify-content: center; }
.detail-lines strong, .detail-lines small { display: block; }
.detail-lines strong { color: var(--rc-ink); font-size: .73rem; }
.detail-lines small { color: var(--rc-muted); font-size: .61rem; }
.detail-amount { text-align: right; }
.detail-note { background: var(--rc-info-soft); border-radius: 8px; color: var(--rc-info); font-size: .67rem; margin: .75rem 0 0; padding: .6rem; }
.detail-note i { margin-right: .4rem; }
body.dark-theme .supply-table code, body.dark-theme .status-inactive { background: #393635; }
body.dark-theme .supply-dialog footer, body.dark-theme .purchase-line, body.dark-theme .detail-lines article { background: #29292a; }
body.dark-theme .supply-hint { background: #3d3525; border-color: #5b4b2e; color: #e2c27e; }
body.dark-theme .supply-origin { background: #26363d; border-color: #3d5965; color: #aed1df; }
@media (max-width: 900px) { .purchase-line { grid-template-columns: 26px 1fr 1fr; } .line-product { grid-column: 2 / -1; } .line-subtotal { text-align: left; } .purchase-header-fields { grid-template-columns: 1fr 1fr; } }
@media (max-width: 650px) { .supply-tabs { max-width: none; } .supply-message { align-items: stretch; flex-wrap: wrap; } .supply-message button { justify-content: center; width: 100%; } .supply-form-grid, .purchase-header-fields { grid-template-columns: 1fr; } .wide { grid-column: auto; } .purchase-line { grid-template-columns: 24px 1fr; } .line-product { grid-column: 2; } .line-subtotal { grid-column: 2; } .line-remove { grid-column: 1; grid-row: 2; } .supply-dialog footer { align-items: stretch; flex-direction: column-reverse; } .supply-dialog footer .btn { width: 100%; } }
</style>
