<template>
  <div class="layout management-layout">
    <SidebarComponent />

    <div class="main-content">
      <NavbarComponent />

      <main class="management-page movements-page">
        <header class="management-heading">
          <div class="management-title-group">
            <span class="management-title-icon"><i class="bi bi-arrow-left-right"></i></span>
            <div>
              <h1>Movimientos de inventario</h1>
              <p>Trazabilidad de compras, salidas, ajustes y consumos generados por los pedidos.</p>
            </div>
          </div>
          <span class="management-count">
            <i class="bi bi-journal-check"></i>{{ movimientosFiltrados.length }} movimientos
          </span>
        </header>

        <section class="management-summary" aria-label="Resumen de movimientos">
          <article>
            <i class="bi bi-list-check"></i>
            <div><span>Total registrado</span><strong>{{ movimientos.length }}</strong></div>
          </article>
          <article>
            <i class="bi bi-fire"></i>
            <div><span>Consumos de pedidos</span><strong>{{ resumen.consumos }}</strong></div>
          </article>
          <article>
            <i class="bi bi-box-arrow-in-down"></i>
            <div><span>Ingresos</span><strong>{{ resumen.ingresos }}</strong></div>
          </article>
          <article>
            <i class="bi bi-exclamation-diamond"></i>
            <div><span>Mermas y salidas</span><strong>{{ resumen.salidas }}</strong></div>
          </article>
        </section>

        <section class="management-toolbar movements-toolbar" aria-label="Filtros de movimientos">
          <div class="input-group management-search">
            <span class="input-group-text bg-transparent border-0"><i class="bi bi-search"></i></span>
            <input
              v-model="busqueda"
              type="search"
              class="form-control border-0 bg-transparent"
              placeholder="Buscar insumo, lote, pedido o responsable..."
            >
          </div>
          <select v-model="tipoSeleccionado" class="form-select movements-filter" aria-label="Filtrar por tipo">
            <option value="TODOS">Todos los tipos</option>
            <option value="CONSUMO_PEDIDO">Consumo de pedido</option>
            <option value="INGRESO">Ingreso</option>
            <option value="MERMA">Merma</option>
            <option value="SALIDA">Salida</option>
            <option value="CORRECCION_POSITIVA">Corrección positiva</option>
            <option value="CORRECCION_NEGATIVA">Corrección negativa</option>
          </select>
          <button type="button" class="btn btn-brand management-primary" :disabled="cargando" @click="cargarMovimientos">
            <span v-if="cargando" class="spinner-border spinner-border-sm"></span>
            <i v-else class="bi bi-arrow-clockwise"></i>
            {{ cargando ? 'Actualizando...' : 'Actualizar' }}
          </button>
        </section>

        <div v-if="errorCarga" class="management-error alert-danger" role="alert">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <span>{{ errorCarga }}</span>
          <button type="button" class="btn btn-sm btn-outline-danger" @click="cargarMovimientos">Reintentar</button>
        </div>

        <section class="custom-table-card management-table-card movements-table-card">
          <div v-if="cargando && !movimientos.length" class="movements-loading">
            <span class="spinner-border spinner-border-sm"></span>
            <strong>Cargando trazabilidad...</strong>
          </div>
          <div v-else class="table-responsive">
            <table class="table align-middle mb-0 movements-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Insumo</th>
                  <th>Movimiento</th>
                  <th class="text-end">Cantidad</th>
                  <th>Lote</th>
                  <th>Referencia</th>
                  <th>Responsable</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="movimiento in movimientosFiltrados" :key="movimiento.idMovimiento">
                  <td data-label="Fecha">
                    <time :datetime="movimiento.fechaMovimiento">{{ formatearFecha(movimiento.fechaMovimiento) }}</time>
                  </td>
                  <td data-label="Insumo">
                    <div class="movement-product">
                      <span><i class="bi bi-box-seam"></i></span>
                      <div><strong>{{ movimiento.insumo }}</strong><small>{{ movimiento.unidadMedida }}</small></div>
                    </div>
                  </td>
                  <td data-label="Movimiento">
                    <span class="movement-type" :class="claseTipo(movimiento.tipoMovimiento)">
                      <i :class="iconoTipo(movimiento.tipoMovimiento)"></i>{{ etiquetaTipo(movimiento.tipoMovimiento) }}
                    </span>
                  </td>
                  <td data-label="Cantidad" class="text-end">
                    <strong class="movement-quantity" :class="{ positive: esIngreso(movimiento.tipoMovimiento) }">
                      {{ esIngreso(movimiento.tipoMovimiento) ? '+' : '−' }}{{ formatearCantidad(movimiento.cantidad) }}
                    </strong>
                  </td>
                  <td data-label="Lote"><code>{{ movimiento.codigoLote || 'Sin lote' }}</code></td>
                  <td data-label="Referencia">
                    <span v-if="movimiento.idPedido" class="movement-reference">
                      <i class="bi bi-receipt"></i>Pedido #{{ movimiento.idPedido }}
                    </span>
                    <span v-else>{{ movimiento.referencia || 'Sin referencia' }}</span>
                    <small class="movement-reason">{{ movimiento.motivo }}</small>
                  </td>
                  <td data-label="Responsable">{{ movimiento.responsable }}</td>
                </tr>
                <tr v-if="!movimientosFiltrados.length">
                  <td colspan="7" class="management-empty">
                    <i class="bi bi-journal-x"></i>
                    <strong>No hay movimientos con estos filtros</strong>
                    <span>Los consumos aparecerán cuando Cocina inicie la preparación de un pedido.</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import NavbarComponent from '@/components/NavbarComponent.vue'
import SidebarComponent from '@/components/SidebarComponent.vue'
import { obtenerMovimientosInventario } from '@/services/movimientoInventarioService'
import '@/assets/css/management.css'

const movimientos = ref([])
const busqueda = ref('')
const tipoSeleccionado = ref('TODOS')
const cargando = ref(false)
const errorCarga = ref('')

const movimientosFiltrados = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  return movimientos.value.filter(movimiento => {
    const coincideTipo = tipoSeleccionado.value === 'TODOS'
      || movimiento.tipoMovimiento === tipoSeleccionado.value
    const contenido = [
      movimiento.insumo,
      movimiento.codigoLote,
      movimiento.referencia,
      movimiento.responsable,
      movimiento.idPedido
    ].filter(Boolean).join(' ').toLowerCase()
    return coincideTipo && (!texto || contenido.includes(texto))
  })
})

const resumen = computed(() => ({
  consumos: movimientos.value.filter(item => item.tipoMovimiento === 'CONSUMO_PEDIDO').length,
  ingresos: movimientos.value.filter(item => ['INGRESO', 'CORRECCION_POSITIVA'].includes(item.tipoMovimiento)).length,
  salidas: movimientos.value.filter(item => ['MERMA', 'SALIDA', 'CORRECCION_NEGATIVA'].includes(item.tipoMovimiento)).length
}))

onMounted(cargarMovimientos)

async function cargarMovimientos() {
  if (cargando.value) return
  cargando.value = true
  errorCarga.value = ''
  try {
    movimientos.value = await obtenerMovimientosInventario()
  } catch (error) {
    errorCarga.value = error.response?.data?.mensaje
      || error.response?.data?.message
      || 'No se pudo cargar la trazabilidad del inventario.'
  } finally {
    cargando.value = false
  }
}

function etiquetaTipo(tipo) {
  return {
    CONSUMO_PEDIDO: 'Consumo de pedido',
    INGRESO: 'Ingreso',
    MERMA: 'Merma',
    SALIDA: 'Salida',
    CORRECCION_POSITIVA: 'Corrección positiva',
    CORRECCION_NEGATIVA: 'Corrección negativa'
  }[tipo] || tipo
}

function iconoTipo(tipo) {
  return {
    CONSUMO_PEDIDO: 'bi bi-fire',
    INGRESO: 'bi bi-arrow-down-circle',
    MERMA: 'bi bi-exclamation-triangle',
    SALIDA: 'bi bi-arrow-up-circle',
    CORRECCION_POSITIVA: 'bi bi-plus-circle',
    CORRECCION_NEGATIVA: 'bi bi-dash-circle'
  }[tipo] || 'bi bi-arrow-left-right'
}

function claseTipo(tipo) {
  return `movement-type-${String(tipo || '').toLowerCase()}`
}

function esIngreso(tipo) {
  return ['INGRESO', 'CORRECCION_POSITIVA'].includes(tipo)
}

function formatearCantidad(valor) {
  return Number(valor || 0).toLocaleString('es-PE', { maximumFractionDigits: 4 })
}

function formatearFecha(valor) {
  if (!valor) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(valor))
}
</script>

<style scoped>
.movements-toolbar { display: grid; grid-template-columns: minmax(260px, 1fr) 210px auto; }
.movements-filter { border: 1px solid var(--rc-border-strong); border-radius: 9px; color: var(--rc-ink-soft); font-size: .72rem; min-height: 40px; }
.movements-loading { align-items: center; color: var(--rc-muted); display: flex; gap: .5rem; justify-content: center; min-height: 260px; }
.movements-table-card { overflow: hidden; }
.movements-table time { color: var(--rc-ink-soft); font-size: .68rem; white-space: nowrap; }
.movement-product { align-items: center; display: flex; gap: .55rem; }
.movement-product > span { align-items: center; background: var(--rc-primary-soft); border-radius: 8px; color: var(--rc-primary-hover); display: flex; flex: 0 0 auto; height: 31px; justify-content: center; width: 31px; }
.movement-product strong, .movement-product small { display: block; }
.movement-product small { color: var(--rc-muted); font-size: .58rem; }
.movement-type { align-items: center; border-radius: 999px; display: inline-flex; font-size: .62rem; font-weight: 740; gap: .3rem; padding: .3rem .5rem; white-space: nowrap; }
.movement-type-consumo_pedido { background: #eaf3f9; color: #397da8; }
.movement-type-ingreso { background: var(--rc-success-soft); color: var(--rc-success); }
.movement-type-merma, .movement-type-salida { background: var(--rc-warning-soft); color: #9b6815; }
.movement-type-correccion_positiva { background: var(--rc-success-soft); color: var(--rc-success); }
.movement-type-correccion_negativa { background: var(--rc-danger-soft); color: var(--rc-danger); }
.movement-quantity { color: #a85131; white-space: nowrap; }
.movement-quantity.positive { color: var(--rc-success); }
.movements-table code { background: #f3efec; border-radius: 6px; color: #675a53; font-size: .62rem; padding: .22rem .4rem; white-space: nowrap; }
.movement-reference { align-items: center; color: #a64e2e; display: inline-flex; font-weight: 700; gap: .3rem; white-space: nowrap; }
.movement-reason { color: var(--rc-muted); display: block; font-size: .58rem; margin-top: .18rem; max-width: 245px; }
body.dark-theme .movements-filter { background: #323233; border-color: #4b4847; color: #e4ddda; }
body.dark-theme .movements-table code { background: #3a3736; color: #dfd2cc; }
body.dark-theme .movement-type-consumo_pedido { background: #263945; color: #9ac8e4; }
body.dark-theme .movement-type-ingreso { background: #263b2e; color: #9fd1b0; }
body.dark-theme .movement-type-merma, body.dark-theme .movement-type-salida { background: #403521; color: #edca8c; }
body.dark-theme .movement-type-correccion_positiva { background: #263b2e; color: #9fd1b0; }
body.dark-theme .movement-type-correccion_negativa { background: #432c2b; color: #eca7a2; }
@media (max-width: 900px) {
  .movements-toolbar { grid-template-columns: 1fr 1fr; }
  .management-search { grid-column: 1 / -1; }
}
@media (max-width: 767.98px) {
  .movements-toolbar { display: flex; }
  .management-search { grid-column: auto; }
  .movements-table-card { overflow: visible; }
  .movement-reason { max-width: 58vw; text-align: right; }
}
</style>
