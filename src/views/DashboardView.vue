<template>
  <div class="layout">
    <SidebarComponent />

    <div class="main-content dashboard-main">
      <NavbarComponent />

      <main class="dashboard-page">
        <nav class="dashboard-breadcrumb" aria-label="Ruta de navegación">
          <span>Inicio</span><i class="bi bi-chevron-right"></i><strong>Dashboard</strong>
        </nav>

        <header class="dashboard-heading">
          <div>
            <div class="dashboard-title-row">
              <span class="dashboard-title-icon"><i class="bi bi-grid-1x2-fill"></i></span>
              <div>
                <h1>Dashboard ejecutivo</h1>
                <p>Indicadores clave y análisis integral del restaurante.</p>
              </div>
            </div>
          </div>

          <div class="dashboard-heading-actions">
            <span class="period-badge"><i class="bi bi-calendar3"></i>{{ periodoTexto }}</span>
            <RouterLink to="/reportes" class="btn dashboard-secondary-button">
              <i class="bi bi-bar-chart-line"></i>Ver reportes
            </RouterLink>
            <button class="btn dashboard-refresh-button" :disabled="actualizando" @click="actualizarDashboard">
              <span v-if="actualizando" class="spinner-border spinner-border-sm"></span>
              <i v-else class="bi bi-arrow-clockwise"></i>
              {{ actualizando ? 'Actualizando…' : 'Actualizar' }}
            </button>
          </div>
        </header>

        <div v-if="errorMetricas" class="dashboard-warning" role="status">
          <i class="bi bi-info-circle"></i>
          <span>{{ errorMetricas }} El informe ejecutivo continúa disponible.</span>
          <button type="button" @click="cargarMetricas">Reintentar</button>
        </div>

        <section class="dashboard-kpis" aria-label="Indicadores del mes">
          <article class="dashboard-kpi">
            <span class="kpi-icon kpi-sales"><i class="bi bi-cash-stack"></i></span>
            <div>
              <small>Ventas del mes</small>
              <strong v-if="!cargandoMetricas">S/ {{ moneda(metricas.ventasBrutasTotales) }}</strong>
              <span v-else class="metric-skeleton"></span>
              <p><i class="bi bi-calendar-check"></i>Del {{ diaInicioMes }} al {{ diaActual }}</p>
            </div>
          </article>

          <article class="dashboard-kpi">
            <span class="kpi-icon kpi-orders"><i class="bi bi-receipt-cutoff"></i></span>
            <div>
              <small>Tickets emitidos</small>
              <strong v-if="!cargandoMetricas">{{ numero(metricas.totalTickets) }}</strong>
              <span v-else class="metric-skeleton"></span>
              <p><i class="bi bi-check2-circle"></i>Pedidos pagados</p>
            </div>
          </article>

          <article class="dashboard-kpi">
            <span class="kpi-icon kpi-ticket"><i class="bi bi-graph-up-arrow"></i></span>
            <div>
              <small>Ticket promedio</small>
              <strong v-if="!cargandoMetricas">S/ {{ moneda(metricas.ticketPromedio) }}</strong>
              <span v-else class="metric-skeleton"></span>
              <p><i class="bi bi-calculator"></i>Promedio por pedido</p>
            </div>
          </article>

          <article class="dashboard-kpi">
            <span class="kpi-icon kpi-payment"><i :class="metodoPrincipal.icono"></i></span>
            <div>
              <small>Método más utilizado</small>
              <strong v-if="!cargandoMetricas" class="method-value">{{ metodoPrincipal.nombre }}</strong>
              <span v-else class="metric-skeleton"></span>
              <p v-if="!cargandoMetricas"><i class="bi bi-pie-chart"></i>{{ metodoPrincipal.detalle }}</p>
              <p v-else><i class="bi bi-hourglass-split"></i>Consultando distribución</p>
            </div>
          </article>
        </section>

        <section ref="panelInforme" class="dashboard-report-card" aria-labelledby="business-intelligence-title">
          <header class="report-card-heading">
            <div class="report-card-title">
              <span><i class="bi bi-bar-chart-fill"></i></span>
              <div>
                <div class="report-title-line">
                  <h2 id="business-intelligence-title">Business Intelligence</h2>
                  <span class="live-badge"><i class="bi bi-circle-fill"></i>En vivo</span>
                </div>
                <p>Explora ventas, operaciones y tendencias en el informe interactivo.</p>
              </div>
            </div>

            <div class="report-card-actions">
              <span v-if="ultimaVenta" class="last-sale">
                <i class="bi bi-clock-history"></i>
                Última venta: {{ fechaHora(ultimaVenta.fechaHora) }}
              </span>
              <button type="button" title="Recargar informe" aria-label="Recargar informe" @click="recargarInforme">
                <i class="bi bi-arrow-repeat"></i>
              </button>
              <button type="button" title="Ver en pantalla completa" aria-label="Ver en pantalla completa" @click="verPantallaCompleta">
                <i class="bi bi-arrows-fullscreen"></i>
              </button>
              <a :href="urlPowerBi" target="_blank" rel="noopener noreferrer" title="Abrir informe en otra pestaña" aria-label="Abrir informe en otra pestaña">
                <i class="bi bi-box-arrow-up-right"></i>
              </a>
            </div>
          </header>

          <div class="powerbi-container">
            <iframe
              :key="iframeKey"
              :src="urlPowerBi"
              title="Informe ejecutivo de RestoControl"
              class="powerbi-frame"
              frameborder="0"
              allowfullscreen
              @load="informeCargado"
            ></iframe>

            <Transition name="report-loader">
              <div v-if="cargandoInforme" class="report-loading" aria-live="polite">
                <span class="report-loading-logo"><i class="bi bi-bar-chart-fill"></i></span>
                <div class="report-loading-spinner"><span></span><span></span><span></span></div>
                <strong>Cargando informe ejecutivo</strong>
                <p>{{ informeDemorado ? 'El servicio está tardando más de lo habitual.' : 'Conectando con Power BI…' }}</p>
                <a v-if="informeDemorado" :href="urlPowerBi" target="_blank" rel="noopener noreferrer">Abrir en otra pestaña</a>
              </div>
            </Transition>
          </div>

          <footer class="report-card-footer">
            <span><i class="bi bi-mouse"></i>Usa los controles del informe para filtrar y explorar los datos.</span>
            <span><i class="bi bi-shield-check"></i>Acceso exclusivo de administrador</span>
          </footer>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import NavbarComponent from '@/components/NavbarComponent.vue'
import SidebarComponent from '@/components/SidebarComponent.vue'
import { obtenerReporteVentas } from '@/services/reporteService'
import '@/assets/css/dashboard.css'

const urlPowerBi =
  'https://app.powerbi.com/view?r=eyJrIjoiZjhjMjZkYTUtNTMzNS00ZTg5LWExNzUtOWYzNzlhNmE4ODk0IiwidCI6ImM0YTY2YzM0LTJiYjctNDUxZi04YmUxLWIyYzI2YTQzMDE1OCIsImMiOjR9'

const hoy = new Date()
const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
const cargandoMetricas = ref(true)
const cargandoInforme = ref(true)
const informeDemorado = ref(false)
const errorMetricas = ref('')
const iframeKey = ref(0)
const panelInforme = ref(null)
const metricas = reactive({
  ventasBrutasTotales: 0,
  totalTickets: 0,
  ticketPromedio: 0,
  metodosPago: [],
  ultimasVentas: [],
})
let temporizadorInforme = null

const actualizando = computed(() => cargandoMetricas.value || cargandoInforme.value)
const periodoTexto = computed(() =>
  new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(hoy),
)
const diaInicioMes = computed(() => new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short' }).format(desde))
const diaActual = computed(() => new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short' }).format(hoy))
const ultimaVenta = computed(() => metricas.ultimasVentas?.[0] || null)

const metodoPrincipal = computed(() => {
  const metodo = [...(metricas.metodosPago || [])].sort((a, b) => Number(b.cantidad) - Number(a.cantidad))[0]
  if (!metodo) return { nombre: 'Sin datos', detalle: 'Aún no hay pagos este mes', icono: 'bi bi-wallet2' }
  const mapaIconos = {
    EFECTIVO: 'bi bi-cash',
    TARJETA: 'bi bi-credit-card',
    YAPE: 'bi bi-phone',
    PLIN: 'bi bi-phone',
    TRANSFERENCIA: 'bi bi-bank',
    MIXTO: 'bi bi-distribute-horizontal',
  }
  return {
    nombre: metodo.metodo,
    detalle: `${Number(metodo.porcentaje || 0).toFixed(1)}% de los tickets`,
    icono: mapaIconos[String(metodo.metodo || '').toUpperCase()] || 'bi bi-wallet2',
  }
})

onMounted(() => {
  cargarMetricas()
  iniciarEsperaInforme()
})

onBeforeUnmount(() => window.clearTimeout(temporizadorInforme))

async function cargarMetricas() {
  cargandoMetricas.value = true
  errorMetricas.value = ''
  try {
    const resultado = await obtenerReporteVentas(fechaIso(desde), fechaIso(hoy))
    Object.assign(metricas, resultado)
  } catch (error) {
    errorMetricas.value =
      error.response?.data?.mensaje || error.response?.data?.message || 'No se pudieron cargar los indicadores del mes.'
  } finally {
    cargandoMetricas.value = false
  }
}

function actualizarDashboard() {
  cargarMetricas()
  recargarInforme()
}

function recargarInforme() {
  iframeKey.value += 1
  cargandoInforme.value = true
  iniciarEsperaInforme()
}

function iniciarEsperaInforme() {
  window.clearTimeout(temporizadorInforme)
  informeDemorado.value = false
  temporizadorInforme = window.setTimeout(() => {
    if (cargandoInforme.value) informeDemorado.value = true
  }, 12000)
}

function informeCargado() {
  cargandoInforme.value = false
  informeDemorado.value = false
  window.clearTimeout(temporizadorInforme)
}

async function verPantallaCompleta() {
  if (!panelInforme.value?.requestFullscreen) return
  await panelInforme.value.requestFullscreen()
}

function fechaIso(fecha) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function moneda(valor) {
  return Number(valor || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function numero(valor) {
  return Number(valor || 0).toLocaleString('es-PE')
}

function fechaHora(fecha) {
  if (!fecha) return '-'
  const valor = new Date(fecha)
  if (Number.isNaN(valor.getTime())) return '-'
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(valor)
}
</script>
