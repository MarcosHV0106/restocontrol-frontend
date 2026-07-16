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
            <p class="text-muted mb-0">
              {{
                esAdministrador
                  ? 'Consulta y administra los pedidos creados por todo el personal.'
                  : 'Consulta y administra únicamente los pedidos que has creado.'
              }}
            </p>
            </div>
          </div>
          <button class="orders-refresh" :disabled="cargando" @click="cargarPedidos">
            <span v-if="cargando" class="spinner-border spinner-border-sm"></span>
            <i v-else class="bi bi-arrow-clockwise"></i>
            Actualizar
          </button>
        </header>

        <section class="orders-summary" aria-label="Resumen de pedidos">
          <article><i class="bi bi-receipt"></i><div><span>Pedidos visibles</span><strong>{{ pedidos.length }}</strong></div></article>
          <article><i class="bi bi-hourglass-split"></i><div><span>En curso</span><strong>{{ pedidosEnCurso }}</strong></div></article>
          <article><i class="bi bi-check2-circle"></i><div><span>Listos</span><strong>{{ pedidosListos }}</strong></div></article>
          <article><i class="bi bi-shield-check"></i><div><span>Cerrados</span><strong>{{ pedidosCerrados }}</strong></div></article>
        </section>

        <div v-if="errorCarga" class="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <span>{{ errorCarga }}</span>
        </div>

        <div class="card pedidos-card">
          <div class="card-body border-bottom p-3 p-md-4">
            <div class="row g-3">
              <div class="col-md-8">
                <label for="buscarPedido" class="form-label small fw-semibold">Buscar pedido</label>
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0"><i class="bi bi-search"></i></span>
                  <input
                    id="buscarPedido"
                    v-model.trim="busqueda"
                    type="search"
                    class="form-control border-start-0"
                    :placeholder="esAdministrador ? 'Pedido, mesa, observación o creador' : 'Pedido, mesa u observación'"
                  />
                </div>
              </div>
              <div class="col-md-4">
                <label for="estadoPedido" class="form-label small fw-semibold">Estado</label>
                <select id="estadoPedido" v-model="filtroEstado" class="form-select">
                  <option value="TODOS">Todos los estados</option>
                  <option v-for="estado in estadosDisponibles" :key="estado" :value="estado">
                    {{ estado }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Pedido</th>
                  <th>Fecha</th>
                  <th>Mesa</th>
                  <th v-if="esAdministrador">Creado por</th>
                  <th>Observación</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th class="text-end">Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="cargando">
                  <td :colspan="esAdministrador ? 8 : 7" class="text-center py-5 text-muted">
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Cargando pedidos...
                  </td>
                </tr>

                <tr v-else-if="pedidosFiltrados.length === 0">
                  <td :colspan="esAdministrador ? 8 : 7" class="text-center py-5">
                    <i class="bi bi-receipt fs-1 text-muted opacity-50"></i>
                    <p class="text-muted mb-0 mt-2">No hay pedidos que coincidan con los filtros.</p>
                  </td>
                </tr>

                <tr v-for="pedido in pedidosFiltrados" v-else :key="pedido.idPedido">
                  <td data-label="Pedido" class="fw-semibold">#{{ pedido.idPedido }}</td>
                  <td data-label="Fecha" class="text-nowrap">{{ formatearFecha(pedido.fechaPedido) }}</td>
                  <td data-label="Mesa" class="text-nowrap">Mesa {{ pedido.mesa?.numeroMesa ?? '-' }}</td>
                  <td v-if="esAdministrador" data-label="Creado por">
                    <div class="d-flex align-items-center gap-2">
                      <span class="creator-avatar"><i class="bi bi-person"></i></span>
                      <div>
                        <div class="fw-semibold">{{ nombreCreador(pedido) }}</div>
                        <small class="text-muted">{{ pedido.usuario?.rol?.nombreRol || 'Sin rol' }}</small>
                      </div>
                    </div>
                  </td>
                  <td data-label="Observación" class="observacion-cell">{{ pedido.observacion || 'Sin observaciones' }}</td>
                  <td data-label="Total" class="fw-bold text-nowrap">S/ {{ formatearMonto(pedido.total) }}</td>
                  <td data-label="Estado">
                    <span :class="['badge rounded-pill', claseEstado(pedido.estadoPedido?.nombreEstado)]">
                      {{ pedido.estadoPedido?.nombreEstado || 'SIN ESTADO' }}
                    </span>
                  </td>
                  <td data-label="Acción" class="text-end">
                    <div class="d-flex justify-content-end flex-wrap gap-2">
                      <button
                        v-if="!pedidoCerrado(pedido)"
                        class="btn btn-sm btn-primary text-nowrap"
                        @click="irACaja(pedido)"
                      >
                        <i class="bi bi-wallet2 me-1"></i>
                        Cobrar
                      </button>
                      <button class="btn btn-sm btn-outline-primary text-nowrap" @click="abrirPedido(pedido)">
                        <i :class="['bi me-1', pedidoCerrado(pedido) ? 'bi-eye' : 'bi-pencil-square']"></i>
                        {{ pedidoCerrado(pedido) ? 'Ver detalle' : 'Ver / Editar' }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import NavbarComponent from '@/components/NavbarComponent.vue';
import SidebarComponent from '@/components/SidebarComponent.vue';
import pedidoService from '@/services/pedidoService';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

const pedidos = ref([]);
const cargando = ref(false);
const errorCarga = ref('');
const busqueda = ref('');
const filtroEstado = ref('TODOS');

const esAdministrador = computed(() => String(authStore.usuario?.rol || '').toUpperCase() === 'ADMIN');

const estadosDisponibles = computed(() =>
  [...new Set(pedidos.value.map((pedido) => pedido.estadoPedido?.nombreEstado).filter(Boolean))].sort(),
);

const pedidosFiltrados = computed(() => {
  const termino = busqueda.value.toLocaleLowerCase('es');

  return pedidos.value.filter((pedido) => {
    const estado = pedido.estadoPedido?.nombreEstado || '';
    const coincideEstado = filtroEstado.value === 'TODOS' || estado === filtroEstado.value;
    const campos = [
      pedido.idPedido,
      pedido.mesa?.numeroMesa,
      pedido.observacion,
      esAdministrador.value ? nombreCreador(pedido) : '',
    ]
      .filter((campo) => campo !== null && campo !== undefined)
      .join(' ')
      .toLocaleLowerCase('es');

    return coincideEstado && (!termino || campos.includes(termino));
  });
});
const pedidosCerrados = computed(() => pedidos.value.filter(pedidoCerrado).length);
const pedidosListos = computed(() => pedidos.value.filter(pedido => String(pedido.estadoPedido?.nombreEstado || '').toUpperCase() === 'LISTO').length);
const pedidosEnCurso = computed(() => pedidos.value.length - pedidosCerrados.value);

const cargarPedidos = async () => {
  cargando.value = true;
  errorCarga.value = '';
  try {
    pedidos.value = await pedidoService.getPedidos();
  } catch (error) {
    pedidos.value = [];
    errorCarga.value = error.response?.data?.mensaje || 'No se pudieron cargar los pedidos.';
  } finally {
    cargando.value = false;
  }
};

const abrirPedido = (pedido) => {
  router.push({
    path: '/nuevo-pedido',
    query: {
      idPedido: pedido.idPedido,
      idMesa: pedido.mesa?.idMesa,
      numeroMesa: pedido.mesa?.numeroMesa,
      origen: 'pedidos',
    },
  });
};

const irACaja = (pedido) => {
  router.push({ path: '/caja', query: { idPedido: pedido.idPedido } });
};

const nombreCreador = (pedido) => {
  const nombreCompleto = [pedido.usuario?.nombre, pedido.usuario?.apellido].filter(Boolean).join(' ');
  return nombreCompleto || pedido.usuario?.correo || 'Usuario no disponible';
};

const formatearMonto = (monto) => Number(monto || 0).toFixed(2);

const formatearFecha = (fecha) => {
  if (!fecha) return '-';
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return '-';
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(valor);
};

const pedidoCerrado = (pedido) => {
  const estado = String(pedido.estadoPedido?.nombreEstado || '').toUpperCase();
  return pedido.estadoPedido?.idEstadoPedido === 4 || ['PAGADO', 'COBRADO', 'CANCELADO'].includes(estado);
};

const claseEstado = (estado) => {
  const mapa = {
    PENDIENTE: 'text-bg-warning',
    'EN PREPARACIÓN': 'text-bg-info',
    PREPARANDO: 'text-bg-info',
    LISTO: 'text-bg-primary',
    PAGADO: 'text-bg-success',
    COBRADO: 'text-bg-success',
    CANCELADO: 'text-bg-danger',
  };
  return mapa[String(estado || '').toUpperCase()] || 'text-bg-secondary';
};

onMounted(cargarPedidos);
</script>

<style scoped>
.pedidos-page {
  background: var(--rc-page);
  min-height: calc(100vh - 68px);
  padding: 1.25rem 1.5rem 2rem;
}
.orders-heading { align-items: center; display: flex; gap: 1rem; justify-content: space-between; margin-bottom: .85rem; }
.orders-title-group { align-items: center; display: flex; gap: .75rem; }
.orders-title-icon { align-items: center; background: linear-gradient(135deg, var(--rc-primary), #e88960); border-radius: 12px; box-shadow: 0 5px 14px rgba(190,80,42,.2); color: #fff; display: flex; flex: 0 0 auto; font-size: 1.1rem; height: 44px; justify-content: center; width: 44px; }
.orders-heading h1 { color: var(--rc-ink); font-size: clamp(1.45rem, 2vw, 1.8rem); font-weight: 780; letter-spacing: -.035em; margin: 0; }
.orders-heading p { color: var(--rc-muted) !important; font-size: .78rem; margin-top: .18rem; }
.orders-refresh { align-items: center; background: var(--rc-primary); border: 1px solid var(--rc-primary); border-radius: 9px; color: #fff; display: inline-flex; font-size: .7rem; font-weight: 700; gap: .4rem; justify-content: center; min-height: 40px; padding: .45rem .75rem; }
.orders-refresh:hover:not(:disabled) { background: var(--rc-primary-hover); }
.orders-refresh:disabled { background: #cbbdb6; border-color: #cbbdb6; }
.orders-summary { display: grid; gap: .7rem; grid-template-columns: repeat(4, minmax(0,1fr)); margin-bottom: .85rem; }
.orders-summary article { align-items: center; background: var(--rc-surface); border: 1px solid var(--rc-border); border-radius: 11px; display: flex; gap: .65rem; padding: .68rem .78rem; }
.orders-summary article > i { align-items: center; background: var(--rc-primary-soft); border-radius: 8px; color: var(--rc-primary-hover); display: flex; height: 34px; justify-content: center; width: 34px; }
.orders-summary article:nth-child(2) > i { background: var(--rc-warning-soft); color: var(--rc-warning); }
.orders-summary article:nth-child(3) > i { background: var(--rc-info-soft); color: var(--rc-info); }
.orders-summary article:nth-child(4) > i { background: var(--rc-success-soft); color: var(--rc-success); }
.orders-summary span { color: var(--rc-muted); display: block; font-size: .56rem; }
.orders-summary strong { color: var(--rc-ink); display: block; font-size: .9rem; }
.pedidos-page > .alert { border: 1px solid #efc8c5; border-radius: 9px; font-size: .7rem; }
.pedidos-card {
  background: var(--rc-surface);
  border: 1px solid var(--rc-border) !important;
  border-radius: 13px;
  box-shadow: var(--rc-shadow-xs);
  overflow: hidden;
}
.pedidos-card .card-body { background: var(--rc-surface); border-color: var(--rc-border) !important; }
.pedidos-card .form-label { color: var(--rc-ink-soft); font-size: .64rem !important; }
.pedidos-card .input-group-text { border-color: var(--rc-border); color: var(--rc-muted); }
.pedidos-card .table { min-width: 850px; }
.pedidos-card .table-light { --bs-table-bg: #f8f4f1; }
.pedidos-card .table tbody tr { transition: background .18s; }
.pedidos-card .badge { font-size: .58rem; padding: .35rem .52rem; }
.pedidos-card .btn-sm { border-radius: 7px; font-size: .62rem; min-height: 34px; }
.creator-avatar { align-items: center; background: var(--rc-primary-soft); border-radius: 50%; color: var(--rc-primary-hover); display: inline-flex; height: 34px; justify-content: center; min-width: 34px; }
.observacion-cell { color: var(--rc-muted); max-width: 260px; min-width: 160px; }
.table th,
.table td { padding: .8rem; vertical-align: middle; }
.table th { color: #6b625d; font-size: .65rem; letter-spacing: .03em; text-transform: uppercase; }
body.dark-theme .pedidos-card .table-light { --bs-table-bg: #333334; }
body.dark-theme .pedidos-card .input-group-text { background: #383839 !important; }
@media (max-width: 991.98px) { .orders-summary { grid-template-columns: 1fr 1fr; } }
@media (max-width: 767.98px) {
  .pedidos-page { padding: 1rem; }
  .orders-heading { align-items: flex-start; flex-direction: column; }
  .orders-refresh { width: 100%; }
  .pedidos-card { background: transparent; border: 0 !important; box-shadow: none; overflow: visible; }
  .pedidos-card .card-body { border: 1px solid var(--rc-border) !important; border-radius: 12px; margin-bottom: .75rem; padding: .75rem !important; }
  .pedidos-card .table-responsive { overflow: visible; }
  .pedidos-card .table { min-width: 0; }
  .pedidos-card thead { display: none; }
  .pedidos-card tbody { display: grid; gap: .7rem; }
  .pedidos-card tbody tr { background: var(--rc-surface); border: 1px solid var(--rc-border); border-radius: 12px; box-shadow: var(--rc-shadow-xs); display: block; padding: .35rem .75rem; }
  .pedidos-card tbody td { align-items: center; border-bottom: 1px solid var(--rc-border); display: flex; gap: .75rem; justify-content: space-between; max-width: none; min-height: 40px; padding: .5rem 0; text-align: right !important; white-space: normal !important; }
  .pedidos-card tbody td::before { color: var(--rc-muted); content: attr(data-label); flex: 0 0 31%; font-size: .54rem; font-weight: 760; letter-spacing: .025em; text-align: left; text-transform: uppercase; }
  .pedidos-card tbody td:last-child { border-bottom: 0; }
  .pedidos-card tbody td[colspan] { display: block; padding: 2rem .5rem; }
  .pedidos-card tbody td[colspan]::before { display: none; }
  .pedidos-card tbody td .d-flex { justify-content: flex-end !important; }
  .pedidos-card tbody td[data-label="Creado por"] .d-flex { text-align: left; }
}
@media (max-width: 420px) {
  .orders-summary { gap: .5rem; }
  .orders-summary article { padding: .58rem; }
  .orders-summary article > i { height: 31px; width: 31px; }
}
</style>
