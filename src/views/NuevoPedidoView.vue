<template>
  <div class="layout">
    <SidebarComponent />
    <div class="main-content">
      <NavbarComponent />

      <main class="p-4 bg-resto-light min-vh-100">
        <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
          <div>
            <h2 class="page-title mb-1">
              <i class="bi bi-journal-text me-2"></i>
              {{ tituloPagina }}
            </h2>
            <p class="page-subtitle mb-0">
              {{ soloLectura ? 'Consulta la información registrada en esta orden.' : 'Registra productos y administra la orden de la mesa.' }}
            </p>
          </div>
          <button class="btn btn-outline-secondary" @click="regresar">
            <i class="bi bi-arrow-left me-1"></i>
            Volver
          </button>
        </div>

        <div v-if="errorCarga" class="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <span>{{ errorCarga }}</span>
        </div>

        <div class="d-flex flex-wrap gap-3 align-items-center mb-4">
          <div class="contenedor-info">
            <i class="bi bi-grid text-brand"></i>
            <div class="d-flex flex-column">
              <span class="info-label">Mesa</span>
              <span class="info-value">{{ numeroMesaFormateado }}</span>
            </div>
          </div>

          <div class="contenedor-info">
            <i class="bi bi-calendar3 text-muted"></i>
            <div class="d-flex flex-column">
              <span class="info-label">Fecha del pedido</span>
              <span class="info-value">{{ fechaPedidoFormateada }}</span>
            </div>
          </div>

          <div class="contenedor-info">
            <i class="bi bi-clock text-muted"></i>
            <div class="d-flex flex-column">
              <span class="info-label">Estado</span>
              <span class="info-value">{{ estadoMostrado }}</span>
            </div>
          </div>

          <div v-if="mostrarCreador" class="contenedor-info creador-info">
            <i class="bi bi-person-badge text-brand"></i>
            <div class="d-flex flex-column">
              <span class="info-label">Creado por</span>
              <span class="info-value">{{ nombreCreador }}</span>
              <small class="text-muted">{{ usuarioCreador.rol?.nombreRol || 'Sin rol' }}</small>
            </div>
          </div>
        </div>

        <div v-if="soloLectura" class="alert alert-success d-flex align-items-center gap-2">
          <i class="bi bi-lock-fill"></i>
          Este pedido está cerrado y se muestra en modo de solo lectura.
        </div>

        <div class="row g-4">
          <div class="col-lg-8">
            <div class="categories-scroll d-flex gap-2 mb-4 pb-2">
              <button
                v-for="categoria in categorias"
                :key="categoria.id"
                type="button"
                :class="['btn-cat', { active: categoriaSeleccionada === categoria.id }]"
                @click="categoriaSeleccionada = categoria.id"
              >
                {{ categoria.nombre }}
              </button>
            </div>

            <div v-if="cargandoAlimentos" class="text-center py-5">
              <div class="spinner-border text-brand" role="status"></div>
              <p class="text-muted mt-2">Cargando menú...</p>
            </div>

            <div v-else class="row g-3">
              <div v-for="alimento in alimentosFiltrados" :key="alimento.idAlimento" class="col-6 col-md-4 col-xl-3">
                <button
                  type="button"
                  class="card h-100 w-100 border-0 shadow-sm food-card text-start"
                  :class="{ 'food-card-disabled': soloLectura || !!errorCarga }"
                  :disabled="soloLectura || !!errorCarga"
                  @click="agregarAlCarrito(alimento)"
                >
                  <span class="food-img-placeholder">
                    <i class="bi bi-egg-fried"></i>
                  </span>
                  <span class="card-body p-3 d-flex flex-column justify-content-between w-100">
                    <span class="fw-bold text-dark mb-1">{{ alimento.nombreAlimento }}</span>
                    <span class="text-brand fw-bold mt-2">S/ {{ formatearMonto(alimento.precio) }}</span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div class="col-lg-4">
            <div class="card border-0 shadow-lg order-panel sticky-lg-top">
              <div class="card-header bg-white border-0 pt-4 px-4">
                <h5 class="fw-bold text-dark mb-0">Detalle del Pedido</h5>
              </div>

              <div class="card-body px-4 d-flex flex-column order-panel-body">
                <div class="flex-grow-1 overflow-auto pe-2 mb-3 custom-scroll">
                  <div v-if="carrito.length === 0" class="empty-cart-state text-center py-5">
                    <i class="bi bi-basket fs-1 text-muted opacity-50"></i>
                    <p class="text-muted mt-3">Aún no hay platos en esta cuenta.</p>
                  </div>

                  <div v-for="item in carrito" v-else :key="item.idAlimento" class="cart-item mb-3 p-3 rounded-3">
                    <div class="d-flex justify-content-between align-items-start mb-2 gap-2">
                      <div>
                        <div class="fw-bold text-dark">{{ item.nombreAlimento }}</div>
                        <div class="text-muted item-price">S/ {{ formatearMonto(item.precio) }} c/u</div>
                      </div>
                      <div class="fw-bold text-dark text-nowrap">
                        S/ {{ formatearMonto(item.precio * item.cantidad) }}
                      </div>
                    </div>
                    <div class="d-flex align-items-center">
                      <div class="qty-selector border shadow-sm">
                        <button type="button" :disabled="soloLectura" @click="reducirCantidad(item)">−</button>
                        <span>{{ item.cantidad }}</span>
                        <button type="button" :disabled="soloLectura" @click="incrementarCantidad(item)">+</button>
                      </div>
                      <button
                        v-if="!soloLectura"
                        type="button"
                        class="btn btn-link btn-sm text-danger ms-auto p-0"
                        aria-label="Quitar producto"
                        @click="quitarItem(item)"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div class="order-summary border-top pt-3">
                  <textarea
                    v-model="observacion"
                    class="form-control form-control-sm bg-light mb-3"
                    rows="2"
                    maxlength="250"
                    placeholder="Observaciones (ej. término medio, sin sal...)"
                    :disabled="soloLectura"
                  ></textarea>

                  <div class="d-flex justify-content-between mb-1 small text-muted">
                    <span>Subtotal</span>
                    <span>S/ {{ formatearMonto(subtotal) }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-1 small text-muted">
                    <span>IGV (18%)</span>
                    <span>S/ {{ formatearMonto(igv) }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-3 fw-bold fs-5 text-dark">
                    <span>Total</span>
                    <span>S/ {{ formatearMonto(totalCalculado) }}</span>
                  </div>

                  <button
                    v-if="!soloLectura"
                    type="button"
                    class="btn btn-brand w-100 py-3 text-white fw-bold shadow-sm rounded-3"
                    :disabled="carrito.length === 0 || cargando || !!errorCarga"
                    @click="procesarPedido"
                  >
                    <span v-if="cargando" class="spinner-border spinner-border-sm me-2"></span>
                    {{ esEdicion ? 'Actualizar orden' : 'Registrar pedido' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NavbarComponent from '@/components/NavbarComponent.vue';
import SidebarComponent from '@/components/SidebarComponent.vue';
import pedidoService from '@/services/pedidoService';
import * as menuService from '@/services/menuService';
import { useAuthStore } from '@/stores/authStore';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const convertirId = (valor) => {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
};

const idPedido = ref(convertirId(route.query.idPedido));
const idMesa = ref(convertirId(route.query.idMesa));
const numeroMesa = ref(convertirId(route.query.numeroMesa) || idMesa.value || 0);
const pedidoCargado = ref(null);
const usuarioCreador = ref(null);
const estadoPedido = ref(null);
const fechaPedido = ref(null);

const cargandoAlimentos = ref(false);
const cargando = ref(false);
const errorCarga = ref('');
const categoriaSeleccionada = ref(0);
const observacion = ref('');
const carrito = ref([]);
const alimentos = ref([]);
const categorias = ref([{ id: 0, nombre: 'Todos' }]);

const esEdicion = computed(() => !!idPedido.value);
const esAdministrador = computed(() => String(authStore.usuario?.rol || '').toUpperCase() === 'ADMIN');
const mostrarCreador = computed(() => esAdministrador.value && esEdicion.value && !!usuarioCreador.value);
const nombreCreador = computed(() => {
  if (!usuarioCreador.value) return 'Usuario no disponible';
  return (
    [usuarioCreador.value.nombre, usuarioCreador.value.apellido].filter(Boolean).join(' ') ||
    usuarioCreador.value.correo ||
    'Usuario no disponible'
  );
});

const nombreEstado = computed(() => String(estadoPedido.value?.nombreEstado || '').toUpperCase());
const soloLectura = computed(
  () =>
    estadoPedido.value?.idEstadoPedido === 4 ||
    ['PAGADO', 'COBRADO', 'CANCELADO'].includes(nombreEstado.value),
);
const estadoMostrado = computed(() => estadoPedido.value?.nombreEstado || (esEdicion.value ? 'EN CURSO' : 'NUEVA ORDEN'));
const tituloPagina = computed(() => {
  if (!esEdicion.value) return 'Nuevo Pedido';
  return soloLectura.value ? `Pedido #${idPedido.value}` : `Editar Pedido #${idPedido.value}`;
});
const numeroMesaFormateado = computed(() => String(numeroMesa.value || 0).padStart(2, '0'));

const fechaPedidoFormateada = computed(() => {
  const fecha = fechaPedido.value ? new Date(fechaPedido.value) : new Date();
  if (Number.isNaN(fecha.getTime())) return '-';
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha);
});

const alimentosFiltrados = computed(() => {
  if (categoriaSeleccionada.value === 0) return alimentos.value;
  return alimentos.value.filter(
    (alimento) => alimento.categoria?.idCategoria === categoriaSeleccionada.value,
  );
});

const totalCalculado = computed(() =>
  carrito.value.reduce((total, item) => total + Number(item.precio) * item.cantidad, 0),
);
const subtotal = computed(() => totalCalculado.value / 1.18);
const igv = computed(() => totalCalculado.value - subtotal.value);

const cargarDatosBase = async () => {
  cargandoAlimentos.value = true;
  errorCarga.value = '';
  try {
    const [respuestaAlimentos, respuestaCategorias] = await Promise.all([
      menuService.obtenerAlimentos(),
      menuService.obtenerCategorias(),
    ]);

    alimentos.value = respuestaAlimentos
      .filter((alimento) => alimento.disponible && !alimento.eliminado)
      .map((alimento) => ({ ...alimento, precio: Number(alimento.precio || 0) }));
    categorias.value = [
      { id: 0, nombre: 'Todos' },
      ...respuestaCategorias
        .filter((categoria) => !categoria.eliminado)
        .map((categoria) => ({ id: categoria.idCategoria, nombre: categoria.nombreCategoria })),
    ];

    await cargarPedido();
  } catch (error) {
    errorCarga.value = error.response?.data?.mensaje || 'No se pudo cargar la información del pedido.';
  } finally {
    cargandoAlimentos.value = false;
  }
};

const cargarPedido = async () => {
  let pedido = null;
  if (idPedido.value) {
    pedido = await pedidoService.getPedidoPorId(idPedido.value);
  } else if (idMesa.value) {
    pedido = await pedidoService.getPedidoPorMesa(idMesa.value);
  }

  if (!pedido) return;

  pedidoCargado.value = pedido;
  idPedido.value = pedido.idPedido;
  idMesa.value = pedido.mesa?.idMesa || idMesa.value;
  numeroMesa.value = pedido.mesa?.numeroMesa || numeroMesa.value;
  usuarioCreador.value = pedido.usuario || null;
  estadoPedido.value = pedido.estadoPedido || null;
  fechaPedido.value = pedido.fechaPedido || null;
  observacion.value = pedido.observacion || '';
  carrito.value = (pedido.detalles || []).map((detalle) => {
    const idAlimento = detalle.alimento?.idAlimento || detalle.idAlimento;
    const alimentoMenu = alimentos.value.find((alimento) => alimento.idAlimento === idAlimento);
    return {
      idAlimento,
      nombreAlimento: detalle.alimento?.nombreAlimento || alimentoMenu?.nombreAlimento || 'Plato',
      precio: Number(detalle.precioUnitario ?? alimentoMenu?.precio ?? 0),
      cantidad: Number(detalle.cantidad || 0),
    };
  });
};

const agregarAlCarrito = (alimento) => {
  if (soloLectura.value) return;
  const existente = carrito.value.find((item) => item.idAlimento === alimento.idAlimento);
  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.value.push({
      idAlimento: alimento.idAlimento,
      nombreAlimento: alimento.nombreAlimento,
      precio: Number(alimento.precio || 0),
      cantidad: 1,
    });
  }
};

const incrementarCantidad = (item) => {
  if (!soloLectura.value) item.cantidad += 1;
};

const reducirCantidad = (item) => {
  if (!soloLectura.value && item.cantidad > 1) item.cantidad -= 1;
};

const quitarItem = (item) => {
  if (!soloLectura.value) {
    carrito.value = carrito.value.filter((producto) => producto.idAlimento !== item.idAlimento);
  }
};

const procesarPedido = async () => {
  if (soloLectura.value || !idMesa.value || carrito.value.length === 0) return;

  cargando.value = true;
  try {
    const pedidoDto = {
      idMesa: idMesa.value,
      idModalidadPedido: pedidoCargado.value?.modalidadPedido?.idModalidadPedido || 1,
      observacion: observacion.value,
      detalles: carrito.value.map((item) => ({
        idAlimento: item.idAlimento,
        cantidad: item.cantidad,
      })),
    };

    if (esEdicion.value) {
      await pedidoService.updatePedido(idPedido.value, pedidoDto);
    } else {
      await pedidoService.createPedido(pedidoDto);
    }

    await router.push(route.query.origen === 'pedidos' ? '/pedidos' : '/mesas');
  } catch (error) {
    errorCarga.value = error.response?.data?.mensaje || 'No se pudo guardar el pedido.';
  } finally {
    cargando.value = false;
  }
};

const regresar = () => {
  router.push(route.query.origen === 'pedidos' ? '/pedidos' : '/mesas');
};

const formatearMonto = (monto) => Number(monto || 0).toFixed(2);

onMounted(cargarDatosBase);
</script>

<style scoped>
:root {
  --brand-color: #dc7448;
}

.bg-resto-light {
  background-color: #fcfaf8;
}

.page-title {
  color: #2c2c2c;
  font-weight: 700;
}

.page-subtitle {
  color: #777;
}

.text-brand {
  color: #dc7448;
}

.btn-brand {
  background-color: #dc7448;
  border: none;
  color: white;
}

.btn-brand:hover {
  background-color: #c5633a;
  color: white;
}

.contenedor-info {
  align-items: center;
  background: #fff;
  border: 1px solid #f0e6da;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 4%);
  display: inline-flex;
  gap: 10px;
  min-height: 64px;
  padding: 12px 20px;
}

.creador-info {
  border-color: #e7c7b5;
}

.info-label {
  color: #8c8c8c;
  font-size: 0.7rem;
  font-weight: 500;
}

.info-value {
  color: #2c2c2c;
  font-size: 0.95rem;
  font-weight: 700;
}

.categories-scroll {
  overflow-x: auto;
  white-space: nowrap;
}

.btn-cat {
  background: white;
  border: 1px solid #f0e6da;
  border-radius: 8px;
  color: #777;
  font-weight: 600;
  padding: 10px 24px;
}

.btn-cat.active {
  background: #dc7448;
  border-color: #dc7448;
  color: white;
}

.food-card {
  border: 1px solid #f5eee8 !important;
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
  padding: 0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.food-card:not(:disabled):hover {
  box-shadow: 0 0.75rem 1.5rem rgb(0 0 0 / 12%) !important;
  transform: translateY(-2px);
}

.food-card-disabled {
  cursor: default;
  opacity: 0.7;
}

.food-img-placeholder {
  align-items: center;
  background-color: #efeae4;
  color: #d8cec0;
  display: flex;
  font-size: 3rem;
  height: 135px;
  justify-content: center;
  width: 100%;
}

.order-panel {
  border: 1px solid #f0e6da !important;
  border-radius: 16px;
  top: 20px;
}

.order-panel-body {
  height: 590px;
}

.cart-item {
  border: 1px solid #f0e6da;
}

.item-price {
  font-size: 0.75rem;
}

.qty-selector {
  align-items: center;
  border-radius: 6px;
  display: flex;
  padding: 2px 6px;
}

.qty-selector button {
  background: none;
  border: none;
  color: #333;
  font-weight: bold;
  padding: 0 10px;
}

.qty-selector button:disabled {
  opacity: 0.35;
}

.custom-scroll::-webkit-scrollbar {
  width: 4px;
}

.custom-scroll::-webkit-scrollbar-thumb {
  background: #e2d9cf;
  border-radius: 10px;
}

@media (max-width: 991.98px) {
  .order-panel-body {
    height: auto;
    min-height: 520px;
  }
}
</style>
