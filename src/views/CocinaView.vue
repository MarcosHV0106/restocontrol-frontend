<template>
  <div class="layout">
    <SidebarComponent />
    <div class="main-content">
      <NavbarComponent />

      <main class="container-fluid p-3 p-lg-4 cocina-page" :class="{ 'cocina-compacta': preferencias.compacta }">
        <header class="cocina-heading">
          <div class="cocina-title-group">
            <span class="cocina-title-icon"><i class="bi bi-fire"></i></span>
            <div>
              <h1>Cocina</h1>
              <p>Gestiona el flujo de pedidos en tiempo real.</p>
            </div>
          </div>
          <div class="sync-status" :class="{ 'is-syncing': cargando && pedidos.length }" aria-live="polite">
            <span></span>
            {{ cargando && pedidos.length ? 'Sincronizando…' : `Actualizado ${ultimaActualizacionTexto}` }}
          </div>
        </header>

        <nav class="kitchen-tabs" aria-label="Secciones de Cocina">
          <button type="button" :class="{ active: seccionActiva === 'COMANDAS' }" @click="seccionActiva = 'COMANDAS'">
            <i class="bi bi-kanban"></i><span>Comandas</span><small>{{ resumen.total }}</small>
          </button>
          <button type="button" :class="{ active: seccionActiva === 'DISPONIBILIDAD' }" @click="seccionActiva = 'DISPONIBILIDAD'">
            <i class="bi bi-egg-fried"></i><span>Disponibilidad</span><small :class="{ warning: productosBloqueados.length }">{{ productosBloqueados.length }}</small>
          </button>
          <button type="button" :class="{ active: seccionActiva === 'HISTORIAL' }" @click="seccionActiva = 'HISTORIAL'">
            <i class="bi bi-clock-history"></i><span>Historial del turno</span>
          </button>
        </nav>

        <section v-if="seccionActiva === 'COMANDAS'" class="kitchen-section">
        <section class="kitchen-toolbar" aria-label="Herramientas del tablero">
          <label class="kitchen-search" for="buscarPedidoCocina">
            <i class="bi bi-search"></i>
            <input
              id="buscarPedidoCocina"
              v-model.trim="busqueda"
              type="search"
              autocomplete="off"
              placeholder="Buscar pedido, plato o responsable"
            />
            <button v-if="busqueda" type="button" aria-label="Limpiar búsqueda" @click="busqueda = ''">
              <i class="bi bi-x-circle-fill"></i>
            </button>
          </label>

          <label class="mesa-filter" for="filtroMesa">
            <i class="bi bi-layout-text-window-reverse"></i>
            <select id="filtroMesa" v-model="mesaSeleccionada">
              <option value="TODAS">Todas las mesas</option>
              <option v-for="mesa in mesasDisponibles" :key="mesa" :value="String(mesa)">Mesa {{ mesa }}</option>
            </select>
          </label>

          <button type="button" class="toolbar-button" :disabled="cargando" @click="cargarPedidos()">
            <span v-if="cargando" class="spinner-border spinner-border-sm"></span>
            <i v-else class="bi bi-arrow-clockwise"></i>
            Actualizar
          </button>

          <button type="button" class="toolbar-button" @click="abrirPreferencias">
            <i class="bi bi-sliders"></i>
            Configurar vista
          </button>
        </section>

        <div v-if="errorCarga" class="alert kitchen-alert alert-danger" role="alert">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <span>{{ errorCarga }}</span>
          <button type="button" class="btn btn-sm btn-outline-danger ms-auto" @click="cargarPedidos()">Reintentar</button>
        </div>

        <section v-if="cargando && !pedidos.length" class="kitchen-loading" aria-live="polite">
          <div class="spinner-border" role="status"></div>
          <strong>Preparando el tablero</strong>
          <span>Consultando los pedidos activos de Cocina.</span>
        </section>

        <template v-else>
          <section class="kitchen-board" :style="{ '--columnas': columnasVisibles.length }" aria-label="Flujo de pedidos de Cocina">
            <article
              v-for="columna in columnasVisibles"
              :key="columna.estado"
              class="kitchen-column"
              :class="`column-${columna.estado.toLowerCase()}`"
              :aria-labelledby="`titulo-${columna.estado}`"
            >
              <header class="column-header">
                <div>
                  <span class="column-dot"></span>
                  <h2 :id="`titulo-${columna.estado}`">{{ columna.titulo }}</h2>
                </div>
                <span class="column-count" :aria-label="`${pedidosPorEstado[columna.estado].length} pedidos`">
                  {{ pedidosPorEstado[columna.estado].length }}
                </span>
              </header>

              <TransitionGroup name="kitchen-card" tag="div" class="column-content">
                <article
                  v-for="pedido in pedidosPorEstado[columna.estado]"
                  :key="pedido.idPedido"
                  class="kitchen-order"
                  :class="{ 'is-late': esAtrasado(pedido), 'is-busy': cargandoId === pedido.idPedido }"
                >
                  <header class="order-header">
                    <div class="order-number">
                      <span class="order-sequence">{{ pedido.detalles?.length || 0 }}</span>
                      <div>
                        <strong>#{{ String(pedido.idPedido).padStart(5, '0') }}</strong>
                        <small>{{ ubicacionPedido(pedido) }}</small>
                      </div>
                    </div>
                    <span class="time-badge" :class="{ late: esAtrasado(pedido) }">
                      <i class="bi bi-clock"></i>{{ tiempoPrincipal(pedido) }}
                    </span>
                  </header>

                  <div class="order-meta-line">
                    <span><i class="bi bi-person"></i>{{ pedido.responsable }}</span>
                    <time :datetime="pedido.fechaPedido">{{ hora(pedido.fechaPedido) }}</time>
                  </div>

                  <ul class="order-items">
                    <li v-for="detalle in pedido.detalles" :key="detalle.idDetalle">
                      <strong>{{ detalle.cantidad }}×</strong>
                      <span>{{ detalle.nombreAlimento }}</span>
                    </li>
                  </ul>

                  <div v-if="pedido.observacion" class="order-observation">
                    <i class="bi bi-chat-left-text"></i>
                    <span>{{ pedido.observacion }}</span>
                  </div>

                  <div v-if="pedido.fechaConsumoInventario" class="inventory-consumption">
                    <i class="bi bi-box-arrow-up-right"></i>
                    Insumos descontados a las <strong>{{ hora(pedido.fechaConsumoInventario) }}</strong>
                  </div>

                  <div v-if="pedido.estado !== 'ENTREGADO' && pedido.tiempoEstimadoMinutos" class="preparation-estimate">
                    <i class="bi bi-hourglass-split"></i>
                    Estimado <strong>{{ pedido.tiempoEstimadoMinutos }} min</strong>
                    <span>· listo aprox. {{ hora(pedido.fechaEstimadaLista) }}</span>
                  </div>

                  <div v-if="pedido.estado === 'EN_PREPARACION'" class="stage-detail">
                    <i class="bi bi-stopwatch"></i>
                    Tiempo en preparación: <strong>{{ tiempoPreparacion(pedido) }}</strong>
                  </div>
                  <div v-else-if="pedido.estado === 'LISTO'" class="stage-detail is-ready">
                    <i class="bi bi-check-circle-fill"></i>
                    Listo desde hace <strong>{{ desdeHace(pedido.fechaListo) }}</strong>
                  </div>
                  <div v-else-if="pedido.estado === 'ENTREGADO'" class="stage-detail is-delivered">
                    <i class="bi bi-check2-all"></i>
                    Entregado a las <strong>{{ hora(pedido.fechaEntregado) }}</strong>
                  </div>

                  <button
                    v-if="accionPedido(pedido)"
                    type="button"
                    class="order-action"
                    :class="`action-${pedido.estado.toLowerCase()}`"
                    :disabled="cargandoId !== null"
                    @click="avanzarPedido(pedido)"
                  >
                    <span v-if="cargandoId === pedido.idPedido" class="spinner-border spinner-border-sm"></span>
                    <i v-else :class="accionPedido(pedido).icono"></i>
                    {{ cargandoId === pedido.idPedido ? 'Actualizando…' : accionPedido(pedido).etiqueta }}
                  </button>
                </article>
              </TransitionGroup>

              <div v-if="!pedidosPorEstado[columna.estado].length" class="column-empty">
                <span><i :class="columna.icono"></i></span>
                <strong>{{ mensajeVacio(columna.estado).titulo }}</strong>
                <p>{{ mensajeVacio(columna.estado).detalle }}</p>
              </div>
            </article>
          </section>

          <div v-if="!cantidadFiltrada && (busqueda || mesaSeleccionada !== 'TODAS')" class="filters-empty">
            <i class="bi bi-search"></i>
            <div><strong>No encontramos pedidos</strong><span>Prueba limpiando la búsqueda o seleccionando todas las mesas.</span></div>
            <button class="btn btn-outline-secondary btn-sm" @click="limpiarFiltros">Limpiar filtros</button>
          </div>

          <section class="kitchen-summary" aria-label="Resumen de Cocina">
            <article>
              <span class="summary-icon summary-total"><i class="bi bi-clipboard2-check"></i></span>
              <div><strong>{{ resumen.total }}</strong><small>Pedidos activos</small></div>
            </article>
            <article>
              <span class="summary-icon summary-prep"><i class="bi bi-briefcase"></i></span>
              <div><strong>{{ resumen.preparacion }}</strong><small>En preparación</small></div>
            </article>
            <article>
              <span class="summary-icon summary-ready"><i class="bi bi-check2-circle"></i></span>
              <div><strong>{{ resumen.listos }}</strong><small>Listos para entregar</small></div>
            </article>
            <article>
              <span class="summary-icon summary-time"><i class="bi bi-clock"></i></span>
              <div><strong>{{ resumen.promedio }} min</strong><small>Promedio de preparación</small></div>
            </article>
            <article :class="{ 'has-alert': resumen.atrasados > 0 }">
              <span class="summary-icon summary-alert"><i class="bi bi-exclamation-triangle"></i></span>
              <div><strong>{{ resumen.atrasados }}</strong><small>Pedidos atrasados</small></div>
            </article>
          </section>
        </template>
        </section>

        <section v-else-if="seccionActiva === 'DISPONIBILIDAD'" class="kitchen-section availability-section">
          <div class="section-introduction">
            <div><span>Coordinación con Caja y Salón</span><h2>Disponibilidad temporal del menú</h2><p>Notifica agotados sin modificar la configuración administrativa ni el inventario.</p></div>
            <div class="availability-counter"><strong>{{ productosBloqueados.length }}</strong><span>agotados notificados</span></div>
          </div>

          <section class="availability-toolbar" aria-label="Filtros de productos">
            <label class="kitchen-search" for="buscarProductoCocina">
              <i class="bi bi-search"></i>
              <input id="buscarProductoCocina" v-model.trim="busquedaProducto" type="search" autocomplete="off" placeholder="Buscar plato o categoría" />
              <button v-if="busquedaProducto" type="button" aria-label="Limpiar búsqueda" @click="busquedaProducto = ''"><i class="bi bi-x-circle-fill"></i></button>
            </label>
            <label class="mesa-filter" for="filtroDisponibilidad">
              <i class="bi bi-funnel"></i>
              <select id="filtroDisponibilidad" v-model="filtroDisponibilidad">
                <option value="TODOS">Todos los productos</option>
                <option value="BLOQUEADOS">Agotados notificados</option>
                <option value="DISPONIBLES">Disponibles para pedidos</option>
                <option value="OTROS">Otros no disponibles</option>
              </select>
            </label>
            <button type="button" class="toolbar-button" :disabled="cargandoProductos" @click="cargarProductos()">
              <span v-if="cargandoProductos" class="spinner-border spinner-border-sm"></span><i v-else class="bi bi-arrow-clockwise"></i>Actualizar
            </button>
          </section>

          <div v-if="errorProductos" class="alert kitchen-alert alert-danger" role="alert"><i class="bi bi-exclamation-triangle-fill"></i><span>{{ errorProductos }}</span><button type="button" class="btn btn-sm btn-outline-danger ms-auto" @click="cargarProductos()">Reintentar</button></div>
          <section v-if="cargandoProductos && !productos.length" class="kitchen-loading compact" aria-live="polite"><div class="spinner-border"></div><strong>Consultando el menú</strong><span>Calculando disponibilidad e inventario actual.</span></section>

          <section v-else class="availability-grid" aria-label="Disponibilidad de productos">
            <article v-for="producto in productosFiltrados" :key="producto.idAlimento" class="availability-card" :class="{ blocked: producto.bloqueadoCocina, unavailable: !producto.disponibleParaPedidos }">
              <header>
                <span class="product-icon"><i class="bi bi-egg-fried"></i></span>
                <div><small>{{ producto.categoria?.nombreCategoria || 'Sin categoría' }}</small><h3>{{ producto.nombreAlimento }}</h3></div>
                <span class="availability-badge" :class="estadoProducto(producto).clase">{{ estadoProducto(producto).etiqueta }}</span>
              </header>
              <div class="product-operational-data">
                <span><i class="bi bi-box-seam"></i><strong>{{ producto.porcionesDisponibles || 0 }}</strong> porciones por inventario</span>
                <span v-if="producto.bloqueadoCocina"><i class="bi bi-person-check"></i>{{ producto.responsableBloqueoCocina || 'Cocina' }}</span>
              </div>
              <p class="availability-reason">{{ producto.motivoNoDisponible || 'Producto operativo y disponible para nuevas comandas.' }}</p>
              <time v-if="producto.fechaBloqueoCocina" :datetime="producto.fechaBloqueoCocina">Notificado {{ formatearFechaHora(producto.fechaBloqueoCocina) }}</time>
              <button v-if="producto.bloqueadoCocina" type="button" class="product-action reactivate" :disabled="procesandoProducto !== null" @click="abrirDisponibilidad(producto, true)"><i class="bi bi-arrow-counterclockwise"></i>Reactivar para pedidos</button>
              <button v-else type="button" class="product-action block" :disabled="procesandoProducto !== null" @click="abrirDisponibilidad(producto, false)"><i class="bi bi-megaphone"></i>Notificar agotado</button>
            </article>
            <div v-if="!productosFiltrados.length" class="availability-empty"><i class="bi bi-search"></i><strong>No hay productos que coincidan</strong><span>Ajusta la búsqueda o el filtro de disponibilidad.</span></div>
          </section>
        </section>

        <section v-else class="kitchen-section history-section">
          <div class="section-introduction history-heading">
            <div><span>Trazabilidad de preparación</span><h2>Historial por turno</h2><p>Consulta pedidos terminados, platos procesados y tiempos reales de Cocina.</p></div>
            <div class="history-controls">
              <label for="turnoHistorial">Turno</label>
              <select id="turnoHistorial" v-model="turnoSeleccionado" @change="cargarHistorial()">
                <option value="ACTUAL">Turno actual</option><option value="ANTERIOR">Turno anterior</option>
              </select>
              <button type="button" class="toolbar-button" :disabled="cargandoHistorial" @click="cargarHistorial()"><span v-if="cargandoHistorial" class="spinner-border spinner-border-sm"></span><i v-else class="bi bi-arrow-clockwise"></i></button>
            </div>
          </div>

          <div v-if="errorHistorial" class="alert kitchen-alert alert-danger" role="alert"><i class="bi bi-exclamation-triangle-fill"></i><span>{{ errorHistorial }}</span><button type="button" class="btn btn-sm btn-outline-danger ms-auto" @click="cargarHistorial()">Reintentar</button></div>
          <section v-if="historial" class="shift-banner">
            <div><span>Turno {{ historial.turno }}</span><strong>{{ formatearRangoTurno(historial) }}</strong></div>
            <p>Los turnos operativos se agrupan en bloques de 8 horas: 06:00, 14:00 y 22:00.</p>
          </section>
          <section class="history-summary" aria-label="Resumen del turno">
            <article><i class="bi bi-receipt-cutoff"></i><div><strong>{{ historial?.totalPedidos || 0 }}</strong><span>Pedidos preparados</span></div></article>
            <article><i class="bi bi-egg-fried"></i><div><strong>{{ historial?.totalPlatos || 0 }}</strong><span>Platos procesados</span></div></article>
            <article><i class="bi bi-stopwatch"></i><div><strong>{{ historial?.promedioPreparacionMinutos || 0 }} min</strong><span>Promedio real</span></div></article>
          </section>
          <div class="history-table-wrapper">
            <table class="history-table">
              <thead><tr><th>Pedido</th><th>Atención</th><th>Responsable</th><th>Platos</th><th>Preparación</th><th>Entregado</th></tr></thead>
              <tbody>
                <tr v-if="cargandoHistorial"><td colspan="6" class="history-empty"><span class="spinner-border spinner-border-sm"></span> Consultando el turno…</td></tr>
                <tr v-else-if="!historial?.pedidos?.length"><td colspan="6" class="history-empty"><i class="bi bi-clock-history"></i><strong>Sin entregas registradas</strong><span>Los pedidos marcados como entregados aparecerán aquí.</span></td></tr>
                <tr v-for="pedido in historial?.pedidos || []" v-else :key="pedido.idPedido">
                  <td data-label="Pedido"><strong>#{{ String(pedido.idPedido).padStart(5, '0') }}</strong></td>
                  <td data-label="Atención">{{ ubicacionPedido(pedido) }}</td>
                  <td data-label="Responsable">{{ pedido.responsable }}</td>
                  <td data-label="Platos">{{ cantidadPlatos(pedido) }}</td>
                  <td data-label="Preparación"><span class="duration-pill">{{ duracionPreparacionReal(pedido) }}</span></td>
                  <td data-label="Entregado">{{ hora(pedido.fechaEntregado) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>

    <div class="kitchen-announcer visually-hidden" aria-live="assertive">{{ anuncio }}</div>

    <Transition name="toast">
      <div v-if="notificacion" class="kitchen-toast" :class="`toast-${notificacion.tipo}`" role="status">
        <i :class="notificacion.tipo === 'success' ? 'bi bi-check-circle-fill' : 'bi bi-exclamation-circle-fill'"></i>
        <span>{{ notificacion.mensaje }}</span>
        <button type="button" aria-label="Cerrar mensaje" @click="notificacion = null"><i class="bi bi-x"></i></button>
      </div>
    </Transition>

    <Teleport to="body">
      <div v-if="preferenciasAbiertas" class="preferences-backdrop" @mousedown.self="cerrarPreferencias">
        <section
          ref="dialogoPreferencias"
          class="preferences-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preferences-title"
          tabindex="-1"
          @keydown.esc="cerrarPreferencias"
        >
          <header>
            <div><span>Personalización</span><h2 id="preferences-title">Configurar vista</h2></div>
            <button type="button" class="btn-close" aria-label="Cerrar" @click="cerrarPreferencias"></button>
          </header>

          <div class="preference-section">
            <strong>Densidad de tarjetas</strong>
            <p>Elige cuánto contenido deseas ver al mismo tiempo.</p>
            <div class="density-options">
              <label :class="{ active: !preferencias.compacta }">
                <input v-model="preferencias.compacta" type="radio" :value="false" />
                <i class="bi bi-card-text"></i><span>Cómoda</span>
              </label>
              <label :class="{ active: preferencias.compacta }">
                <input v-model="preferencias.compacta" type="radio" :value="true" />
                <i class="bi bi-view-stacked"></i><span>Compacta</span>
              </label>
            </div>
          </div>

          <label class="preference-switch">
            <div><strong>Mostrar entregados</strong><small>Incluye las entregas recientes en el tablero.</small></div>
            <input v-model="preferencias.mostrarEntregados" type="checkbox" role="switch" />
          </label>

          <label class="preference-switch">
            <div><strong>Actualización automática</strong><small>Sincroniza Cocina cada 30 segundos.</small></div>
            <input v-model="preferencias.actualizacionAutomatica" type="checkbox" role="switch" />
          </label>

          <label class="late-threshold" for="umbralAtraso">
            <div><strong>Umbral de atraso</strong><small>Resalta pedidos que superen este tiempo.</small></div>
            <div><input id="umbralAtraso" v-model.number="preferencias.umbralAtraso" type="number" min="5" max="120" step="5" /><span>min</span></div>
          </label>

          <footer><button type="button" class="btn btn-primary" @click="cerrarPreferencias">Guardar preferencias</button></footer>
        </section>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="disponibilidadAbierta" class="preferences-backdrop" @mousedown.self="cerrarDisponibilidad">
        <section class="availability-dialog" role="dialog" aria-modal="true" aria-labelledby="availability-dialog-title" @keydown.esc="cerrarDisponibilidad">
          <header><span class="dialog-product-icon"><i class="bi bi-egg-fried"></i></span><div><small>Disponibilidad temporal</small><h2 id="availability-dialog-title">{{ accionDisponibilidadDisponible ? 'Reactivar producto' : 'Notificar producto agotado' }}</h2><p>{{ productoSeleccionado?.nombreAlimento }}</p></div><button type="button" class="btn-close" aria-label="Cerrar" @click="cerrarDisponibilidad"></button></header>
          <div class="availability-dialog-body">
            <p v-if="accionDisponibilidadDisponible">Caja y Salón volverán a ver el producto disponible siempre que su receta y su inventario también sean suficientes.</p>
            <template v-else><p>El producto se bloqueará inmediatamente para nuevas comandas y el aviso será visible para Caja y Salón.</p><label for="motivoDisponibilidad">Motivo del agotado</label><textarea id="motivoDisponibilidad" v-model.trim="motivoDisponibilidad" rows="3" maxlength="200" placeholder="Ej. se agotó la salsa base"></textarea><small>{{ motivoDisponibilidad.length }}/200</small></template>
            <div v-if="errorDisponibilidad" class="dialog-inline-error"><i class="bi bi-exclamation-triangle"></i>{{ errorDisponibilidad }}</div>
          </div>
          <footer><button type="button" class="secondary" :disabled="procesandoProducto !== null" @click="cerrarDisponibilidad">Cancelar</button><button type="button" :class="{ reactivate: accionDisponibilidadDisponible }" :disabled="!disponibilidadValida || procesandoProducto !== null" @click="confirmarDisponibilidad"><span v-if="procesandoProducto !== null" class="spinner-border spinner-border-sm"></span><i v-else :class="accionDisponibilidadDisponible ? 'bi bi-arrow-counterclockwise' : 'bi bi-megaphone'"></i>{{ accionDisponibilidadDisponible ? 'Reactivar producto' : 'Notificar a Caja y Salón' }}</button></footer>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import NavbarComponent from '@/components/NavbarComponent.vue'
import SidebarComponent from '@/components/SidebarComponent.vue'
import cocinaService from '@/services/cocinaService'
import '@/assets/css/cocina.css'

const ESTADOS = ['RECIBIDO', 'EN_PREPARACION', 'LISTO', 'ENTREGADO']
const columnas = [
  { estado: 'RECIBIDO', titulo: 'Recibido', icono: 'bi bi-inbox' },
  { estado: 'EN_PREPARACION', titulo: 'En preparación', icono: 'bi bi-fire' },
  { estado: 'LISTO', titulo: 'Listo', icono: 'bi bi-check2-circle' },
  { estado: 'ENTREGADO', titulo: 'Entregado', icono: 'bi bi-check2-all' },
]

const pedidos = ref([])
const productos = ref([])
const historial = ref(null)
const cargando = ref(false)
const cargandoId = ref(null)
const cargandoProductos = ref(false)
const cargandoHistorial = ref(false)
const errorCarga = ref('')
const errorProductos = ref('')
const errorHistorial = ref('')
const busqueda = ref('')
const busquedaProducto = ref('')
const mesaSeleccionada = ref('TODAS')
const filtroDisponibilidad = ref('TODOS')
const turnoSeleccionado = ref('ACTUAL')
const seccionActiva = ref('COMANDAS')
const ahora = ref(Date.now())
const ultimaActualizacion = ref(null)
const notificacion = ref(null)
const anuncio = ref('')
const preferenciasAbiertas = ref(false)
const dialogoPreferencias = ref(null)
const disponibilidadAbierta = ref(false)
const productoSeleccionado = ref(null)
const accionDisponibilidadDisponible = ref(false)
const motivoDisponibilidad = ref('')
const procesandoProducto = ref(null)
const errorDisponibilidad = ref('')

const preferenciasGuardadas = leerPreferencias()
const preferencias = reactive({
  compacta: preferenciasGuardadas.compacta ?? false,
  mostrarEntregados: preferenciasGuardadas.mostrarEntregados ?? true,
  actualizacionAutomatica: preferenciasGuardadas.actualizacionAutomatica ?? true,
  umbralAtraso: preferenciasGuardadas.umbralAtraso ?? 25,
})

let reloj = null
let sincronizador = null
let temporizadorToast = null

const columnasVisibles = computed(() =>
  preferencias.mostrarEntregados ? columnas : columnas.filter((columna) => columna.estado !== 'ENTREGADO'),
)

const mesasDisponibles = computed(() =>
  [...new Set(pedidos.value.map((pedido) => pedido.numeroMesa).filter((mesa) => mesa !== null && mesa !== undefined))].sort(
    (a, b) => Number(a) - Number(b),
  ),
)

const productosBloqueados = computed(() => productos.value.filter((producto) => producto.bloqueadoCocina))

const productosFiltrados = computed(() => {
  const termino = busquedaProducto.value.toLocaleLowerCase('es-PE')
  return productos.value
    .filter((producto) => {
      if (filtroDisponibilidad.value === 'BLOQUEADOS') return producto.bloqueadoCocina
      if (filtroDisponibilidad.value === 'DISPONIBLES') return producto.disponibleParaPedidos
      if (filtroDisponibilidad.value === 'OTROS') return !producto.disponibleParaPedidos && !producto.bloqueadoCocina
      return true
    })
    .filter((producto) => {
      if (!termino) return true
      return [producto.nombreAlimento, producto.categoria?.nombreCategoria, producto.motivoNoDisponible]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('es-PE')
        .includes(termino)
    })
    .sort((a, b) => Number(b.bloqueadoCocina) - Number(a.bloqueadoCocina)
      || String(a.nombreAlimento).localeCompare(String(b.nombreAlimento), 'es'))
})

const disponibilidadValida = computed(() =>
  Boolean(productoSeleccionado.value)
  && (accionDisponibilidadDisponible.value || Boolean(motivoDisponibilidad.value.trim())),
)

const pedidosFiltrados = computed(() => {
  const termino = busqueda.value.toLocaleLowerCase('es-PE')
  return pedidos.value.filter((pedido) => {
    const coincideMesa = mesaSeleccionada.value === 'TODAS' || String(pedido.numeroMesa) === mesaSeleccionada.value
    if (!coincideMesa) return false
    if (!termino) return true
    const texto = [
      pedido.idPedido,
      pedido.numeroMesa,
      pedido.responsable,
      pedido.modalidad,
      pedido.clienteNombre,
      pedido.observacion,
      ...(pedido.detalles || []).map((detalle) => detalle.nombreAlimento),
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('es-PE')
    return texto.includes(termino)
  })
})

const pedidosPorEstado = computed(() =>
  Object.fromEntries(
    ESTADOS.map((estado) => [
      estado,
      pedidosFiltrados.value
        .filter((pedido) => pedido.estado === estado)
        .sort((a, b) => {
          const diferencia = new Date(a.fechaPedido) - new Date(b.fechaPedido)
          return estado === 'ENTREGADO' ? -diferencia : diferencia
        }),
    ]),
  ),
)

const cantidadFiltrada = computed(() =>
  columnasVisibles.value.reduce((total, columna) => total + pedidosPorEstado.value[columna.estado].length, 0),
)

const resumen = computed(() => {
  const activos = pedidos.value.filter((pedido) => pedido.estado !== 'ENTREGADO')
  const preparacionesCompletas = pedidos.value
    .filter((pedido) => pedido.fechaInicioPreparacion && pedido.fechaListo)
    .map((pedido) => Math.max(0, diferenciaMinutos(pedido.fechaInicioPreparacion, pedido.fechaListo)))
  const promedio = preparacionesCompletas.length
    ? Math.round(preparacionesCompletas.reduce((total, minutos) => total + minutos, 0) / preparacionesCompletas.length)
    : 0
  return {
    total: activos.length,
    preparacion: activos.filter((pedido) => pedido.estado === 'EN_PREPARACION').length,
    listos: activos.filter((pedido) => pedido.estado === 'LISTO').length,
    promedio,
    atrasados: activos.filter(esAtrasado).length,
  }
})

const ultimaActualizacionTexto = computed(() => {
  if (!ultimaActualizacion.value) return 'pendiente'
  const segundos = Math.floor((ahora.value - ultimaActualizacion.value.getTime()) / 1000)
  if (segundos < 10) return 'ahora'
  if (segundos < 60) return `hace ${segundos} s`
  return `hace ${Math.floor(segundos / 60)} min`
})

watch(
  preferencias,
  (valor) => {
    preferencias.umbralAtraso = Math.min(120, Math.max(5, Number(valor.umbralAtraso) || 25))
    localStorage.setItem('cocinaPreferencias', JSON.stringify({ ...valor }))
    configurarSincronizacion()
  },
  { deep: true },
)

onMounted(() => {
  reloj = window.setInterval(() => (ahora.value = Date.now()), 1000)
  document.addEventListener('visibilitychange', alCambiarVisibilidad)
  configurarSincronizacion()
  Promise.all([cargarPedidos(), cargarProductos(), cargarHistorial()])
})

onBeforeUnmount(() => {
  window.clearInterval(reloj)
  window.clearInterval(sincronizador)
  window.clearTimeout(temporizadorToast)
  document.removeEventListener('visibilitychange', alCambiarVisibilidad)
  document.body.classList.remove('modal-open')
})

async function cargarPedidos(silencioso = false) {
  if (cargando.value) return
  cargando.value = true
  if (!silencioso) errorCarga.value = ''
  try {
    pedidos.value = await cocinaService.getPedidos()
    ultimaActualizacion.value = new Date()
    errorCarga.value = ''
  } catch (error) {
    if (!silencioso || !pedidos.value.length) {
      errorCarga.value = mensajeError(error, 'No se pudo sincronizar el tablero de Cocina.')
    } else {
      mostrarNotificacion('error', 'No se pudo realizar la actualización automática.')
    }
  } finally {
    cargando.value = false
  }
}

async function cargarProductos(silencioso = false) {
  if (cargandoProductos.value) return
  cargandoProductos.value = true
  if (!silencioso) errorProductos.value = ''
  try {
    productos.value = await cocinaService.getProductos()
    errorProductos.value = ''
  } catch (error) {
    if (!silencioso || !productos.value.length) {
      errorProductos.value = mensajeError(error, 'No se pudo consultar la disponibilidad del menú.')
    }
  } finally {
    cargandoProductos.value = false
  }
}

async function cargarHistorial(silencioso = false) {
  if (cargandoHistorial.value) return
  cargandoHistorial.value = true
  if (!silencioso) errorHistorial.value = ''
  try {
    historial.value = await cocinaService.getHistorial(turnoSeleccionado.value)
    errorHistorial.value = ''
  } catch (error) {
    if (!silencioso || !historial.value) {
      errorHistorial.value = mensajeError(error, 'No se pudo consultar el historial del turno.')
    }
  } finally {
    cargandoHistorial.value = false
  }
}

async function avanzarPedido(pedido) {
  const accion = accionPedido(pedido)
  if (!accion || cargandoId.value !== null) return
  cargandoId.value = pedido.idPedido
  try {
    const actualizado = await cocinaService.actualizarEstado(pedido.idPedido, accion.destino)
    const indice = pedidos.value.findIndex((item) => item.idPedido === actualizado.idPedido)
    if (indice >= 0) pedidos.value.splice(indice, 1, actualizado)
    else pedidos.value.push(actualizado)
    const mensaje = `Pedido #${String(pedido.idPedido).padStart(5, '0')} · ${accion.confirmacion}`
    anuncio.value = mensaje
    mostrarNotificacion('success', mensaje)
    await Promise.allSettled([cargarProductos(true), cargarHistorial(true)])
  } catch (error) {
    const mensaje = mensajeError(error, 'No se pudo actualizar el pedido.')
    mostrarNotificacion('error', mensaje)
    if (error.response?.status === 409) await cargarPedidos(true)
  } finally {
    cargandoId.value = null
  }
}

function accionPedido(pedido) {
  return {
    RECIBIDO: {
      destino: 'EN_PREPARACION',
      etiqueta: 'Iniciar preparación',
      confirmacion: 'preparación iniciada e inventario actualizado',
      icono: 'bi bi-play-fill',
    },
    EN_PREPARACION: {
      destino: 'LISTO',
      etiqueta: 'Marcar como listo',
      confirmacion: 'marcado como listo',
      icono: 'bi bi-check2',
    },
    LISTO: {
      destino: 'ENTREGADO',
      etiqueta: 'Marcar como entregado',
      confirmacion: 'entrega registrada',
      icono: 'bi bi-check2-all',
    },
  }[pedido.estado]
}

function configurarSincronizacion() {
  window.clearInterval(sincronizador)
  sincronizador = null
  if (preferencias.actualizacionAutomatica) {
    sincronizador = window.setInterval(() => {
      if (document.visibilityState === 'visible') sincronizarOperacion()
    }, 30000)
  }
}

function alCambiarVisibilidad() {
  if (document.visibilityState === 'visible' && preferencias.actualizacionAutomatica) sincronizarOperacion()
}

function sincronizarOperacion() {
  cargarPedidos(true)
  cargarProductos(true)
  if (seccionActiva.value === 'HISTORIAL') cargarHistorial(true)
}

function abrirDisponibilidad(producto, disponible) {
  productoSeleccionado.value = producto
  accionDisponibilidadDisponible.value = disponible
  motivoDisponibilidad.value = disponible ? '' : producto.motivoBloqueoCocina || ''
  errorDisponibilidad.value = ''
  disponibilidadAbierta.value = true
  document.body.classList.add('modal-open')
}

function cerrarDisponibilidad() {
  if (procesandoProducto.value !== null) return
  disponibilidadAbierta.value = false
  productoSeleccionado.value = null
  motivoDisponibilidad.value = ''
  errorDisponibilidad.value = ''
  document.body.classList.remove('modal-open')
}

async function confirmarDisponibilidad() {
  if (!disponibilidadValida.value || procesandoProducto.value !== null) return
  procesandoProducto.value = productoSeleccionado.value.idAlimento
  errorDisponibilidad.value = ''
  try {
    const actualizado = await cocinaService.actualizarDisponibilidad(
      productoSeleccionado.value.idAlimento,
      accionDisponibilidadDisponible.value,
      accionDisponibilidadDisponible.value ? null : motivoDisponibilidad.value,
    )
    const indice = productos.value.findIndex((producto) => producto.idAlimento === actualizado.idAlimento)
    if (indice >= 0) productos.value.splice(indice, 1, actualizado)
    else productos.value.push(actualizado)
    const mensaje = accionDisponibilidadDisponible.value
      ? `${actualizado.nombreAlimento} fue reactivado para nuevas comandas.`
      : `${actualizado.nombreAlimento} fue notificado como agotado a Caja y Salón.`
    anuncio.value = mensaje
    mostrarNotificacion('success', mensaje)
    procesandoProducto.value = null
    cerrarDisponibilidad()
  } catch (error) {
    errorDisponibilidad.value = mensajeError(error, 'No se pudo actualizar la disponibilidad del producto.')
  } finally {
    procesandoProducto.value = null
  }
}

async function abrirPreferencias() {
  preferenciasAbiertas.value = true
  document.body.classList.add('modal-open')
  await nextTick()
  dialogoPreferencias.value?.focus()
}

function cerrarPreferencias() {
  preferenciasAbiertas.value = false
  document.body.classList.remove('modal-open')
}

function limpiarFiltros() {
  busqueda.value = ''
  mesaSeleccionada.value = 'TODAS'
}

function mostrarNotificacion(tipo, mensaje) {
  notificacion.value = { tipo, mensaje }
  window.clearTimeout(temporizadorToast)
  temporizadorToast = window.setTimeout(() => (notificacion.value = null), 4500)
}

function esAtrasado(pedido) {
  if (pedido.estado === 'ENTREGADO') return false
  return diferenciaMinutos(pedido.fechaPedido, ahora.value) >= preferencias.umbralAtraso
}

function tiempoPrincipal(pedido) {
  const inicio = pedido.estado === 'EN_PREPARACION' ? pedido.fechaInicioPreparacion || pedido.fechaPedido : pedido.fechaPedido
  const fin = pedido.estado === 'ENTREGADO' ? pedido.fechaEntregado : ahora.value
  return formatearDuracion(diferenciaMinutos(inicio, fin))
}

function tiempoPreparacion(pedido) {
  return formatearDuracion(diferenciaMinutos(pedido.fechaInicioPreparacion || pedido.fechaPedido, ahora.value))
}

function duracionPreparacionReal(pedido) {
  if (!pedido.fechaInicioPreparacion || !pedido.fechaListo) return '-'
  return formatearDuracion(diferenciaMinutos(pedido.fechaInicioPreparacion, pedido.fechaListo))
}

function cantidadPlatos(pedido) {
  return (pedido.detalles || []).reduce((total, detalle) => total + Number(detalle.cantidad || 0), 0)
}

function desdeHace(fecha) {
  return formatearDuracion(diferenciaMinutos(fecha, ahora.value))
}

function diferenciaMinutos(inicio, fin) {
  const desde = new Date(inicio).getTime()
  const hasta = fin instanceof Date ? fin.getTime() : typeof fin === 'number' ? fin : new Date(fin).getTime()
  if (Number.isNaN(desde) || Number.isNaN(hasta)) return 0
  return Math.max(0, Math.floor((hasta - desde) / 60000))
}

function formatearDuracion(minutos) {
  if (minutos < 60) return `${minutos} min`
  return `${Math.floor(minutos / 60)} h ${String(minutos % 60).padStart(2, '0')} min`
}

function hora(fecha) {
  if (!fecha) return '-'
  const valor = new Date(fecha)
  if (Number.isNaN(valor.getTime())) return '-'
  return new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit' }).format(valor)
}

function formatearFechaHora(fecha) {
  if (!fecha) return '-'
  const valor = new Date(fecha)
  if (Number.isNaN(valor.getTime())) return '-'
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(valor)
}

function formatearRangoTurno(resumenTurno) {
  if (!resumenTurno?.desde || !resumenTurno?.hasta) return 'Horario no disponible'
  const desde = new Date(resumenTurno.desde)
  const hasta = new Date(resumenTurno.hasta)
  if (Number.isNaN(desde.getTime()) || Number.isNaN(hasta.getTime())) return 'Horario no disponible'
  const fecha = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'long' }).format(desde)
  return `${fecha} · ${hora(desde)} a ${hora(hasta)}`
}

function estadoProducto(producto) {
  if (producto.bloqueadoCocina) return { etiqueta: 'Agotado notificado', clase: 'is-blocked' }
  if (producto.disponibleParaPedidos) return { etiqueta: 'Disponible', clase: 'is-available' }
  return { etiqueta: 'No disponible', clase: 'is-unavailable' }
}

function ubicacionPedido(pedido) {
  if (pedido.numeroMesa !== null && pedido.numeroMesa !== undefined) return `Mesa ${pedido.numeroMesa}`
  const modalidad = String(pedido.modalidad || '').toUpperCase()
  const etiqueta = modalidad.includes('DELIVERY') ? 'Delivery' : 'Para llevar'
  return pedido.clienteNombre ? `${etiqueta} · ${pedido.clienteNombre}` : etiqueta
}

function mensajeVacio(estado) {
  return {
    RECIBIDO: { titulo: 'Sin pedidos nuevos', detalle: 'Los nuevos pedidos aparecerán aquí.' },
    EN_PREPARACION: { titulo: 'Nada en preparación', detalle: 'Inicia un pedido de la columna Recibido.' },
    LISTO: { titulo: 'Sin pedidos listos', detalle: 'Los platos terminados aparecerán aquí.' },
    ENTREGADO: { titulo: 'Sin entregas recientes', detalle: 'Las entregas completadas aparecerán aquí.' },
  }[estado]
}

function mensajeError(error, alternativo) {
  return error.response?.data?.mensaje || error.response?.data?.message || error.response?.data?.error || alternativo
}

function leerPreferencias() {
  try {
    return JSON.parse(localStorage.getItem('cocinaPreferencias')) || {}
  } catch {
    return {}
  }
}
</script>
