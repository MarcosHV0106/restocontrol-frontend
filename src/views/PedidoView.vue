<template>
  <div class="layout">
    <SidebarComponent />
    <div class="main-content">
      <NavbarComponent />

      <main class="container-fluid p-4 pedidos-page">
        <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
          <div>
            <h2 class="fw-bold text-dark mb-1">Gestión de Pedidos</h2>
            <p class="text-muted mb-0">
              {{
                esAdministrador
                  ? 'Consulta y administra los pedidos creados por todo el personal.'
                  : 'Consulta y administra únicamente los pedidos que has creado.'
              }}
            </p>
          </div>
          <button class="btn btn-primary d-flex align-items-center gap-2" :disabled="cargando" @click="cargarPedidos">
            <span v-if="cargando" class="spinner-border spinner-border-sm"></span>
            <i v-else class="bi bi-arrow-clockwise"></i>
            Actualizar
          </button>
        </div>

        <div v-if="errorCarga" class="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <span>{{ errorCarga }}</span>
        </div>

        <div class="card border-0 shadow-sm pedidos-card">
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
                  <td class="fw-semibold">#{{ pedido.idPedido }}</td>
                  <td class="text-nowrap">{{ formatearFecha(pedido.fechaPedido) }}</td>
                  <td class="text-nowrap">Mesa {{ pedido.mesa?.numeroMesa ?? '-' }}</td>
                  <td v-if="esAdministrador">
                    <div class="d-flex align-items-center gap-2">
                      <span class="creator-avatar"><i class="bi bi-person"></i></span>
                      <div>
                        <div class="fw-semibold">{{ nombreCreador(pedido) }}</div>
                        <small class="text-muted">{{ pedido.usuario?.rol?.nombreRol || 'Sin rol' }}</small>
                      </div>
                    </div>
                  </td>
                  <td class="observacion-cell">{{ pedido.observacion || 'Sin observaciones' }}</td>
                  <td class="fw-bold text-nowrap">S/ {{ formatearMonto(pedido.total) }}</td>
                  <td>
                    <span :class="['badge rounded-pill', claseEstado(pedido.estadoPedido?.nombreEstado)]">
                      {{ pedido.estadoPedido?.nombreEstado || 'SIN ESTADO' }}
                    </span>
                  </td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary text-nowrap" @click="abrirPedido(pedido)">
                      <i :class="['bi me-1', pedidoCerrado(pedido) ? 'bi-eye' : 'bi-pencil-square']"></i>
                      {{ pedidoCerrado(pedido) ? 'Ver detalle' : 'Ver / Editar' }}
                    </button>
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
  background: #fcfaf8;
  min-height: 100vh;
}

.pedidos-card {
  border-radius: 14px;
  overflow: hidden;
}

.table th,
.table td {
  padding: 1rem;
  vertical-align: middle;
}

.table th {
  color: #6b625d;
  font-size: 0.78rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.observacion-cell {
  min-width: 180px;
  max-width: 280px;
  color: #6c757d;
}

.creator-avatar {
  align-items: center;
  background: #f6e8df;
  border-radius: 50%;
  color: #c5633a;
  display: inline-flex;
  height: 34px;
  justify-content: center;
  min-width: 34px;
}
</style>
