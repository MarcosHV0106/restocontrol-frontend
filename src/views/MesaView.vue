<template>
    <div class="layout mesa-layout">
        <SidebarComponent />

        <div class="main-content">
            <NavbarComponent />

            <main class="main-container-mesas mesa-page">
                <header class="mesa-heading">
                    <div class="mesa-title-group">
                        <span class="mesa-title-icon"><i class="bi bi-grid-3x3-gap-fill"></i></span>
                        <div><h1>Gestión de mesas</h1><p>Administra el salón y supervisa la atención en tiempo real.</p></div>
                    </div>
                    <div class="mesa-heading-actions">
                        <button class="btn mesa-refresh-button" :disabled="cargandoMesas" @click="listar" aria-label="Actualizar mesas">
                            <span v-if="cargandoMesas" class="spinner-border spinner-border-sm"></span>
                            <i v-else class="bi bi-arrow-clockwise"></i>
                        </button>
                        <button v-if="esAdministrador" class="btn btn-primary-resto mesa-new-button" @click="nuevo">
                            <i class="bi bi-plus-lg"></i>Nueva mesa
                        </button>
                    </div>
                </header>

                <div v-if="errorMesas" class="mesa-alert" role="alert">
                    <i class="bi bi-exclamation-triangle-fill"></i><span>{{ errorMesas }}</span>
                    <button type="button" @click="listar">Reintentar</button>
                </div>
                <div v-if="mensajeMesas" class="mesa-alert mesa-alert-success" role="status">
                    <i class="bi bi-check-circle-fill"></i><span>{{ mensajeMesas }}</span>
                </div>

                <div class="row g-3 mesa-kpis">
                    <div class="col-6 col-md-3" v-for="(val, key) in resumenCalculado" :key="key">
                        <div :class="['card-kpi', key]">
                            <div class="kpi-content">
                                <span class="kpi-label">{{ labelResumen(key) }}</span>
                                <h3 class="kpi-value">{{ val }}</h3>
                            </div>
                            <div class="kpi-icon">
                                <i :class="iconResumen(key)"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card card-filters mesa-filters">
                    <div class="card-body p-3">
                        <div class="row g-3 align-items-center">
                            <div class="col-md-4">
                                <div class="input-group-modern">
                                    <i class="bi bi-search text-muted"></i>
                                    <input type="text" placeholder="Buscar por número..." v-model="filtros.busqueda">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <select class="form-select-modern"
                                    v-model="filtros.piso">
                                    <option value="">Todos los sectores / Pisos</option>
                                    <option v-for="p in pisos" :key="p" :value="p">Piso {{ p }}</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <select class="form-select-modern"
                                    v-model="filtros.estado">
                                    <option value="">Todos los estados</option>
                                    <option value="libre">Libre</option>
                                    <option value="ocupada">Ocupada</option>
                                    <option value="reservada">Reservada</option>
                                    <option value="cobrar">Por cobrar</option>
                                </select>
                            </div>
                            <div class="col-md-2 text-end">
                                <button class="mesa-clear-filters" :disabled="!hayFiltros" @click="limpiarFiltros">
                                    <i class="bi bi-x-circle"></i>Limpiar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row g-3 mesa-workspace">
                    <div :class="mesaSeleccionada ? 'col-xl-8' : 'col-12'" class="transition-all">
                        <div v-if="cargandoMesas && !entidades.length" class="mesa-loading">
                            <span class="spinner-border"></span><strong>Preparando el salón</strong><small>Consultando el estado de las mesas…</small>
                        </div>
                        <div class="mesa-grid">
                            <div v-for="mesa in mesasFiltradas" :key="mesa.idMesa"
                                :class="['mesa-card-v2', mesa.estadoMesa.descripcion, { 'active': mesaSeleccionada?.idMesa === mesa.idMesa }]"
                                role="button" tabindex="0" :aria-label="`Mesa ${mesa.numeroMesa}, ${mesa.estadoMesa.descripcion}`"
                                @click="seleccionarMesa(mesa)" @keydown.enter="seleccionarMesa(mesa)" @keydown.space.prevent="seleccionarMesa(mesa)">
                                <div class="mesa-badge-status">{{ mesa.estadoMesa.descripcion }}</div>

                                <div class="mesa-body">
                                    <div class="mesa-circle d-flex flex-column align-items-center justify-content-center">
                                        <i class="bi bi-cup-hot-fill"></i>
                                        <span class="m-num">{{ mesa.numeroMesa }}</span>
                                    </div>

                                    <div class="mesa-info mt-2">
                                        <p class="m-cap mb-0 small text-muted">
                                            <i class="bi bi-people me-1"></i> {{ mesa.capacidad }} pers.
                                        </p>
                                        <p class="m-piso mb-0 small text-muted fw-bold">Piso {{ mesa.piso }}</p>
                                    </div>
                                </div>

                                <div v-if="mesa.pedido" class="mesa-footer-price fw-bold text-success mt-2">
                                    S/ {{ Number(mesa.pedido.total).toFixed(2) }}
                                </div>
                            </div>
                        </div>
                        <div v-if="!cargandoMesas && mesasFiltradas.length === 0" class="mesa-empty">
                            <span><i class="bi bi-search"></i></span><strong>No encontramos mesas</strong><p>Ajusta los filtros para volver a visualizar el salón.</p><button @click="limpiarFiltros">Limpiar filtros</button>
                        </div>
                    </div>

                    <div class="col-xl-4" v-if="mesaSeleccionada">
                        <div class="card panel-detalle-v2">
                            <div
                                class="card-header bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                                <h4 class="fw-bold mb-0">Mesa {{ mesaSeleccionada.numeroMesa }}</h4>
                                <button class="btn-close" @click="mesaSeleccionada = null"></button>
                            </div>
                            <div class="card-body p-4">
                                <div class="d-flex gap-3 mb-4">
                                    <div class="detail-pill border px-3 py-1 rounded bg-light">
                                        <i class="bi bi-person"></i> {{ mesaSeleccionada.capacidad }} pers.
                                    </div>
                                    <div class="detail-pill border px-3 py-1 rounded bg-light">
                                        <i class="bi bi-layers"></i> Piso {{ mesaSeleccionada.piso }}
                                    </div>
                                </div>

                                <div class="d-grid gap-2 mb-4">
                                    <button v-if="esAdministrador" class="btn btn-outline-secondary py-2"
                                        @click="editarMesa(mesaSeleccionada.idMesa)">
                                        <i class="bi bi-pencil me-2"></i>Editar Datos de Mesa
                                    </button>

                                    <button v-if="mesaSeleccionada.estadoMesa.descripcion === 'libre'"
                                        class="btn btn-primary-resto py-2 text-white" @click="abrirApertura">
                                        Aperturar Mesa
                                    </button>

                                    <button
                                        v-if="mesaSeleccionada.pedido && (mesaSeleccionada.estadoMesa.descripcion === 'ocupada' || mesaSeleccionada.estadoMesa.descripcion === 'cobrar')"
                                        class="btn btn-primary-resto py-2 text-white" @click="abrirPedidoSeleccionado">
                                        <i class="bi bi-receipt me-2"></i>{{ mesaSeleccionada.pedido.editable ? 'Continuar pedido' : 'Ver pedido' }}
                                    </button>

                                    <button
                                        v-if="mesaSeleccionada.pedido?.puedeSolicitarCuenta"
                                        class="btn btn-outline-primary py-2" @click="solicitarCuentaSeleccionada">
                                        <i class="bi bi-receipt-cutoff me-2"></i>Solicitar cuenta
                                    </button>

                                    <button
                                        v-if="puedeCobrar && mesaSeleccionada.pedido && mesaSeleccionada.estadoMesa.descripcion === 'cobrar'"
                                        class="btn btn-outline-primary py-2" @click="irACaja">
                                        <i class="bi bi-wallet2 me-2"></i>Ir a Caja
                                    </button>

                                    <button class="btn btn-light border py-2"
                                        v-if="mesaSeleccionada.estadoMesa.descripcion === 'libre'" @click="abrirUnion">
                                        Unir con otra mesa
                                    </button>
                                </div>

                                <div v-if="mesaSeleccionada.pedido"
                                    class="pedido-preview p-3 rounded-3 border bg-light">
                                    <h6 class="fw-bold mb-3 small text-uppercase text-muted">Pedido Actual #{{
                                        mesaSeleccionada.pedido.idPedido }}</h6>
                                    <div v-for="d in mesaSeleccionada.pedido.detalles" :key="d.idDetalle"
                                        class="d-flex justify-content-between mb-2 small">
                                        <span>{{ d.cantidad }}x {{ d.alimento.nombreAlimento }}</span>
                                        <span class="fw-bold">S/ {{ Number(d.subtotal).toFixed(2) }}</span>
                                    </div>
                                    <hr>
                                    <div class="d-flex justify-content-between fw-bold align-items-center">
                                        <span>Total</span>
                                        <span class="text-success fs-5">S/ {{
                                            Number(mesaSeleccionada.pedido.total).toFixed(2) }}</span>
                                    </div>
                                </div>
                                <div v-else class="mesa-no-order">
                                    <i class="bi bi-shield-lock d-block fs-1 mb-2 text-secondary"></i>
                                    {{ mensajeMesaSinPedido }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>

        <div class="modal fade" id="mdlEntidad" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header border-0 pb-0">
                        <h5 class="modal-title fw-bold">{{ entidad.idMesa === 0 ? 'Nueva Mesa' : 'Editar Mesa' }}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label text-muted small fw-bold">Número de Mesa</label>
                            <input class="form-control" type="number" v-model="entidad.numeroMesa"
                                placeholder="Ej. 12" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label text-muted small fw-bold">Capacidad (Personas)</label>
                            <input class="form-control" type="number" v-model="entidad.capacidad" placeholder="Ej. 4" />
                        </div>
                        <div class="mb-3">
                            <label class="form-label text-muted small fw-bold">Piso / Sector</label>
                            <input class="form-control" type="number" v-model="entidad.piso" placeholder="Ej. 1" />
                        </div>
                        <div class="mb-3" v-if="entidad.idMesa !== 0">
                            <label class="form-label text-muted small fw-bold">Estado en Sistema</label>
                            <select class="form-select" v-model="entidad.eliminado">
                                <option :value="false">Activa</option>
                                <option :value="true">Desactivada (Eliminada)</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer border-0 pt-0">
                        <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary-resto text-white" @click="guardarMesa">Guardar
                            Cambios</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade" id="mdlAperturaMesa" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered modal-sm">
                <div class="modal-content">
                    <div class="modal-header border-0 pb-0">
                        <h5 class="modal-title fw-bold">Aperturar Mesa {{ mesaSeleccionada?.numeroMesa }}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <p class="text-muted small">Cantidad de comensales</p>
                        <div class="person-counter">
                            <button class="btn btn-outline-secondary rounded-circle" style="width:40px;height:40px;"
                                @click="cantidadPersonas > 1 ? cantidadPersonas-- : null">-</button>
                            <span class="counter-value">
                                {{ cantidadPersonas }}
                            </span>
                            <button class="btn btn-outline-secondary rounded-circle" style="width:40px;height:40px;"
                                @click="cantidadPersonas < mesaSeleccionada?.capacidad ? cantidadPersonas++ : null">+</button>
                        </div>
                        <small class="text-danger mt-2 d-block"
                            v-if="cantidadPersonas === mesaSeleccionada?.capacidad">Capacidad máxima alcanzada</small>
                    </div>
                    <div class="modal-footer border-0 justify-content-center">
                        <button type="button" class="btn btn-primary-resto text-white w-100"
                            @click="confirmarAperturaMesa">
                            Ir a tomar pedido
                        </button>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import '@/assets/css/mesas.css';
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
// Importar Modal de Bootstrap de forma global o via JS (Asegúrate de que bootstrap JS esté cargado en tu index.html o importado)
import * as bootstrap from 'bootstrap';

import NavbarComponent from '@/components/NavbarComponent.vue';
import SidebarComponent from '@/components/SidebarComponent.vue';

// Servicios
import { obtenerMesas, crearMesa, actualizarMesa, obtenerMesaPorId } from '@/services/mesaService';
import pedidoService from '@/services/pedidoService';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

// --- ESTADO ---
const entidades = ref([]);
const mesaSeleccionada = ref(null);
const filtros = ref({ busqueda: '', piso: '', estado: '' });

const cantidadPersonas = ref(1);
const cargandoMesas = ref(true);
const errorMesas = ref('');
const mensajeMesas = ref('');

// Estado para creación/edición de una mesa
const entidad = ref({
    idMesa: 0,
    numeroMesa: "",
    capacidad: "",
    piso: "",
    estadoMesa: "libre",
    eliminado: false
});

// --- COMPUTED ---
const mesasFiltradas = computed(() => {
    return entidades.value.filter(m => {
        // Ignorar las eliminadas lógicamente si aplicara
        if (m.eliminado) return false;

        const matchBusqueda = !filtros.value.busqueda || m.numeroMesa.toString().includes(filtros.value.busqueda);
        const matchPiso = !filtros.value.piso || m.piso == filtros.value.piso;
        const matchEstado = !filtros.value.estado || m.estadoMesa.descripcion === filtros.value.estado;
        return matchBusqueda && matchPiso && matchEstado;
    });
});

const pisos = computed(() => [...new Set(entidades.value.filter(m => !m.eliminado).map(m => m.piso))].sort());
const hayFiltros = computed(() => Boolean(filtros.value.busqueda || filtros.value.piso || filtros.value.estado));
const esAdministrador = computed(() => String(authStore.usuario?.rol || '').toUpperCase() === 'ADMIN');
const puedeCobrar = computed(() => ['ADMIN', 'CAJERO'].includes(String(authStore.usuario?.rol || '').toUpperCase()));

const resumenCalculado = computed(() => {
    const activas = entidades.value.filter(m => !m.eliminado);
    return {
        libres: activas.filter(m => m.estadoMesa.descripcion === 'libre').length,
        ocupadas: activas.filter(m => m.estadoMesa.descripcion === 'ocupada').length,
        reservadas: activas.filter(m => m.estadoMesa.descripcion === 'reservada').length,
        cobrar: activas.filter(m => m.estadoMesa.descripcion === 'cobrar').length
    };
});

// --- MÉTODOS ---

const listar = async () => {
    cargandoMesas.value = true;
    errorMesas.value = '';
    try {
        entidades.value = await obtenerMesas();

        // Si hay una mesa seleccionada, actualizamos su información en el panel
        if (mesaSeleccionada.value) {
            const actualizada = entidades.value.find(m => m.idMesa === mesaSeleccionada.value.idMesa);
            mesaSeleccionada.value = actualizada || null;
        }

    } catch (e) {
        console.error("Error al listar mesas:", e);
        errorMesas.value = e.response?.data?.mensaje || 'No se pudo consultar el estado del salón.';
    } finally {
        cargandoMesas.value = false;
    }
};

const solicitarCuentaSeleccionada = async () => {
    if (!mesaSeleccionada.value?.pedido?.idPedido) return;
    errorMesas.value = '';
    mensajeMesas.value = '';
    try {
        await pedidoService.solicitarCuenta(mesaSeleccionada.value.pedido.idPedido);
        mensajeMesas.value = `La cuenta del pedido #${mesaSeleccionada.value.pedido.idPedido} fue enviada a Caja.`;
        await listar();
    } catch (error) {
        errorMesas.value = error.response?.data?.mensaje || 'No se pudo solicitar la cuenta.';
    }
};

const seleccionarMesa = (mesa) => {
    mesaSeleccionada.value = mesa;
};

const limpiarFiltros = () => {
    filtros.value = { busqueda: '', piso: '', estado: '' };
};

// Utilidades UI
const labelResumen = (key) => ({ libres: 'Disponibles', ocupadas: 'En Servicio', reservadas: 'Reservas', cobrar: 'Cuentas' }[key]);
const iconResumen = (key) => ({ libres: 'bi bi-check2-circle text-success', ocupadas: 'bi bi-fire text-danger', reservadas: 'bi bi-calendar-event text-primary', cobrar: 'bi bi-wallet2 text-warning' }[key]);


// --- ABM MESAS (Crear / Editar) ---

const nuevo = () => {
    entidad.value = { idMesa: 0, numeroMesa: "", capacidad: "", piso: "", estadoMesa: "libre", eliminado: false };
    const modal = new bootstrap.Modal(document.getElementById('mdlEntidad'));
    modal.show();
};

const editarMesa = async (idMesa) => {
    try {
        const data = await obtenerMesaPorId(idMesa);
        entidad.value = { ...data };
        const modal = new bootstrap.Modal(document.getElementById('mdlEntidad'));
        modal.show();
    } catch (error) {
        console.error("Error al obtener mesa para editar", error);
    }
};

const guardarMesa = async () => {
    try {
        if (entidad.value.idMesa === 0) {
            await crearMesa(entidad.value);
        } else {
            await actualizarMesa(entidad.value.idMesa, entidad.value);
        }

        // Cerrar modal
        bootstrap.Modal.getInstance(document.getElementById('mdlEntidad'))?.hide();

        // Refrescar lista
        await listar();

    } catch (error) {
        console.error("Error guardando mesa:", error);
        alert("Ocurrió un error al guardar la mesa");
    }
};


// --- OPERATIVA (Apertura y Cobro) ---

const abrirApertura = () => {
    cantidadPersonas.value = 1;
    const modal = new bootstrap.Modal(document.getElementById('mdlAperturaMesa'));
    modal.show();
};

const confirmarAperturaMesa = () => {
    if (!cantidadPersonas.value || cantidadPersonas.value <= 0) {
        alert("Por favor ingresa una cantidad válida de personas.");
        return;
    }

    bootstrap.Modal.getInstance(document.getElementById('mdlAperturaMesa'))?.hide();

    // 🌟 AHORA REDIRIGE AL NUEVO POS INTERACTIVO
    router.push({
        path: '/nuevo-pedido',
        query: {
            idMesa: mesaSeleccionada.value.idMesa,
            numeroMesa: mesaSeleccionada.value.numeroMesa,
            origen: 'mesas'
        }
    });
};

const abrirPedidoSeleccionado = () => {
    if (!mesaSeleccionada.value?.pedido) return;
    router.push({
        path: '/nuevo-pedido',
        query: {
            idPedido: mesaSeleccionada.value.pedido.idPedido,
            idMesa: mesaSeleccionada.value.idMesa,
            numeroMesa: mesaSeleccionada.value.numeroMesa,
            origen: 'mesas'
        }
    });
};

const irACaja = () => {
    if (!mesaSeleccionada.value?.pedido) return;
    router.push({
        path: '/caja',
        query: { idPedido: mesaSeleccionada.value.pedido.idPedido }
    });
};

const mensajeMesaSinPedido = computed(() => {
    if (mesaSeleccionada.value?.estadoMesa?.descripcion === 'libre') {
        return 'Mesa disponible sin consumo';
    }
    return 'El pedido de esta mesa pertenece a otro mesero';
});

const abrirUnion = () => {
    alert("Función de unir mesas en desarrollo para la próxima versión de Vue.");
};

onMounted(() => {
    listar();
});

</script>

<style scoped>
/* CSS Ajustado específicamente para este componente.
   Evitamos que colisione con otros componentes globales */
.main-container-mesas {
    background-color: transparent;
    min-height: calc(100vh - 70px);
}

.card-kpi {
    background: #fff;
    padding: 1.5rem;
    border-radius: 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid #edf2f7;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.kpi-label {
    font-size: 0.85rem;
    color: #718096;
    font-weight: 600;
    text-transform: uppercase;
}

.kpi-value {
    font-size: 1.8rem;
    font-weight: 800;
    margin: 0;
    color: #2d3748;
}

.kpi-icon i {
    font-size: 2.5rem;
    opacity: 0.8;
}

.libres {
    border-bottom: 4px solid #48bb78;
}

.ocupadas {
    border-bottom: 4px solid #f56565;
}

.reservadas {
    border-bottom: 4px solid #4299e1;
}

.cobrar {
    border-bottom: 4px solid #ed8936;
}

.input-group-modern {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.5rem 1rem;
    display: flex;
    align-items: center;
    gap: 10px;
}

.input-group-modern input {
    border: none;
    outline: none;
    width: 100%;
    color: #4a5568;
    background: transparent;
}

.mesa-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 1.5rem;
}

.mesa-card-v2 {
    background: #fff;
    border-radius: 16px;
    border: 2px solid transparent;
    padding: 1.5rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    position: relative;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.mesa-card-v2:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.mesa-card-v2.active {
    border-color: #dc7448;
    background: #fffaf0;
}

.mesa-circle {
    width: 65px;
    height: 65px;
    border-radius: 50%;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    border: 3px solid #edf2f7;
    font-weight: 800;
    font-size: 1.5rem;
}

.libre .mesa-circle {
    color: #38a169;
    border-color: #c6f6d5;
    background: #f0fff4;
}

.ocupada .mesa-circle {
    color: #e53e3e;
    border-color: #fed7d7;
    background: #fff5f5;
}

.reservada .mesa-circle {
    color: #3182ce;
    border-color: #bee3f8;
    background: #ebf8ff;
}

.cobrar .mesa-circle {
    color: #dd6b20;
    border-color: #feebc8;
    background: #fffaf0;
}

.mesa-badge-status {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 0.65rem;
    text-transform: uppercase;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 6px;
    background: #edf2f7;
    color: #4a5568;
}

.libre .mesa-badge-status {
    background: #c6f6d5;
    color: #22543d;
}

.ocupada .mesa-badge-status {
    background: #fed7d7;
    color: #742a2a;
}

.cobrar .mesa-badge-status {
    background: #feebc8;
    color: #7b341e;
}

.btn-primary-resto {
    background: #dc7448;
    border-color: #dc7448;
}

.btn-primary-resto:hover {
    background: #c5633a;
    border-color: #c5633a;
}
</style>
