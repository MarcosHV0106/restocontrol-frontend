<template>
  <div class="layout">
    <SidebarComponent />
    <div class="main-content reportes-main">
      <NavbarComponent />

      <main class="reportes-page">
        <header class="reportes-heading">
          <div class="reportes-title-group">
            <span class="reportes-title-icon"><i class="bi bi-bar-chart-line"></i></span>
            <div><h1>Reportes de ventas y operación</h1><p>Consulta el desempeño comercial y el flujo de pedidos del restaurante.</p></div>
          </div>
        </header>

        <section class="reportes-filtros" aria-label="Filtros del reporte">
          <div class="reportes-control tipo-control">
            <label for="tipoReporte">Tipo de reporte</label>
            <select id="tipoReporte" v-model="filtros.tipo" class="form-select" @change="reporte = null">
              <option value="ventas">Ventas</option>
              <option value="gerencial">Gestión gerencial</option>
            </select>
          </div>
          <div class="reportes-control"><label for="fechaDesde">Desde</label><input id="fechaDesde" v-model="filtros.desde" :max="filtros.hasta" type="date" class="form-control"></div>
          <div class="reportes-control"><label for="fechaHasta">Hasta</label><input id="fechaHasta" v-model="filtros.hasta" :min="filtros.desde" :max="hoy" type="date" class="form-control"></div>
          <div class="reportes-actions">
            <button class="btn reportes-generate-button" :disabled="cargando" @click="generarReporte"><span v-if="cargando" class="spinner-border spinner-border-sm"></span><i v-else class="bi bi-play-fill"></i>{{ cargando ? 'Generando...' : 'Generar' }}</button>
            <button class="btn btn-outline-secondary" :disabled="!reporte" @click="exportarCsv"><i class="bi bi-download"></i>Exportar CSV</button>
          </div>
        </section>

        <div v-if="mensajeError" class="alert alert-danger d-flex align-items-center gap-2" role="alert"><i class="bi bi-exclamation-triangle-fill"></i><span>{{ mensajeError }}</span></div>

        <template v-if="reporte && filtros.tipo === 'ventas'">
          <section class="reportes-kpis" aria-label="Indicadores de ventas">
            <article class="reporte-kpi-card"><div class="kpi-icon"><i class="bi bi-cash-stack"></i></div><div><span>Ventas totales (S/)</span><strong>{{ moneda(reporte.ventasBrutasTotales) }}</strong></div></article>
            <article class="reporte-kpi-card"><div class="kpi-icon"><i class="bi bi-receipt"></i></div><div><span>Pedidos pagados</span><strong>{{ reporte.totalTickets }}</strong></div></article>
            <article class="reporte-kpi-card"><div class="kpi-icon"><i class="bi bi-tag"></i></div><div><span>Ticket promedio (S/)</span><strong>{{ moneda(reporte.ticketPromedio) }}</strong></div></article>
          </section>

          <div class="report-grid">
            <section class="reporte-panel table-panel">
              <div class="panel-heading"><div><h3>Métodos de pago</h3><p>Participación de los pagos registrados.</p></div></div>
              <div class="payment-list">
                <article v-for="metodo in reporte.metodosPago" :key="metodo.metodo"><div><strong>{{ metodo.metodo }}</strong><span>{{ metodo.cantidad }} pagos</span></div><div class="payment-meter"><i :style="{ width: `${metodo.porcentaje}%` }"></i></div><b>{{ porcentaje(metodo.porcentaje) }}</b></article>
                <p v-if="!reporte.metodosPago.length" class="reportes-empty">No hay pagos en el periodo.</p>
              </div>
            </section>
            <section class="reporte-panel table-panel">
              <div class="panel-heading"><div><h3>Ventas por hora</h3><p>Horas con movimiento comercial.</p></div></div>
              <div class="hour-list">
                <span v-for="item in horasConVentas" :key="item.hora"><small>{{ String(item.hora).padStart(2, '0') }}:00</small><strong>S/ {{ moneda(item.ventas) }}</strong></span>
                <p v-if="!horasConVentas.length" class="reportes-empty">No hay ventas en el periodo.</p>
              </div>
            </section>
          </div>

          <section class="reporte-panel table-panel">
            <div class="panel-heading"><div><h3>Últimas ventas</h3><p>Pedidos pagados dentro del periodo seleccionado.</p></div></div>
            <div class="table-responsive"><table class="table reportes-table align-middle mb-0"><thead><tr><th>Ticket</th><th>Fecha</th><th>Mesa / cliente</th><th>Método</th><th class="text-end">Total</th></tr></thead><tbody>
              <tr v-for="venta in reporte.ultimasVentas" :key="venta.idPedido"><td data-label="Ticket" class="fw-semibold">{{ venta.ticket }}</td><td data-label="Fecha">{{ fechaHora(venta.fechaHora) }}</td><td data-label="Mesa / cliente">{{ venta.numeroMesa ? `Mesa ${venta.numeroMesa}` : venta.cliente }}</td><td data-label="Método">{{ venta.metodoPago }}</td><td data-label="Total" class="text-end">S/ {{ moneda(venta.total) }}</td></tr>
              <tr v-if="!reporte.ultimasVentas.length"><td colspan="5" class="reportes-empty">No hay ventas pagadas en el periodo.</td></tr>
            </tbody></table></div>
          </section>
        </template>

        <template v-if="reporte && filtros.tipo === 'gerencial'">
          <section class="reportes-kpis gerencial-kpis" aria-label="Indicadores gerenciales">
            <article class="reporte-kpi-card"><div class="kpi-icon"><i class="bi bi-cash-stack"></i></div><div><span>Ventas totales (S/)</span><strong>{{ moneda(reporte.indicadores.ventasTotales) }}</strong></div></article>
            <article class="reporte-kpi-card"><div class="kpi-icon"><i class="bi bi-check2-circle"></i></div><div><span>Pedidos pagados</span><strong>{{ reporte.indicadores.pedidosPagados }}</strong></div></article>
            <article class="reporte-kpi-card"><div class="kpi-icon"><i class="bi bi-x-circle"></i></div><div><span>Pedidos cancelados</span><strong>{{ reporte.indicadores.pedidosCancelados }}</strong><small>{{ porcentaje(reporte.indicadores.tasaCancelacion) }} del flujo cerrado</small></div></article>
            <article class="reporte-kpi-card"><div class="kpi-icon"><i class="bi bi-receipt-cutoff"></i></div><div><span>Ticket promedio (S/)</span><strong>{{ moneda(reporte.indicadores.ticketPromedio) }}</strong></div></article>
          </section>

          <section class="reporte-panel table-panel">
            <div class="panel-heading"><div><h3>Ventas por modalidad</h3><p>Distribución de pedidos atendidos.</p></div></div>
            <div class="table-responsive"><table class="table reportes-table align-middle mb-0"><thead><tr><th>Modalidad</th><th>Pedidos</th><th>Participación</th><th class="text-end">Ventas</th></tr></thead><tbody>
              <tr v-for="item in reporte.ventasPorModalidad" :key="item.modalidad"><td data-label="Modalidad" class="fw-semibold">{{ item.modalidad }}</td><td data-label="Pedidos">{{ item.pedidos }}</td><td data-label="Participación">{{ porcentaje(item.participacion) }}</td><td data-label="Ventas" class="text-end">S/ {{ moneda(item.ventas) }}</td></tr>
              <tr v-if="!reporte.ventasPorModalidad.length"><td colspan="4" class="reportes-empty">No hay ventas en el periodo.</td></tr>
            </tbody></table></div>
          </section>

          <div class="report-grid">
            <section class="reporte-panel table-panel">
              <div class="panel-heading"><div><h3>Platos más vendidos</h3><p>Productos con mayor salida.</p></div></div>
              <div class="table-responsive"><table class="table reportes-table align-middle mb-0"><thead><tr><th>Plato</th><th>Vendidos</th><th class="text-end">Ingresos</th></tr></thead><tbody>
                <tr v-for="item in reporte.productosMasVendidos" :key="item.idAlimento"><td data-label="Plato"><strong>{{ item.producto }}</strong><small class="d-block text-muted">{{ item.categoria }}</small></td><td data-label="Vendidos">{{ item.cantidadVendida }}</td><td data-label="Ingresos" class="text-end">S/ {{ moneda(item.ingresos) }}</td></tr>
                <tr v-if="!reporte.productosMasVendidos.length"><td colspan="3" class="reportes-empty">No hay productos vendidos.</td></tr>
              </tbody></table></div>
            </section>
            <section class="reporte-panel table-panel">
              <div class="panel-heading"><div><h3>Pedidos cancelados</h3><p>Motivos registrados durante el periodo.</p></div></div>
              <div class="table-responsive"><table class="table reportes-table align-middle mb-0"><thead><tr><th>Pedido</th><th>Motivo</th><th class="text-end">Total</th></tr></thead><tbody>
                <tr v-for="item in reporte.pedidosCancelados" :key="item.idPedido"><td data-label="Pedido"><strong>#{{ item.idPedido }}</strong><small class="d-block text-muted">{{ fechaHora(item.fechaCancelacion) }}</small></td><td data-label="Motivo">{{ item.motivo }}</td><td data-label="Total" class="text-end">S/ {{ moneda(item.totalAnulado) }}</td></tr>
                <tr v-if="!reporte.pedidosCancelados.length"><td colspan="3" class="reportes-empty">No hubo cancelaciones.</td></tr>
              </tbody></table></div>
            </section>
          </div>
        </template>

        <section v-if="!reporte && !cargando" class="reportes-empty-state"><i class="bi bi-bar-chart"></i><h2>Genera un reporte</h2><p>Selecciona el periodo y el tipo de análisis.</p></section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import NavbarComponent from '@/components/NavbarComponent.vue'
import SidebarComponent from '@/components/SidebarComponent.vue'
import { obtenerReporteGerencial, obtenerReporteVentas } from '@/services/reporteService'
import '@/assets/css/reportes.css'

function fechaLocal(fecha) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}
const ahora = new Date()
const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
const hoy = fechaLocal(ahora)
const filtros = ref({ tipo: 'ventas', desde: fechaLocal(inicio), hasta: hoy })
const reporte = ref(null)
const cargando = ref(false)
const mensajeError = ref('')
const horasConVentas = computed(() => (reporte.value?.ventasPorHora || []).filter((item) => Number(item.ventas) > 0))

function moneda(valor) { return Number(valor || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function porcentaje(valor) { return `${Number(valor || 0).toLocaleString('es-PE', { maximumFractionDigits: 1 })}%` }
function fechaHora(valor) { return valor ? new Date(valor).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '-' }
function mensajeApi(error) { return error.response?.data?.message || error.response?.data?.mensaje || 'No fue posible generar el reporte.' }

async function generarReporte() {
  mensajeError.value = ''
  if (!filtros.value.desde || !filtros.value.hasta || filtros.value.desde > filtros.value.hasta) {
    mensajeError.value = 'Selecciona un periodo válido.'
    return
  }
  cargando.value = true
  try {
    reporte.value = filtros.value.tipo === 'ventas'
      ? await obtenerReporteVentas(filtros.value.desde, filtros.value.hasta)
      : await obtenerReporteGerencial(filtros.value.desde, filtros.value.hasta)
  } catch (error) {
    reporte.value = null
    mensajeError.value = mensajeApi(error)
  } finally {
    cargando.value = false
  }
}

function escaparCsv(valor) { return `"${String(valor ?? '').replaceAll('"', '""')}"` }
function exportarCsv() {
  if (!reporte.value) return
  let filas
  if (filtros.value.tipo === 'ventas') {
    filas = [['Ticket', 'Fecha', 'Mesa', 'Cliente', 'Método de pago', 'Total'], ...reporte.value.ultimasVentas.map((item) => [item.ticket, item.fechaHora, item.numeroMesa || '', item.cliente, item.metodoPago, item.total])]
  } else {
    filas = [['Plato', 'Categoría', 'Cantidad vendida', 'Ingresos'], ...reporte.value.productosMasVendidos.map((item) => [item.producto, item.categoria, item.cantidadVendida, item.ingresos])]
  }
  const contenido = `\uFEFF${filas.map((fila) => fila.map(escaparCsv).join(';')).join('\n')}`
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }))
  enlace.download = `restocontrol-${filtros.value.tipo}-${filtros.value.desde}-${filtros.value.hasta}.csv`
  enlace.click()
  URL.revokeObjectURL(enlace.href)
}

onMounted(generarReporte)
</script>

<style scoped>
.report-grid { display: grid; gap: 1rem; grid-template-columns: 1fr 1fr; }
.gerencial-kpis { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.payment-list { display: grid; gap: .8rem; padding: .25rem 0; }
.payment-list article { align-items: center; display: grid; gap: .8rem; grid-template-columns: minmax(110px, 1fr) 2fr 50px; }
.payment-list article div:first-child { display: grid; }
.payment-list span { color: var(--rc-muted); font-size: .72rem; }
.payment-meter { background: var(--rc-border); border-radius: 999px; height: 8px; overflow: hidden; }
.payment-meter i { background: var(--rc-primary); display: block; height: 100%; }
.payment-list b { color: var(--rc-ink); font-size: .75rem; text-align: right; }
.hour-list { display: grid; gap: .55rem; grid-template-columns: repeat(3, 1fr); }
.hour-list span { background: var(--rc-page); border: 1px solid var(--rc-border); border-radius: 9px; display: grid; padding: .65rem; }
.hour-list small { color: var(--rc-muted); }
.hour-list strong { color: var(--rc-ink); font-size: .82rem; }
@media (max-width: 991.98px) { .report-grid { grid-template-columns: 1fr; } .gerencial-kpis { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 575.98px) { .gerencial-kpis { grid-template-columns: 1fr; } .hour-list { grid-template-columns: repeat(2, 1fr); } }
</style>
