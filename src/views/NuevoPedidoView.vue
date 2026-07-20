<template>
  <div class="layout">
    <SidebarComponent />
    <div class="main-content">
      <NavbarComponent />

      <main class="order-editor-page">
        <header class="order-editor-heading">
          <div class="order-editor-title-group">
            <span class="order-editor-title-icon"><i class="bi bi-journal-text"></i></span>
            <div>
            <h1>{{ tituloPagina }}</h1>
            <p class="page-subtitle mb-0">
              {{ soloLectura ? 'Consulta la información registrada en esta orden.' : 'Registra productos y administra la orden de la mesa.' }}
            </p>
            </div>
          </div>
          <button class="order-back-button" @click="regresar">
            <i class="bi bi-arrow-left me-1"></i>
            Volver
          </button>
        </header>

        <div v-if="errorCarga" class="alert alert-danger d-flex align-items-center gap-2" role="alert">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <span>{{ errorCarga }}</span>
        </div>

        <section v-if="!esEdicion" class="order-context-card" aria-labelledby="order-context-title">
          <div class="order-context-heading">
            <div>
              <span class="section-kicker">Tipo de atención</span>
              <h2 id="order-context-title">¿Cómo se entregará este pedido?</h2>
            </div>
            <span class="draft-pill"><i class="bi bi-pencil-square"></i> Borrador</span>
          </div>

          <div class="row g-3">
            <div class="col-md-6">
              <label for="modalidadPedido" class="form-label">Modalidad</label>
              <select id="modalidadPedido" v-model.number="modalidadSeleccionadaId" class="form-select" @change="alCambiarModalidad">
                <option :value="null" disabled>Selecciona una modalidad</option>
                <option v-for="modalidad in modalidades" :key="modalidad.idModalidadPedido" :value="modalidad.idModalidadPedido">
                  {{ modalidad.nombreModalidad }}
                </option>
              </select>
            </div>

            <div v-if="esModalidadMesa" class="col-md-6">
              <label for="mesaPedido" class="form-label">Mesa disponible</label>
              <select id="mesaPedido" v-model.number="idMesa" class="form-select" @change="actualizarNumeroMesa">
                <option :value="null" disabled>Selecciona una mesa</option>
                <option v-for="mesa in mesasDisponibles" :key="mesa.idMesa" :value="mesa.idMesa">
                  Mesa {{ mesa.numeroMesa }} · Piso {{ mesa.piso }} · {{ mesa.capacidad }} personas
                </option>
              </select>
            </div>

            <div v-if="requiereDatosCliente" class="col-md-6">
              <label for="clienteNombre" class="form-label">Nombre del cliente</label>
              <input id="clienteNombre" v-model.trim="clienteNombre" maxlength="120" class="form-control" placeholder="Ej. Ana Torres" />
            </div>

            <div v-if="requiereDatosCliente" class="col-md-6">
              <label for="clienteTelefono" class="form-label">Teléfono {{ esDelivery ? '(obligatorio)' : '(opcional)' }}</label>
              <input id="clienteTelefono" v-model.trim="clienteTelefono" maxlength="20" class="form-control" placeholder="Ej. 987 654 321" />
            </div>

            <div v-if="esDelivery" class="col-12">
              <label for="direccionEntrega" class="form-label">Dirección de entrega</label>
              <input id="direccionEntrega" v-model.trim="direccionEntrega" maxlength="250" class="form-control" placeholder="Calle, número y referencia" />
            </div>
          </div>
        </section>

        <section class="order-meta-grid" aria-label="Información de la orden">
          <div class="contenedor-info">
            <i class="bi bi-grid text-brand"></i>
            <div class="d-flex flex-column">
              <span class="info-label">Atención</span>
              <span class="info-value">{{ ubicacionMostrada }}</span>
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
        </section>

        <div v-if="soloLectura" class="alert alert-success d-flex align-items-center gap-2">
          <i class="bi bi-lock-fill"></i>
          Este pedido está cerrado y se muestra en modo de solo lectura.
        </div>

        <div class="row g-4">
          <div class="col-xl-8">
            <section class="menu-selector-card">
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
                  :class="{ 'food-card-disabled': soloLectura || !!errorCarga || !alimento.disponibleParaPedidos }"
                  :disabled="soloLectura || !!errorCarga || !alimento.disponibleParaPedidos"
                  :title="alimento.motivoNoDisponible || ''"
                  @click="agregarAlCarrito(alimento)"
                >
                  <span class="food-img-placeholder">
                    <i class="bi bi-egg-fried"></i>
                  </span>
                  <span class="card-body p-3 d-flex flex-column justify-content-between w-100">
                    <span class="fw-bold text-dark mb-1">{{ alimento.nombreAlimento }}</span>
                    <small v-if="!alimento.disponibleParaPedidos" class="food-availability-note"><i class="bi bi-exclamation-circle"></i>{{ alimento.motivoNoDisponible }}</small>
                    <small v-else class="food-portions-note">Hasta {{ alimento.porcionesDisponibles }} porciones con el stock actual</small>
                    <span class="text-brand fw-bold mt-2">S/ {{ formatearMonto(alimento.precio) }}</span>
                  </span>
                </button>
              </div>
              <div v-if="alimentosFiltrados.length === 0" class="col-12">
                <div class="menu-empty"><i class="bi bi-search"></i><strong>No hay platos en esta categoría</strong><span>Selecciona otra categoría para continuar.</span></div>
              </div>
            </div>
            </section>
          </div>

          <div class="col-xl-4">
            <div ref="panelPedido" class="card order-panel sticky-xl-top">
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
                    {{ esEdicion ? 'Actualizar borrador' : 'Guardar borrador' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button v-if="!soloLectura && carrito.length" type="button" class="mobile-cart-jump" @click="irAlResumen">
          <span><i class="bi bi-basket2"></i>{{ cantidadItems }} {{ cantidadItems === 1 ? 'plato' : 'platos' }}</span>
          <strong>S/ {{ formatearMonto(totalCalculado) }} <i class="bi bi-arrow-up"></i></strong>
        </button>
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
import { obtenerMesas } from '@/services/mesaService';
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
const modalidades = ref([]);
const mesas = ref([]);
const modalidadSeleccionadaId = ref(null);
const clienteNombre = ref('');
const clienteTelefono = ref('');
const direccionEntrega = ref('');

const cargandoAlimentos = ref(false);
const cargando = ref(false);
const errorCarga = ref('');
const categoriaSeleccionada = ref(0);
const observacion = ref('');
const carrito = ref([]);
const panelPedido = ref(null);
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

const soloLectura = computed(() => esEdicion.value && (!pedidoCargado.value || !pedidoCargado.value.editable));
const modalidadSeleccionada = computed(() =>
  modalidades.value.find((modalidad) => modalidad.idModalidadPedido === modalidadSeleccionadaId.value),
);
const tipoModalidad = computed(() => normalizar(modalidadSeleccionada.value?.nombreModalidad));
const esModalidadMesa = computed(() => ['MESA', 'SALON', 'EN_MESA'].includes(tipoModalidad.value));
const esDelivery = computed(() => ['DELIVERY', 'REPARTO'].includes(tipoModalidad.value));
const requiereDatosCliente = computed(() => Boolean(tipoModalidad.value) && !esModalidadMesa.value);
const mesasDisponibles = computed(() =>
  mesas.value.filter((mesa) =>
    ['libre', 'reservada'].includes(String(mesa.estadoMesa?.descripcion || '').toLowerCase()) || mesa.idMesa === idMesa.value,
  ),
);
const etapaMostrada = computed(() => etiquetaEtapa(pedidoCargado.value?.etapaFlujo));
const estadoMostrado = computed(() => etapaMostrada.value || estadoPedido.value?.nombreEstado || (esEdicion.value ? 'EN CURSO' : 'NUEVA ORDEN'));
const tituloPagina = computed(() => {
  if (!esEdicion.value) return 'Nuevo Pedido';
  return soloLectura.value ? `Pedido #${idPedido.value}` : `Editar Pedido #${idPedido.value}`;
});
const numeroMesaFormateado = computed(() => String(numeroMesa.value || 0).padStart(2, '0'));
const ubicacionMostrada = computed(() => {
  if (esModalidadMesa.value || (!modalidadSeleccionada.value && idMesa.value)) {
    return idMesa.value ? `Mesa ${numeroMesaFormateado.value}` : 'Mesa por seleccionar';
  }
  const modalidad = modalidadSeleccionada.value?.nombreModalidad;
  return modalidad ? `${modalidad}${clienteNombre.value ? ` · ${clienteNombre.value}` : ''}` : 'Por definir';
});

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
const cantidadItems = computed(() => carrito.value.reduce((total, item) => total + item.cantidad, 0));

const cargarDatosBase = async () => {
  cargandoAlimentos.value = true;
  errorCarga.value = '';
  try {
    const [respuestaAlimentos, respuestaCategorias, respuestaModalidades, respuestaMesas] = await Promise.all([
      menuService.obtenerAlimentos(),
      menuService.obtenerCategorias(),
      pedidoService.getModalidades(),
      obtenerMesas(),
    ]);

    alimentos.value = respuestaAlimentos
      .filter((alimento) => !alimento.eliminado)
      .map((alimento) => ({ ...alimento, precio: Number(alimento.precio || 0) }));
    categorias.value = [
      { id: 0, nombre: 'Todos' },
      ...respuestaCategorias
        .filter((categoria) => !categoria.eliminado)
        .map((categoria) => ({ id: categoria.idCategoria, nombre: categoria.nombreCategoria })),
    ];
    modalidades.value = respuestaModalidades
      .filter((modalidad) => !modalidad.eliminado)
      .map((modalidad) => ({
        idModalidadPedido: modalidad.idModalidadPedido,
        nombreModalidad: modalidad.nombreModalidad,
      }));
    mesas.value = respuestaMesas;

    if (!modalidadSeleccionadaId.value) {
      modalidadSeleccionadaId.value = modalidades.value.find((modalidad) =>
        ['MESA', 'SALON', 'EN_MESA'].includes(normalizar(modalidad.nombreModalidad)),
      )?.idModalidadPedido || modalidades.value[0]?.idModalidadPedido || null;
    }
    actualizarNumeroMesa();

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
  modalidadSeleccionadaId.value = pedido.modalidadPedido?.idModalidadPedido || null;
  clienteNombre.value = pedido.clienteNombre || '';
  clienteTelefono.value = pedido.clienteTelefono || '';
  direccionEntrega.value = pedido.direccionEntrega || '';
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
  if (soloLectura.value || !alimento.disponibleParaPedidos) return;
  const existente = carrito.value.find((item) => item.idAlimento === alimento.idAlimento);
  if (existente) {
    if (existente.cantidad >= Number(alimento.porcionesDisponibles || 0)) return;
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
  const alimento = alimentos.value.find((producto) => producto.idAlimento === item.idAlimento);
  if (!soloLectura.value && alimento?.disponibleParaPedidos
    && item.cantidad < Number(alimento.porcionesDisponibles || 0)) item.cantidad += 1;
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
  if (soloLectura.value || carrito.value.length === 0) return;

  const errorContexto = validarContextoPedido();
  if (errorContexto) {
    errorCarga.value = errorContexto;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  cargando.value = true;
  try {
    const pedidoDto = {
      idMesa: esModalidadMesa.value ? idMesa.value : null,
      idModalidadPedido: modalidadSeleccionadaId.value,
      observacion: observacion.value,
      clienteNombre: requiereDatosCliente.value ? clienteNombre.value : null,
      clienteTelefono: requiereDatosCliente.value ? clienteTelefono.value : null,
      direccionEntrega: esDelivery.value ? direccionEntrega.value : null,
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

const irAlResumen = () => panelPedido.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const alCambiarModalidad = () => {
  errorCarga.value = '';
  if (!esModalidadMesa.value) {
    idMesa.value = null;
    numeroMesa.value = 0;
  }
  if (!esDelivery.value) direccionEntrega.value = '';
};

const actualizarNumeroMesa = () => {
  const mesa = mesas.value.find((item) => item.idMesa === idMesa.value);
  numeroMesa.value = mesa?.numeroMesa || numeroMesa.value || 0;
};

const validarContextoPedido = () => {
  if (!modalidadSeleccionadaId.value) return 'Selecciona la modalidad del pedido.';
  if (esModalidadMesa.value && !idMesa.value) return 'Selecciona una mesa disponible.';
  if (requiereDatosCliente.value && !clienteNombre.value.trim()) return 'Ingresa el nombre del cliente.';
  if (esDelivery.value && !clienteTelefono.value.trim()) return 'Ingresa el teléfono para el delivery.';
  if (esDelivery.value && !direccionEntrega.value.trim()) return 'Ingresa la dirección de entrega.';
  return '';
};

const normalizar = (valor) =>
  String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

const etiquetaEtapa = (etapa) => ({
  BORRADOR: 'Borrador',
  RECIBIDO: 'Recibido en cocina',
  EN_PREPARACION: 'En preparación',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
  CUENTA_SOLICITADA: 'Cuenta solicitada',
  PAGADO: 'Pagado',
  CANCELADO: 'Cancelado',
})[etapa] || '';

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

.order-editor-page { background: var(--rc-page); min-height: calc(100vh - 68px); padding: 1.25rem 1.5rem 2rem; }
.order-editor-heading { align-items: center; display: flex; gap: 1rem; justify-content: space-between; margin-bottom: .9rem; }
.order-editor-title-group { align-items: center; display: flex; gap: .75rem; }
.order-editor-title-icon { align-items: center; background: linear-gradient(135deg, var(--rc-primary), #e88960); border-radius: 12px; box-shadow: 0 5px 14px rgba(190,80,42,.2); color: #fff; display: flex; flex: 0 0 auto; font-size: 1.1rem; height: 44px; justify-content: center; width: 44px; }
.order-editor-heading h1 { color: var(--rc-ink); font-size: clamp(1.45rem,2vw,1.8rem); font-weight: 780; letter-spacing: -.035em; margin: 0; }
.order-editor-heading p { color: var(--rc-muted); font-size: .78rem; margin-top: .18rem; }
.order-back-button { align-items: center; background: #fff; border: 1px solid var(--rc-border-strong); border-radius: 9px; color: var(--rc-ink-soft); display: inline-flex; font-size: .7rem; font-weight: 700; min-height: 40px; padding: .45rem .7rem; }
.order-back-button:hover { background: #fbf2ed; border-color: #d28a6d; color: var(--rc-primary-hover); }
.order-editor-page > .alert { border: 1px solid var(--rc-border); border-radius: 9px; font-size: .7rem; }
.order-context-card { background: var(--rc-surface); border: 1px solid var(--rc-border); border-radius: 13px; box-shadow: var(--rc-shadow-xs); margin-bottom: .9rem; padding: 1rem; }
.order-context-heading { align-items: center; display: flex; gap: 1rem; justify-content: space-between; margin-bottom: .8rem; }
.order-context-heading h2 { color: var(--rc-ink); font-size: 1rem; font-weight: 760; margin: .08rem 0 0; }
.section-kicker { color: var(--rc-primary-hover); display: block; font-size: .58rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
.draft-pill { align-items: center; background: var(--rc-warning-soft); border-radius: 999px; color: var(--rc-warning); display: inline-flex; font-size: .6rem; font-weight: 760; gap: .35rem; padding: .38rem .58rem; }
.order-context-card .form-label { color: var(--rc-ink-soft); font-size: .64rem; font-weight: 720; }
.order-context-card .form-control,
.order-context-card .form-select { background-color: var(--rc-surface); border-color: var(--rc-border); color: var(--rc-ink); font-size: .7rem; min-height: 40px; }
.order-meta-grid { display: grid; gap: .65rem; grid-template-columns: repeat(4,minmax(0,1fr)); margin-bottom: .9rem; }
.order-meta-grid .contenedor-info { border-radius: 11px; box-shadow: var(--rc-shadow-xs); min-height: 68px; padding: .65rem .75rem; width: 100%; }
.order-meta-grid .contenedor-info > i { align-items: center; background: var(--rc-primary-soft); border-radius: 8px; color: var(--rc-primary-hover) !important; display: flex; height: 34px; justify-content: center; width: 34px; }
.menu-selector-card { background: var(--rc-surface); border: 1px solid var(--rc-border); border-radius: 13px; box-shadow: var(--rc-shadow-xs); min-height: 560px; padding: .85rem; }
.categories-scroll { margin-bottom: .7rem !important; padding-bottom: .2rem !important; scrollbar-width: none; }
.categories-scroll::-webkit-scrollbar { display: none; }
.btn-cat { border-radius: 9px; font-size: .66rem; min-height: 38px; padding: .45rem .75rem; }
.food-card { background: var(--rc-surface); border-radius: 11px; box-shadow: none !important; }
.food-img-placeholder { background: linear-gradient(145deg,#f5eee9,#f9f6f3); font-size: 2.2rem; height: 105px; }
.food-card .card-body { min-height: 80px; padding: .7rem !important; }
.food-card .card-body > span { font-size: .7rem; }
.food-card .text-brand { color: var(--rc-primary-hover); }
.food-availability-note, .food-portions-note { display: block; font-size: .56rem; line-height: 1.25; margin-top: .2rem; }
.food-availability-note { color: var(--rc-danger); }
.food-availability-note i { margin-right: .22rem; }
.food-portions-note { color: var(--rc-muted); }
.order-panel { background: var(--rc-surface); border-radius: 13px; box-shadow: var(--rc-shadow-sm) !important; overflow: hidden; top: 82px; }
.order-panel .card-header { background: var(--rc-surface) !important; border-bottom: 1px solid var(--rc-border) !important; padding: .9rem 1rem !important; }
.order-panel .card-header h5 { color: var(--rc-ink) !important; font-size: .9rem; }
.order-panel .card-body { padding: .85rem 1rem !important; }
.order-panel-body { height: min(600px,calc(100vh - 190px)); min-height: 490px; }
.cart-item { background: #faf7f5; border-radius: 10px !important; padding: .7rem !important; }
.cart-item .fw-bold { color: var(--rc-ink) !important; font-size: .7rem; }
.qty-selector { background: #fff; border-color: var(--rc-border) !important; min-height: 32px; }
.qty-selector button { min-height: 28px; }
.order-summary textarea { border-color: var(--rc-border); border-radius: 8px; font-size: .66rem; }
.order-summary .btn-brand { border-radius: 9px !important; font-size: .72rem; min-height: 44px; padding: .6rem !important; }
.menu-empty { align-items: center; color: var(--rc-muted); display: flex; flex-direction: column; justify-content: center; min-height: 260px; text-align: center; }
.menu-empty > i { align-items: center; background: var(--rc-primary-soft); border-radius: 50%; color: var(--rc-primary); display: flex; height: 46px; justify-content: center; margin-bottom: .5rem; width: 46px; }
.menu-empty strong { color: var(--rc-ink); font-size: .75rem; }
.menu-empty span { font-size: .62rem; margin-top: .15rem; }
.mobile-cart-jump { display: none; }
body.dark-theme .menu-selector-card,
body.dark-theme .order-panel,
body.dark-theme .order-panel .card-header { background: var(--rc-surface) !important; }
body.dark-theme .order-context-card .form-control,
body.dark-theme .order-context-card .form-select { background-color: #303031; color: var(--rc-ink); }
body.dark-theme .food-img-placeholder,
body.dark-theme .cart-item,
body.dark-theme .qty-selector { background: #323233; }
@media (max-width: 1199.98px) {
  .order-meta-grid { grid-template-columns: 1fr 1fr; }
  .order-panel-body { height: auto; min-height: 440px; }
}
@media (max-width: 767.98px) {
  .order-editor-page { padding: 1rem 1rem 5rem; }
  .order-editor-heading { align-items: flex-start; flex-direction: column; }
  .order-back-button { width: 100%; }
  .order-context-heading { align-items: flex-start; }
  .order-meta-grid { grid-template-columns: 1fr 1fr; }
  .order-meta-grid .contenedor-info { min-height: 62px; padding: .55rem; }
  .menu-selector-card { min-height: 420px; padding: .65rem; }
  .food-img-placeholder { height: 88px; }
  .order-panel { scroll-margin-top: 72px; }
  .mobile-cart-jump { align-items: center; background: var(--rc-primary); border: 0; border-radius: 11px; bottom: .75rem; box-shadow: 0 10px 28px rgba(88,42,25,.3); color: #fff; display: flex; font-size: .67rem; justify-content: space-between; left: 1rem; min-height: 50px; padding: .55rem .8rem; position: fixed; right: 1rem; z-index: 1040; }
  .mobile-cart-jump span { align-items: center; display: flex; gap: .4rem; }
  .mobile-cart-jump strong { font-size: .72rem; }
}
@media (max-width: 390px) {
  .order-meta-grid { grid-template-columns: 1fr; }
  .food-card .card-body { min-height: 74px; }
}
</style>
