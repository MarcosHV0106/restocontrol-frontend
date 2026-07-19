<template>
  <div class="layout">
    <SidebarComponent />
    <div class="main-content">
      <NavbarComponent />

      <main class="container-fluid p-3 p-lg-4 caja-page">
        <nav class="caja-breadcrumb" aria-label="Ruta de navegación">
          <RouterLink to="/caja">Caja</RouterLink>
          <i class="bi bi-chevron-right"></i>
          <span>{{ pedido ? `Pedido #${pedido.idPedido}` : 'Cobro' }}</span>
        </nav>

        <header class="caja-heading">
          <div class="caja-title-group">
            <span class="caja-title-icon"><i class="bi bi-wallet2"></i></span>
            <div>
            <h1>Caja · Cobro</h1>
            <p>Revisa el pedido, configura el pago y confirma la operación.</p>
            </div>
          </div>
          <button class="btn btn-outline-secondary refresh-button" :disabled="cargandoPendientes" @click="cargarPendientes">
            <span v-if="cargandoPendientes" class="spinner-border spinner-border-sm"></span>
            <i v-else class="bi bi-arrow-clockwise"></i>
            Actualizar
          </button>
        </header>

        <div v-if="errorGeneral" class="alert caja-alert alert-danger" role="alert">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <span>{{ errorGeneral }}</span>
          <button type="button" class="btn-close ms-auto" aria-label="Cerrar mensaje" @click="errorGeneral = ''"></button>
        </div>

        <section v-if="cargandoInicial" class="caja-loading" aria-live="polite">
          <div class="spinner-border" role="status"></div>
          <strong>Preparando Caja</strong>
          <span>Estamos consultando los pedidos pendientes.</span>
        </section>

        <section v-else-if="!pedido" class="pending-card">
          <div class="pending-card__header">
            <div>
              <span class="section-kicker">Pedidos por cobrar</span>
              <h2>Selecciona una cuenta</h2>
              <p>{{ textoAlcance }}</p>
            </div>
            <span class="pending-count">{{ pendientesFiltrados.length }} pendientes</span>
          </div>

          <div class="pending-toolbar">
            <label class="search-field" for="buscarCuenta">
              <i class="bi bi-search"></i>
              <input
                id="buscarCuenta"
                v-model.trim="busqueda"
                type="search"
                placeholder="Buscar por pedido, mesa o responsable"
                autocomplete="off"
              />
              <button v-if="busqueda" type="button" aria-label="Limpiar búsqueda" @click="busqueda = ''">
                <i class="bi bi-x-circle-fill"></i>
              </button>
            </label>
          </div>

          <div v-if="pendientesFiltrados.length" class="table-responsive">
            <table class="table pending-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Mesa</th>
                  <th>Responsable</th>
                  <th>Inicio</th>
                  <th>Tiempo</th>
                  <th class="text-end">Total</th>
                  <th class="text-end"><span class="visually-hidden">Acción</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cuenta in pendientesFiltrados" :key="cuenta.idPedido">
                  <td data-label="Pedido"><strong>#{{ cuenta.idPedido }}</strong></td>
                  <td data-label="Atención"><span class="table-pill"><i class="bi bi-layout-text-window-reverse"></i> {{ ubicacionPedido(cuenta) }}</span></td>
                  <td data-label="Responsable">{{ nombreUsuario(cuenta.usuario) }}</td>
                  <td data-label="Inicio" class="text-nowrap">{{ fechaCorta(cuenta.fechaPedido) }}</td>
                  <td data-label="Tiempo" class="text-nowrap text-muted">{{ tiempoTranscurrido(cuenta.fechaPedido) }}</td>
                  <td data-label="Total" class="text-end total-cell">S/ {{ moneda(cuenta.total) }}</td>
                  <td data-label="Acción" class="text-end">
                    <button class="btn btn-sm btn-primary select-order" @click="seleccionarPedido(cuenta.idPedido)">
                      Revisar y cobrar
                      <i class="bi bi-arrow-right"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="empty-state">
            <span><i class="bi bi-check2-circle"></i></span>
            <h3>{{ busqueda ? 'No encontramos coincidencias' : 'Caja al día' }}</h3>
            <p>{{ busqueda ? 'Prueba con otro número de pedido, mesa o responsable.' : 'No existen pedidos pendientes por cobrar en este momento.' }}</p>
            <button v-if="busqueda" class="btn btn-outline-secondary" @click="busqueda = ''">Limpiar búsqueda</button>
          </div>
        </section>

        <template v-else>
          <button type="button" class="back-to-list" @click="volverALista">
            <i class="bi bi-arrow-left"></i>
            Volver a pedidos pendientes
          </button>

          <section class="order-meta" aria-label="Información del pedido">
            <article>
              <span class="meta-icon"><i class="bi bi-layout-text-window-reverse"></i></span>
              <div><small>Atención</small><strong>{{ ubicacionPedido(pedido) }}</strong></div>
            </article>
            <article>
              <span class="meta-icon"><i class="bi bi-receipt"></i></span>
              <div><small>Pedido</small><strong>#{{ pedido.idPedido }}</strong></div>
            </article>
            <article>
              <span class="meta-icon"><i class="bi bi-person"></i></span>
              <div><small>Creado por</small><strong>{{ nombreUsuario(pedido.usuario) }}</strong></div>
            </article>
            <article>
              <span class="meta-icon"><i class="bi bi-clock"></i></span>
              <div><small>Hora de inicio</small><strong>{{ hora(pedido.fechaPedido) }}</strong></div>
            </article>
            <article>
              <span class="meta-icon"><i class="bi bi-stopwatch"></i></span>
              <div><small>Tiempo transcurrido</small><strong>{{ tiempoTranscurrido(pedido.fechaPedido) }}</strong></div>
            </article>
          </section>

          <div class="row g-4 align-items-start">
            <div class="col-xl-8">
              <section class="detail-card">
                <div class="card-title-row">
                  <div>
                    <span class="section-kicker">Detalle del pedido</span>
                    <h2>Productos consumidos</h2>
                  </div>
                  <span>{{ pedido.detalles?.length || 0 }} {{ pedido.detalles?.length === 1 ? 'producto' : 'productos' }}</span>
                </div>

                <div class="table-responsive">
                  <table class="table detail-table align-middle mb-0">
                    <thead>
                      <tr><th>Producto</th><th class="text-center">Cantidad</th><th class="text-end">Precio unit.</th><th class="text-end">Subtotal</th></tr>
                    </thead>
                    <tbody>
                      <tr v-for="detalle in pedido.detalles" :key="detalle.idDetalle">
                        <td>
                          <strong>{{ detalle.alimento?.nombreAlimento || 'Producto' }}</strong>
                          <small v-if="detalle.alimento?.descripcion">{{ detalle.alimento.descripcion }}</small>
                        </td>
                        <td class="text-center"><span class="quantity-badge">{{ detalle.cantidad }}</span></td>
                        <td class="text-end text-nowrap">S/ {{ moneda(detalle.precioUnitario) }}</td>
                        <td class="text-end text-nowrap fw-semibold">S/ {{ moneda(detalle.subtotal) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div v-if="pedido.observacion" class="order-note">
                  <i class="bi bi-chat-left-text"></i>
                  <div><strong>Observación del pedido</strong><p>{{ pedido.observacion }}</p></div>
                </div>

                <div class="order-totals">
                  <div><span>Subtotal</span><strong>S/ {{ moneda(subtotal) }}</strong></div>
                  <div><span>IGV (18%)</span><strong>S/ {{ moneda(igv) }}</strong></div>
                  <div v-if="descuentoNumero > 0" class="discount-line"><span>Descuento</span><strong>− S/ {{ moneda(descuentoNumero) }}</strong></div>
                </div>
              </section>
            </div>

            <div class="col-xl-4">
              <aside class="payment-card-main">
                <div class="payment-title">
                  <div>
                    <span class="section-kicker">Acción / Cobro</span>
                    <h2>Configurar pago</h2>
                  </div>
                  <i class="bi bi-shield-check" title="Operación protegida"></i>
                </div>

                <div class="amount-due">
                  <span>Total a cobrar</span>
                  <strong>S/ {{ moneda(totalCobrar) }}</strong>
                  <small v-if="descuentoNumero > 0">Total original: S/ {{ moneda(pedido.total) }}</small>
                </div>

                <label class="field-label" for="descuento">Descuento</label>
                <div class="input-with-prefix">
                  <span>S/</span>
                  <input
                    id="descuento"
                    v-model="formulario.descuento"
                    type="number"
                    min="0"
                    :max="Math.max(0, Number(pedido.total) - 0.01)"
                    step="0.01"
                    inputmode="decimal"
                    @input="alCambiarDescuento"
                  />
                </div>
                <p v-if="errorDescuento" class="field-error"><i class="bi bi-exclamation-circle"></i>{{ errorDescuento }}</p>

                <fieldset :disabled="pagosDivididos.length > 0" class="payment-fields">
                  <legend>Tipo de comprobante</legend>
                  <div class="choice-grid choice-grid--two">
                    <label :class="{ active: formulario.tipoComprobante === 'BOLETA' }">
                      <input v-model="formulario.tipoComprobante" type="radio" value="BOLETA" @change="cambiarComprobante" />
                      <i class="bi bi-receipt-cutoff"></i><span>Boleta</span>
                    </label>
                    <label :class="{ active: formulario.tipoComprobante === 'FACTURA' }">
                      <input v-model="formulario.tipoComprobante" type="radio" value="FACTURA" @change="cambiarComprobante" />
                      <i class="bi bi-file-earmark-text"></i><span>Factura</span>
                    </label>
                  </div>

                  <label class="field-label" :for="formulario.tipoComprobante === 'FACTURA' ? 'ruc' : 'dni'">
                    {{ formulario.tipoComprobante === 'FACTURA' ? 'RUC' : 'DNI (opcional)' }}
                  </label>
                  <div class="input-with-icon">
                    <i class="bi bi-person-vcard"></i>
                    <input
                      :id="formulario.tipoComprobante === 'FACTURA' ? 'ruc' : 'dni'"
                      v-model.trim="formulario.documentoCliente"
                      type="text"
                      inputmode="numeric"
                      :maxlength="formulario.tipoComprobante === 'FACTURA' ? 11 : 8"
                      :placeholder="formulario.tipoComprobante === 'FACTURA' ? 'Ingresa 11 dígitos' : 'Ingresa 8 dígitos'"
                      @input="formulario.documentoCliente = formulario.documentoCliente.replace(/\D/g, '')"
                    />
                  </div>

                  <template v-if="formulario.tipoComprobante === 'FACTURA'">
                    <label class="field-label" for="razonSocial">Razón social</label>
                    <input id="razonSocial" v-model.trim="formulario.razonSocial" class="standard-input" type="text" maxlength="150" placeholder="Nombre o razón social" />
                  </template>

                  <legend>Método de pago</legend>
                  <div class="choice-grid choice-grid--three payment-methods">
                    <label v-for="metodo in metodosPrincipales" :key="metodo.valor" :class="{ active: formulario.metodoPago === metodo.valor }">
                      <input v-model="formulario.metodoPago" type="radio" :value="metodo.valor" @change="cambiarMetodo" />
                      <i :class="metodo.icono"></i><span>{{ metodo.etiqueta }}</span>
                    </label>
                  </div>

                  <template v-if="formulario.metodoPago === 'EFECTIVO'">
                    <div class="cash-grid">
                      <label>
                        <span>Monto recibido</span>
                        <div class="input-with-prefix"><span>S/</span><input v-model="formulario.montoRecibido" type="number" min="0" step="0.01" inputmode="decimal" /></div>
                      </label>
                      <div class="change-box"><span>Vuelto</span><strong>S/ {{ moneda(vuelto) }}</strong></div>
                    </div>
                  </template>
                  <template v-else>
                    <label class="field-label" for="referencia">Referencia (opcional)</label>
                    <input id="referencia" v-model.trim="formulario.referencia" class="standard-input" type="text" maxlength="80" placeholder="N.º de operación" />
                  </template>
                </fieldset>

                <button type="button" class="split-trigger" :disabled="Boolean(errorDescuento)" @click="modalDivision = true">
                  <span><i class="bi bi-distribute-horizontal"></i><strong>{{ pagosDivididos.length ? 'Editar división de cuenta' : 'Opciones de pago / Dividir cuenta' }}</strong></span>
                  <i class="bi bi-chevron-right"></i>
                </button>

                <div v-if="pagosDivididos.length" class="split-summary">
                  <div><span><i class="bi bi-people"></i>{{ pagosDivididos.length }} pagos configurados</span><button type="button" @click="quitarDivision">Usar pago único</button></div>
                  <small>El total está distribuido entre todos los pagos.</small>
                </div>

                <p v-if="mensajeValidacion" class="field-error validation-summary" role="alert">
                  <i class="bi bi-exclamation-circle-fill"></i>{{ mensajeValidacion }}
                </p>

                <button type="button" class="confirm-payment" :disabled="!formularioValido || procesando" @click="confirmacionAbierta = true">
                  <span v-if="procesando" class="spinner-border spinner-border-sm"></span>
                  <i v-else class="bi bi-check2-circle"></i>
                  {{ procesando ? 'Procesando cobro…' : 'Revisar y confirmar pago' }}
                </button>

                <p class="security-note"><i class="bi bi-lock"></i>El pedido se cerrará y la mesa quedará disponible al confirmar.</p>
              </aside>
            </div>
          </div>
        </template>
      </main>
    </div>

    <DividirCuentaModal
      :visible="modalDivision"
      :total="totalCobrar"
      :datos-comprobante="formulario"
      @close="modalDivision = false"
      @confirm="guardarDivision"
    />

    <Teleport to="body">
      <div v-if="confirmacionAbierta" class="caja-modal-backdrop" @mousedown.self="confirmacionAbierta = false">
        <section class="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" @keydown.esc="confirmacionAbierta = false">
          <span class="confirm-icon"><i class="bi bi-shield-check"></i></span>
          <h2 id="confirm-title">Confirma los datos del cobro</h2>
          <p>Esta acción registrará el pago y cerrará el pedido <strong>#{{ pedido?.idPedido }}</strong>.</p>
          <dl>
            <div><dt>Atención</dt><dd>{{ ubicacionPedido(pedido) }}</dd></div>
            <div><dt>Total</dt><dd>S/ {{ moneda(totalCobrar) }}</dd></div>
            <div><dt>Pagos</dt><dd>{{ pagosParaEnviar.length }}</dd></div>
            <div><dt>Comprobante</dt><dd>{{ pagosParaEnviar.length > 1 ? 'Por cada pago' : etiquetaComprobante }}</dd></div>
          </dl>
          <div class="confirm-actions">
            <button class="btn btn-outline-secondary" :disabled="procesando" @click="confirmacionAbierta = false">Volver y revisar</button>
            <button class="btn btn-primary" :disabled="procesando" @click="procesarCobro">
              <span v-if="procesando" class="spinner-border spinner-border-sm"></span>
              <i v-else class="bi bi-check2"></i>
              {{ procesando ? 'Registrando…' : 'Confirmar cobro' }}
            </button>
          </div>
        </section>
      </div>

      <div v-if="cobroExitoso" class="caja-modal-backdrop success-backdrop">
        <section class="success-dialog" role="dialog" aria-modal="true" aria-labelledby="success-title">
          <div class="success-check"><i class="bi bi-check-lg"></i></div>
          <p class="section-kicker">Operación completada</p>
          <h2 id="success-title">Cobro registrado correctamente</h2>
          <p>El pedido fue cerrado correctamente{{ cobroExitoso.numeroMesa ? ' y la mesa ya está disponible' : '' }}.</p>

          <div id="comprobante-cobro" class="receipt-preview">
            <div class="receipt-brand"><strong>RestoControl</strong><span>Resumen interno de cobro</span></div>
            <div class="receipt-line"><span>Pedido</span><strong>#{{ cobroExitoso.idPedido }}</strong></div>
            <div class="receipt-line"><span>Atención</span><strong>{{ cobroExitoso.ubicacion }}</strong></div>
            <div class="receipt-line"><span>Fecha</span><strong>{{ fechaCompleta(cobroExitoso.fechaCobro) }}</strong></div>
            <div class="receipt-line"><span>Cajero</span><strong>{{ cobroExitoso.nombreCajero }}</strong></div>
            <div class="receipt-divider"></div>
            <div v-for="pago in cobroExitoso.pagos" :key="pago.idPagoCobro" class="receipt-payment">
              <div><strong>{{ pago.numeroComprobante }}</strong><span>{{ etiquetaMetodo(pago.metodoPago) }} · {{ etiquetaTipo(pago.tipoComprobante) }}</span></div>
              <strong>S/ {{ moneda(pago.monto) }}</strong>
            </div>
            <div class="receipt-divider"></div>
            <div class="receipt-line receipt-total"><span>Total cobrado</span><strong>S/ {{ moneda(cobroExitoso.totalCobrado) }}</strong></div>
            <div v-if="Number(cobroExitoso.vuelto) > 0" class="receipt-line"><span>Vuelto total</span><strong>S/ {{ moneda(cobroExitoso.vuelto) }}</strong></div>
            <small>Documento interno. No reemplaza un comprobante electrónico autorizado por SUNAT.</small>
          </div>

          <div class="success-actions">
            <button class="btn btn-outline-secondary" @click="imprimir"><i class="bi bi-printer"></i> Imprimir resumen</button>
            <button class="btn btn-primary" @click="cerrarExito">Continuar en Caja</button>
          </div>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DividirCuentaModal from '@/components/caja/DividirCuentaModal.vue'
import NavbarComponent from '@/components/NavbarComponent.vue'
import SidebarComponent from '@/components/SidebarComponent.vue'
import cobroService from '@/services/cobroService'
import { useAuthStore } from '@/stores/authStore'
import '@/assets/css/caja.css'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const pendientes = ref([])
const pedido = ref(null)
const busqueda = ref('')
const cargandoInicial = ref(true)
const cargandoPendientes = ref(false)
const procesando = ref(false)
const errorGeneral = ref('')
const mostrarErrores = ref(false)
const modalDivision = ref(false)
const confirmacionAbierta = ref(false)
const pagosDivididos = ref([])
const cobroExitoso = ref(null)
const ahora = ref(Date.now())
let temporizador = null

const formulario = reactive({
  descuento: '0.00',
  tipoComprobante: 'BOLETA',
  documentoCliente: '',
  razonSocial: '',
  metodoPago: 'EFECTIVO',
  montoRecibido: '',
  referencia: '',
})

const metodosPrincipales = [
  { valor: 'EFECTIVO', etiqueta: 'Efectivo', icono: 'bi bi-cash-stack' },
  { valor: 'TARJETA', etiqueta: 'Tarjeta', icono: 'bi bi-credit-card' },
  { valor: 'YAPE', etiqueta: 'Yape / Plin', icono: 'bi bi-phone' },
]

const rolActual = computed(() => String(authStore.usuario?.rol || '').toUpperCase())
const textoAlcance = computed(() =>
  rolActual.value === 'MESERO'
    ? 'Solo se muestran los pedidos que creaste y todavía no fueron pagados.'
    : 'Se muestran los pedidos pendientes de todo el personal.',
)

const pendientesFiltrados = computed(() => {
  const termino = busqueda.value.toLocaleLowerCase('es-PE')
  if (!termino) return pendientes.value
  return pendientes.value.filter((item) =>
    [item.idPedido, item.mesa?.numeroMesa, item.clienteNombre, item.modalidadPedido?.nombreModalidad, nombreUsuario(item.usuario)]
      .join(' ')
      .toLocaleLowerCase('es-PE')
      .includes(termino),
  )
})

const descuentoNumero = computed(() => Number(formulario.descuento || 0))
const errorDescuento = computed(() => {
  if (!Number.isFinite(descuentoNumero.value) || descuentoNumero.value < 0) return 'Ingresa un descuento válido.'
  if (pedido.value && descuentoNumero.value >= Number(pedido.value.total)) return 'El descuento debe ser menor al total.'
  return ''
})
const totalCobrar = computed(() => Math.max(0, Number(pedido.value?.total || 0) - descuentoNumero.value))
const subtotal = computed(() => totalCobrar.value / 1.18)
const igv = computed(() => totalCobrar.value - subtotal.value)
const vuelto = computed(() =>
  formulario.metodoPago === 'EFECTIVO'
    ? Math.max(0, Number(formulario.montoRecibido || 0) - totalCobrar.value)
    : 0,
)

const pagosParaEnviar = computed(() => {
  if (pagosDivididos.value.length) return pagosDivididos.value
  return [
    {
      metodoPago: formulario.metodoPago,
      monto: totalCobrar.value.toFixed(2),
      montoRecibido:
        formulario.metodoPago === 'EFECTIVO'
          ? Number(formulario.montoRecibido || 0).toFixed(2)
          : totalCobrar.value.toFixed(2),
      tipoComprobante: formulario.tipoComprobante,
      documentoCliente: formulario.documentoCliente || null,
      razonSocial: formulario.tipoComprobante === 'FACTURA' ? formulario.razonSocial || null : null,
      referencia: formulario.referencia || null,
    },
  ]
})

const mensajeValidacionBase = computed(() => {
  if (errorDescuento.value) return errorDescuento.value
  if (pagosDivididos.value.length) return ''
  if (formulario.tipoComprobante === 'FACTURA') {
    if (!/^\d{11}$/.test(formulario.documentoCliente)) return 'El RUC debe tener 11 dígitos.'
    if (!formulario.razonSocial.trim()) return 'Ingresa la razón social para emitir la factura.'
  } else if (formulario.documentoCliente && !/^\d{8}$/.test(formulario.documentoCliente)) {
    return 'El DNI debe tener 8 dígitos.'
  }
  if (formulario.metodoPago === 'EFECTIVO' && Number(formulario.montoRecibido || 0) < totalCobrar.value) {
    return 'El monto recibido es menor al total a cobrar.'
  }
  return ''
})

const mensajeValidacion = computed(() => (mostrarErrores.value ? mensajeValidacionBase.value : ''))
const formularioValido = computed(() => Boolean(pedido.value) && totalCobrar.value > 0 && !mensajeValidacionBase.value)
const etiquetaComprobante = computed(() => etiquetaTipo(formulario.tipoComprobante))

watch(totalCobrar, (total) => {
  if (!pagosDivididos.value.length && formulario.metodoPago === 'EFECTIVO') {
    formulario.montoRecibido = Number(total || 0).toFixed(2)
  }
})

watch(
  () => route.query.idPedido,
  (idPedido) => {
    if (idPedido && Number(idPedido) !== pedido.value?.idPedido) seleccionarPedido(idPedido, false)
  },
)

onMounted(async () => {
  temporizador = window.setInterval(() => (ahora.value = Date.now()), 1000)
  await cargarPendientes()
  if (route.query.idPedido) await seleccionarPedido(route.query.idPedido, false)
  cargandoInicial.value = false
})

onBeforeUnmount(() => window.clearInterval(temporizador))

async function cargarPendientes() {
  cargandoPendientes.value = true
  errorGeneral.value = ''
  try {
    pendientes.value = await cobroService.getPendientes()
  } catch (error) {
    pendientes.value = []
    errorGeneral.value = mensajeError(error, 'No se pudieron cargar los pedidos pendientes.')
  } finally {
    cargandoPendientes.value = false
  }
}

async function seleccionarPedido(idPedido, actualizarRuta = true) {
  cargandoInicial.value = true
  errorGeneral.value = ''
  try {
    pedido.value = await cobroService.getPedido(idPedido)
    reiniciarFormulario()
    if (actualizarRuta) await router.replace({ path: '/caja', query: { idPedido } })
  } catch (error) {
    pedido.value = null
    errorGeneral.value = mensajeError(error, 'No se pudo abrir el pedido para cobro.')
    await cargarPendientes()
  } finally {
    cargandoInicial.value = false
  }
}

function reiniciarFormulario() {
  formulario.descuento = '0.00'
  formulario.tipoComprobante = 'BOLETA'
  formulario.documentoCliente = ''
  formulario.razonSocial = ''
  formulario.metodoPago = 'EFECTIVO'
  formulario.montoRecibido = Number(pedido.value?.total || 0).toFixed(2)
  formulario.referencia = ''
  pagosDivididos.value = []
  mostrarErrores.value = false
}

function volverALista() {
  pedido.value = null
  pagosDivididos.value = []
  errorGeneral.value = ''
  router.replace('/caja')
}

function alCambiarDescuento() {
  mostrarErrores.value = true
  if (pagosDivididos.value.length) pagosDivididos.value = []
}

function cambiarComprobante() {
  formulario.documentoCliente = ''
  formulario.razonSocial = ''
  mostrarErrores.value = false
}

function cambiarMetodo() {
  formulario.referencia = ''
  if (formulario.metodoPago === 'EFECTIVO') formulario.montoRecibido = totalCobrar.value.toFixed(2)
}

function guardarDivision(pagos) {
  pagosDivididos.value = pagos
  modalDivision.value = false
  mostrarErrores.value = false
}

function quitarDivision() {
  pagosDivididos.value = []
  formulario.montoRecibido = totalCobrar.value.toFixed(2)
}

async function procesarCobro() {
  mostrarErrores.value = true
  if (!formularioValido.value || procesando.value) return
  procesando.value = true
  errorGeneral.value = ''
  try {
    const resultado = await cobroService.procesarCobro(pedido.value.idPedido, {
      descuento: descuentoNumero.value.toFixed(2),
      pagos: pagosParaEnviar.value,
    })
    cobroExitoso.value = { ...resultado, ubicacion: ubicacionPedido(pedido.value) }
    confirmacionAbierta.value = false
    pendientes.value = pendientes.value.filter((item) => item.idPedido !== pedido.value.idPedido)
    pedido.value = null
    await router.replace('/caja')
  } catch (error) {
    confirmacionAbierta.value = false
    errorGeneral.value = mensajeError(error, 'No se pudo registrar el cobro. Revisa los datos e inténtalo nuevamente.')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } finally {
    procesando.value = false
  }
}

function cerrarExito() {
  cobroExitoso.value = null
  cargarPendientes()
}

function imprimir() {
  window.print()
}

function mensajeError(error, mensajeAlternativo) {
  return error.response?.data?.mensaje || error.response?.data?.message || error.response?.data?.error || mensajeAlternativo
}

function nombreUsuario(usuario) {
  const nombre = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ').trim()
  return nombre || usuario?.correo || 'No disponible'
}

function ubicacionPedido(item) {
  if (!item) return '-'
  if (item.mesa?.numeroMesa !== null && item.mesa?.numeroMesa !== undefined) return `Mesa ${item.mesa.numeroMesa}`
  const modalidad = item.modalidadPedido?.nombreModalidad || 'Sin mesa'
  return item.clienteNombre ? `${modalidad} · ${item.clienteNombre}` : modalidad
}

function fechaValida(fecha) {
  const valor = fecha ? new Date(fecha) : null
  return valor && !Number.isNaN(valor.getTime()) ? valor : null
}

function fechaCorta(fecha) {
  const valor = fechaValida(fecha)
  return valor ? new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(valor) : '-'
}

function fechaCompleta(fecha) {
  const valor = fechaValida(fecha)
  return valor ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short' }).format(valor) : '-'
}

function hora(fecha) {
  const valor = fechaValida(fecha)
  return valor ? new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit' }).format(valor) : '-'
}

function tiempoTranscurrido(fecha) {
  const inicio = fechaValida(fecha)
  if (!inicio) return '-'
  const segundos = Math.max(0, Math.floor((ahora.value - inicio.getTime()) / 1000))
  const horas = Math.floor(segundos / 3600)
  const minutos = Math.floor((segundos % 3600) / 60)
  const resto = segundos % 60
  return horas > 0
    ? `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`
    : `${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`
}

function etiquetaMetodo(metodo) {
  return ({ EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', YAPE: 'Yape', PLIN: 'Plin', TRANSFERENCIA: 'Transferencia' })[metodo] || metodo
}

function etiquetaTipo(tipo) {
  return tipo === 'FACTURA' ? 'Factura' : 'Boleta'
}

function moneda(valor) {
  return Number(valor || 0).toFixed(2)
}
</script>
