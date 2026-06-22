<template>
  <div class="layout">
    <SidebarComponent />
    <div class="main-content">
      <NavbarComponent />

      <main class="p-4 p-md-4 bg-resto-light min-vh-100">
        <div class="d-inline-flex justify-content-between align-items-start">
          <div>
            <div class="d-flex flex-wrap gap-3 align-items-center mt-1">
              <div class="contenedor-info">
                <i class="bi bi-people text-brand"></i>
                <div class="d-flex flex-column">
                  <span class="info-label">Mesa</span>
                  <span class="info-value">
                    {{ numeroMesa.toString().padStart(2, '0') }}
                  </span>
                </div>
              </div>

              <div class="contenedor-info">
                <i class="bi bi-calendar3 text-muted"></i>
                <div class="d-flex flex-column">
                  <span class="info-label">Fecha</span>
                  <span class="info-value">{{ fechaActual }}</span>
                </div>
              </div>

              <div class="contenedor-info">
                <i class="bi bi-clock text-muted"></i>
                <div class="d-flex flex-column">
                  <span class="info-label">Estado</span>
                  <span class="info-value">{{ esEdicion ? 'En curso' : 'Nueva Orden' }}</span>
                </div>
              </div>
              <div class="contenedor-info">
                <i class="bi bi-person text-muted me-2"></i>
                <div class="d-flex flex-column">
                  <span class="info-label">Mesero</span>
                  <span class="info-value">{{ usuarioLogueado.nombre }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row g-4 mt-2">
          <div class="col-lg-8">
            <div class="categories-scroll d-flex gap-2 mb-4 pb-2">
              <button
                v-for="cat in categorias"
                :key="cat.id"
                :class="['btn-cat', { 'active': categoriaSeleccionada === cat.id }]"
                @click="categoriaSeleccionada = cat.id"
              >
                {{ cat.nombre }}
              </button>
            </div>

            <div class="row g-3">
              <div v-if="cargandoAlimentos" class="text-center py-5">
                <div class="spinner-border text-brand" role="status"></div>
              </div>

              <div v-else class="col-6 col-md-4 col-xl-3" v-for="alimento in alimentosFiltrados" :key="alimento.idAlimento">
                <div class="card h-100 border-0 shadow-sm food-card" @click="agregarAlCarrito(alimento)">
                  <div class="food-img-placeholder">
                    <i class="bi bi-egg-fried"></i>
                  </div>
                  <div class="card-body p-3 d-flex flex-column justify-content-between">
                    <div>
                      <h6 class="fw-bold text-dark mb-1 text-truncate">{{ alimento.nombreAlimento }}</h6>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-2">
                      <span class="text-brand fw-bold">S/ {{ alimento.precio.toFixed(2) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-4" style="margin-top: -80px;">
            <div class="card border-0 shadow-lg order-panel sticky-top" style="z-index: 100;">
              <div class="card-header bg-white border-0 pt-4 px-4">
                <h5 class="fw-bold text-dark">Detalle del Pedido</h5>
              </div>

              <div class="card-body px-4 d-flex flex-column" style="height: 550px;">
                <div class="flex-grow-1 overflow-auto pe-2 mb-3 custom-scroll">
                  <div v-if="carrito.length === 0" class="empty-cart-state text-center py-5">
                    <img src="https://cdn-icons-png.flaticon.com/512/10522/10522130.png" width="80" class="opacity-25 mb-3">
                    <p class="text-muted">Aún no hay platos en esta cuenta</p>
                  </div>

                  <div v-else v-for="item in carrito" :key="item.idAlimento" class="cart-item mb-3 bg-resto-light p-3 rounded-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                      <div class="me-2">
                        <div class="fw-bold text-dark">{{ item.nombreAlimento }}</div>
                        <div class="text-muted" style="font-size: 0.75rem;">S/ {{ item.precio.toFixed(2) }} c/u</div>
                      </div>
                      <div class="fw-bold text-dark">S/ {{ (item.precio * item.cantidad).toFixed(2) }}</div>
                    </div>
                    <div class="d-flex align-items-center">
                      <div class="qty-selector bg-white border shadow-sm">
                        <button @click="reducirCantidad(item)">-</button>
                        <span>{{ item.cantidad }}</span>
                        <button @click="incrementarCantidad(item)">+</button>
                      </div>
                      <button class="btn btn-link btn-sm text-danger ms-auto p-0" @click="quitarItem(item)">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div class="order-summary border-top pt-3">
                  <textarea
                    v-model="observacion"
                    class="form-control form-control-sm border-0 bg-light mb-3"
                    rows="2"
                    placeholder="Observaciones (Ej. Término medio, sin sal...)"
                  ></textarea>

                  <div class="d-flex justify-content-between mb-1 small text-muted">
                    <span>Subtotal</span>
                    <span>S/ {{ subtotal.toFixed(2) }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-1 small text-muted">
                    <span>IGV (18%)</span>
                    <span>S/ {{ igv.toFixed(2) }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-3 fw-bold fs-5 text-dark">
                    <span>Total</span>
                    <span>S/ {{ totalCalculado.toFixed(2) }}</span>
                  </div>

                  <div class="row g-2">
                    <div class="col-12">
                      <button
                        class="btn btn-brand w-100 py-3 text-white fw-bold shadow-sm rounded-3"
                        @click="procesarPedido"
                        :disabled="carrito.length === 0 || cargando"
                      >
                        <span v-if="cargando" class="spinner-border spinner-border-sm me-2"></span>
                        {{ esEdicion ? 'Actualizar Orden' : 'Reservar' }}
                      </button>
                    </div>
                    <div class="col-12">
                      <button class="btn btn-white w-100 py-3 border fw-bold rounded-3 text-dark shadow-sm" @click="regresar">
                        Cancelar
                      </button>
                    </div>
                  </div>
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
// (El resto de tu lógica se mantiene idéntica, no necesita cambios)
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import pedidoService from '@/services/pedidoService';
import * as menuService from '@/services/menuService';
import SidebarComponent from '@/components/SidebarComponent.vue';
import NavbarComponent from '@/components/NavbarComponent.vue';

const route = useRoute();
const router = useRouter();

const idPedido = ref(route.query.idPedido || null);
const idMesa = ref(route.query.idMesa || null);
const numeroMesa = ref(route.query.numeroMesa || idMesa.value || '0');
const esEdicion = computed(() => !!idPedido.value);

const obtenerFechaFormateada = () => {
  const date = new Date();
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const anio = date.getFullYear();
  return `${dia}/${mes}/${anio}`;
};
const fechaActual = ref(obtenerFechaFormateada());

const usuarioLogueado = ref({ idUsuario: 1, nombre: 'Mesero' });

const inicializarUsuario = () => {
    try {
        const usuarioStorage = localStorage.getItem('usuario');
        if (usuarioStorage) {
            const user = JSON.parse(usuarioStorage);
            usuarioLogueado.value = {
                idUsuario: user.idUsuario || user.id || 1,
                nombre: user.nombres || user.nombre || 'Mesero'
            };
        }
    } catch (e) { console.error(e); }
};

const cargandoAlimentos = ref(false);
const cargando = ref(false);
const categoriaSeleccionada = ref(0);
const observacion = ref('');
const carrito = ref([]);
const alimentos = ref([]);
const categorias = ref([{ id: 0, nombre: 'Todos' }]);

const cargarDatosBase = async () => {
    try {
        cargandoAlimentos.value = true;
        const [resAlimentos, resCategorias] = await Promise.all([
            menuService.obtenerAlimentos(),
            menuService.obtenerCategorias()
        ]);

        alimentos.value = resAlimentos.filter(a => a.disponible && !a.eliminado);
        const catsMap = resCategorias
            .filter(c => !c.eliminado)
            .map(c => ({ id: c.idCategoria, nombre: c.nombreCategoria }));

        categorias.value = [{ id: 0, nombre: 'Todos' }, ...catsMap];
        await comprobarPedidoExistente();
    } catch (e) {
        console.error("Error al sincronizar menú", e);
    } finally {
        cargandoAlimentos.value = false;
    }
};

const comprobarPedidoExistente = async () => {
    if (!idMesa.value && !idPedido.value) return;
    try {
        const pedidoEnCurso = await pedidoService.getPedidoPorMesa(idMesa.value);
        if (pedidoEnCurso) {
            idPedido.value = pedidoEnCurso.idPedido;
            observacion.value = pedidoEnCurso.observacion || '';
            carrito.value = pedidoEnCurso.detalles.map(det => {
                const idAlim = det.idAlimento || (det.alimento && det.alimento.idAlimento);
                const infoAlimento = alimentos.value.find(a => a.idAlimento === idAlim) || {};
                return {
                    idAlimento: idAlim,
                    nombreAlimento: infoAlimento.nombreAlimento || 'Plato',
                    precio: det.precioUnitario || infoAlimento.precio || 0,
                    cantidad: det.cantidad
                };
            });
        }
    } catch (e) { console.error("No se detectaron pedidos previos:", e); }
};

const alimentosFiltrados = computed(() => {
    if (categoriaSeleccionada.value === 0) return alimentos.value;
    return alimentos.value.filter(a => a.categoria && a.categoria.idCategoria === categoriaSeleccionada.value);
});

const totalCalculado = computed(() => carrito.value.reduce((acc, item) => acc + (item.precio * item.cantidad), 0));
const subtotal = computed(() => totalCalculado.value / 1.18);
const igv = computed(() => totalCalculado.value - subtotal.value);

const agregarAlCarrito = (alimento) => {
    const existe = carrito.value.find(i => i.idAlimento === alimento.idAlimento);
    if (existe) existe.cantidad++;
    else carrito.value.push({ ...alimento, cantidad: 1 });
};
const incrementarCantidad = (item) => item.cantidad++;
const reducirCantidad = (item) => { if (item.cantidad > 1) item.cantidad--; };
const quitarItem = (item) => { carrito.value = carrito.value.filter(i => i.idAlimento !== item.idAlimento); };

const procesarPedido = async () => {
    try {
        cargando.value = true;
        const pedidoDTO = {
            idMesa: parseInt(idMesa.value),
            idUsuario: parseInt(usuarioLogueado.value.idUsuario),
            idModalidadPedido: 1,
            idEstadoPedido: 1,
            observacion: observacion.value,
            detalles: carrito.value.map(i => ({ idAlimento: i.idAlimento, cantidad: i.cantidad }))
        };

        if (esEdicion.value) await pedidoService.updatePedido(idPedido.value, pedidoDTO);
        else await pedidoService.createPedido(pedidoDTO);
        router.push('/mesas');
    } catch (error) {
        alert("Error al guardar pedido.");
        console.error(error);
    } finally {
        cargando.value = false;
    }
};

const regresar = () => router.back();

onMounted(() => {
    inicializarUsuario();
    cargarDatosBase();
});
</script>

<style scoped>
/* (Estilos originales preservados) */
:root { --brand-color: #dc7448; }
.bg-resto-light { background-color: #fcfaf8; }
.text-brand { color: #dc7448; }
.btn-brand { background-color: #dc7448; color: white; border: none; }
.btn-brand:hover { background-color: #c5633a; color: white; }
.btn-white { background-color: #ffffff; }

.contenedor-info {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: #ffffff;
  border: 1px solid #f0e6da;
  border-radius: 18px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
  min-height: 60px;
}

.info-label { font-size: 0.70rem; color: #8c8c8c; font-weight: 500; margin-bottom: 2px; }
.info-value { font-size: 0.95rem; font-weight: 700; color: #2c2c2c; }

.categories-scroll { overflow-x: auto; white-space: nowrap; }
.btn-cat { background: white; border: 1px solid #f0e6da; padding: 10px 24px; border-radius: 8px; font-weight: 600; color: #777; }
.btn-cat.active { background: var(--brand-color); color: white; border-color: var(--brand-color); }

.food-card { border-radius: 12px; overflow: hidden; cursor: pointer; transition: transform 0.2s; border: 1px solid #f5eee8 !important; }
.food-img-placeholder { height: 140px; background-color: #efeae4; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: #d8cec0; }

.order-panel { border-radius: 16px; top: 20px; border: 1px solid #f0e6da !important;}
.cart-item { border: 1px solid #f0e6da; }
.qty-selector { display: flex; align-items: center; border-radius: 6px; padding: 2px 6px; }
.qty-selector button { border: none; background: none; font-weight: bold; padding: 0 10px; color: #333; }
.custom-scroll::-webkit-scrollbar { width: 4px; }
.custom-scroll::-webkit-scrollbar-thumb { background: #e2d9cf; border-radius: 10px; }
</style>
