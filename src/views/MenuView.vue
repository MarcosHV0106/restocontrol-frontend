<template>
    <div class="layout">
        <SidebarComponent />

        <div class="main-content">
            <NavbarComponent />

            <main class="p-4 p-md-5">
                <h2 class="fw-bold mb-1">Menu y Categorias</h2>

                <p class="text-muted mb-4" v-if="tabActual === 'alimentos'">
                    Gestiona los platos disponibles para el menu del restaurante.
                </p>
                <p class="text-muted mb-4" v-if="tabActual === 'categorias'">
                    Gestiona las categorias de tu menu.
                </p>
                <p class="text-muted mb-4" v-if="tabActual === 'estimacion'">
                    Proyección y control de estimaciones.
                </p>

                <div class="tabs-container mb-4">
                    <button class="btn px-4 py-2 border-0"
                            :class="{ active: tabActual === 'alimentos' }"
                            @click="tabActual = 'alimentos'">Alimentos/Platos</button>
                    <button class="btn px-4 py-2 border-0"
                            :class="{ active: tabActual === 'categorias' }"
                            @click="tabActual = 'categorias'">Categorias</button>
                    <button class="btn px-4 py-2 border-0"
                            :class="{ active: tabActual === 'estimacion' }"
                            @click="tabActual = 'estimacion'">Estimacion Diaria</button>
                </div>

                <div v-if="tabActual === 'alimentos'">
                    <div class="d-flex justify-content-between align-items-center mb-4 gap-3 flex-wrap">
                        <div class="input-group bg-white" style="width: 100%; max-width: 500px; border-radius: 8px; border: 1px solid #f0e6da;">
                            <span class="input-group-text bg-transparent border-0">
                                <i class="bi bi-search text-muted"></i>
                            </span>
                            <input type="text"
                                   class="form-control border-0 bg-transparent"
                                   placeholder="Buscar alimento..."
                                   v-model="busquedaAlimento"
                                   style="box-shadow: none;">
                        </div>
                        <button class="btn btn-brand rounded-3 px-4 py-2 fw-medium"
                                @click="abrirModalAlimentoNuevo">
                            <i class="bi bi-plus-lg me-1"></i> Registrar Alimento
                        </button>
                    </div>

                    <div class="custom-table-card shadow-sm">
                        <table class="table table-hover mb-0">
                            <thead>
                                <tr>
                                    <th class="ps-4 py-3">Nombre</th>
                                    <th class="py-3">Categoria</th>
                                    <th class="py-3">Precio (S/)</th>
                                    <th class="py-3">Costo receta (S/)</th>
                                    <th class="py-3 text-center">Estado</th>
                                    <th class="pe-4 py-3 text-end">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="alimento in alimentosFiltrados"
                                    :key="alimento.idAlimento"
                                    :class="{ 'fila-inactiva': !alimento.disponible }">
                                    <td class="ps-4 py-3 fw-bold">
                                        <div class="d-flex align-items-center gap-3">
                                            <div class="food-icon-box d-flex align-items-center justify-content-center">
                                                <i class="bi bi-egg-fried fs-5"></i>
                                            </div>
                                            <div>
                                                <span>{{ alimento.nombreAlimento }}</span>
                                                <div class="text-muted fw-normal small" v-if="alimento.descripcion">
                                                    {{ alimento.descripcion }}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="py-3">
                                        <span class="badge rounded-pill badge-soft-blue px-3 py-2">
                                            {{ alimento.categoria ? alimento.categoria.nombreCategoria : 'Sin categoria' }}
                                        </span>
                                    </td>
                                    <td class="py-3 fw-medium">{{ formatearPrecio(alimento.precio) }}</td>
                                    <td class="py-3 fw-medium">
                                        <span :class="Number(alimento.costoReceta) > 0 ? 'text-success' : 'text-warning'">
                                            {{ formatearPrecio(alimento.costoReceta) }}
                                        </span>
                                    </td>
                                    <td class="py-3 text-center">
                                        <span class="badge rounded-pill px-3 py-2"
                                              :class="alimento.disponible ? 'badge-soft-green' : 'bg-secondary text-white'">
                                            {{ alimento.disponible ? 'Disponible' : 'No disponible' }}
                                        </span>
                                    </td>
                                    <td class="pe-4 py-3 text-end">
                                        <button class="btn btn-sm text-muted p-1 me-1"
                                                @click="abrirReceta(alimento)"
                                                title="Configurar receta y costos">
                                            <i class="bi bi-card-checklist fs-5"></i>
                                        </button>
                                        <button class="btn btn-sm text-muted p-1 me-1"
                                                @click="editarAlimento(alimento)"
                                                title="Editar alimento">
                                            <i class="bi bi-pencil-square fs-5"></i>
                                        </button>
                                        <button class="btn btn-sm text-muted p-1"
                                                @click="procederEliminarAlimento(alimento.idAlimento)"
                                                title="Eliminar alimento">
                                            <i class="bi bi-trash fs-5"></i>
                                        </button>
                                    </td>
                                </tr>
                                <tr v-if="alimentosFiltrados.length === 0">
                                        <td colspan="6" class="text-center py-5 text-muted">
                                            <div class="spinner-border" role="status">
                                                <span class="visually-hidden">Cargando...</span>
                                            </div>
                                        </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div v-if="tabActual === 'categorias'">
                    <div class="d-flex justify-content-between align-items-center mb-4 gap-3 flex-wrap">
                        <div class="input-group bg-white" style="width: 100%; max-width: 500px; border-radius: 8px; border: 1px solid #f0e6da;">
                            <span class="input-group-text bg-transparent border-0">
                                <i class="bi bi-search text-muted"></i>
                            </span>
                            <input type="text"
                                   class="form-control border-0 bg-transparent"
                                   placeholder="Buscar categoria..."
                                   v-model="busquedaCategoria"
                                   style="box-shadow: none;">
                        </div>
                        <button class="btn btn-brand rounded-3 px-4 py-2 fw-medium"
                                @click="abrirModalCategoriaNueva">
                            <i class="bi bi-plus-lg me-1"></i> Registrar categoria
                        </button>
                    </div>

                    <div class="custom-table-card shadow-sm">
                        <table class="table table-hover mb-0">
                            <thead>
                                <tr>
                                    <th class="ps-4 py-3">Nombre</th>
                                    <th class="py-3">Descripcion</th>
                                    <th class="py-3 text-center">Cant. de platos</th>
                                    <th class="py-3 text-center">Estado</th>
                                    <th class="pe-4 py-3 text-end">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="categoria in categoriasFiltradas"
                                    :key="categoria.idCategoria"
                                    :class="{ 'categoria-inactiva': categoria.eliminado }">
                                    <td class="ps-4 py-3 fw-bold">{{ categoria.nombreCategoria }}</td>
                                    <td class="py-3 text-muted">{{ categoria.descripcion }}</td>
                                    <td class="py-3 text-center">
                                        <span class="badge rounded-pill badge-soft-orange px-3 py-2">
                                            {{ contarAlimentosPorCategoria(categoria.idCategoria) }}
                                        </span>
                                    </td>
                                    <td class="py-3 text-center">
                                        <span class="badge rounded-pill px-3 py-2"
                                              :class="categoria.eliminado ? 'bg-secondary text-white' : 'badge-soft-green'">
                                            {{ categoria.eliminado ? 'Inactivo' : 'Activo' }}
                                        </span>
                                    </td>
                                    <td class="pe-4 py-3 text-end">
                                        <button class="btn btn-sm text-muted p-1 me-1"
                                                @click="editarCategoria(categoria)"
                                                :disabled="categoria.eliminado"
                                                :title="categoria.eliminado ? 'Categoria inactiva' : 'Editar categoria'">
                                            <i class="bi bi-pencil-square fs-5"></i>
                                        </button>
                                        <button class="btn btn-sm text-muted p-1"
                                                @click="cambiarEstadoCategoria(categoria)"
                                                :title="categoria.eliminado ? 'Activar categoria' : 'Desactivar categoria'">
                                            <i :class="categoria.eliminado ? 'bi bi-eye' : 'bi bi-eye-slash'" class="fs-5"></i>
                                        </button>
                                    </td>
                                </tr>
                                <tr v-if="categoriasFiltradas.length === 0">
                                        <td colspan="5" class="text-center py-5 text-muted">
                                            <div class="spinner-border" role="status">
                                                <span class="visually-hidden">Cargando...</span>
                                            </div>
                                        </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div v-if="tabActual === 'estimacion'">
                    <div class="custom-table-card shadow-sm p-4 text-muted">
                        La estimacion diaria queda pendiente para otra fase.
                    </div>
                </div>
            </main>
        </div>

        <div class="modal fade" id="registrarAlimentoModal" tabindex="-1" aria-labelledby="registrarAlimentoModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" style="max-width: 560px;">
                <div class="modal-content border-0 p-3 shadow-lg" style="border-radius: 16px;">
                    <div class="modal-header border-0 pb-0">
                        <h4 class="modal-title fw-bold" id="registrarAlimentoModalLabel" style="color: #2c1a04; font-size: 1.4rem;">
                            {{ modoEdicionAlimento ? 'Editar Alimento' : 'Registrar Nuevo Alimento' }}
                        </h4>
                    </div>

                    <div class="modal-body py-3">
                        <form @submit.prevent="guardarAlimento">
                            <div class="mb-3">
                                <label for="nombreAlimento" class="form-label fw-medium text-dark mb-1" style="font-size: 0.9rem;">Nombre del alimento</label>
                                <input type="text"
                                       class="form-control px-3 py-2"
                                       id="nombreAlimento"
                                       v-model="nuevoAlimento.nombreAlimento"
                                       placeholder="Ej: Lomo saltado"
                                       style="border-radius: 8px; border: 1px solid #e2d9cf; box-shadow: none;" required>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="precioAlimento" class="form-label fw-medium text-dark mb-1" style="font-size: 0.9rem;">Precio</label>
                                    <input type="number"
                                           min="0"
                                           step="0.01"
                                           class="form-control px-3 py-2"
                                           id="precioAlimento"
                                           v-model="nuevoAlimento.precio"
                                           placeholder="0.00"
                                           style="border-radius: 8px; border: 1px solid #e2d9cf; box-shadow: none;" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="categoriaAlimento" class="form-label fw-medium text-dark mb-1" style="font-size: 0.9rem;">Categoria</label>
                                    <select class="form-select px-3 py-2"
                                            id="categoriaAlimento"
                                            v-model="nuevoAlimento.idCategoria"
                                            style="border-radius: 8px; border: 1px solid #e2d9cf; box-shadow: none;" required>
                                        <option value="">Seleccione una categoria</option>
                                        <option v-for="categoria in categoriasActivas"
                                                :key="categoria.idCategoria"
                                                :value="categoria.idCategoria">
                                            {{ categoria.nombreCategoria }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="descripcionAlimento" class="form-label fw-medium text-dark mb-1" style="font-size: 0.9rem;">Descripcion</label>
                                <textarea class="form-control px-3 py-2"
                                          id="descripcionAlimento"
                                          rows="3"
                                          v-model="nuevoAlimento.descripcion"
                                          placeholder="Describe este alimento..."
                                          style="border-radius: 8px; border: 1px solid #e2d9cf; box-shadow: none; resize: none;"></textarea>
                            </div>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" role="switch" id="disponibleAlimento" v-model="nuevoAlimento.disponible">
                                <label class="form-check-label" for="disponibleAlimento">Disponible para venta</label>
                            </div>
                        </form>
                    </div>

                    <div class="modal-footer border-0 pt-0 d-flex gap-3">
                        <button type="button" class="btn btn-light bg-white text-muted w-100 py-2 fw-medium border" data-bs-dismiss="modal" style="border-radius: 8px; border-color: #e2d9cf !important; font-size: 0.95rem;">
                            Cancelar
                        </button>
                        <button type="button"
                                class="btn text-white w-100 py-2 fw-medium"
                                @click="guardarAlimento"
                                style="background-color: var(--brand-color); border-radius: 8px; font-size: 0.95rem;">
                            {{ modoEdicionAlimento ? 'Guardar Cambios' : 'Registrar' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade" id="recetaAlimentoModal" tabindex="-1" aria-labelledby="recetaAlimentoModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content border-0 shadow-lg receta-modal">
                    <div class="modal-header">
                        <div>
                            <h4 class="modal-title fw-bold" id="recetaAlimentoModalLabel">Receta de {{ recetaAlimento.nombre }}</h4>
                            <p class="text-muted small mb-0">Indica cuánto insumo consume una unidad del plato y su costo por unidad de medida.</p>
                        </div>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>

                    <div class="modal-body">
                        <div class="receta-nuevo-insumo mb-4">
                            <h6 class="fw-bold mb-3"><i class="bi bi-plus-circle me-2"></i>Registrar insumo rápido</h6>
                            <div class="row g-2 align-items-end">
                                <div class="col-md-4">
                                    <label class="form-label small fw-semibold">Nombre</label>
                                    <input v-model="nuevoInsumo.nombreInsumo" class="form-control" placeholder="Ej: Arroz">
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label small fw-semibold">Unidad de medida</label>
                                    <input v-model="nuevoInsumo.unidadMedida" class="form-control" placeholder="kg, litro, unidad...">
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label small fw-semibold">Costo por unidad (S/)</label>
                                    <input v-model.number="nuevoInsumo.costoUnitario" type="number" min="0.0001" step="0.0001" class="form-control" placeholder="0.0000">
                                </div>
                                <div class="col-md-2 d-grid">
                                    <button class="btn btn-outline-dark" :disabled="guardandoInsumo" @click="registrarInsumoRapido">
                                        <span v-if="guardandoInsumo" class="spinner-border spinner-border-sm"></span>
                                        <span v-else><i class="bi bi-plus-lg me-1"></i>Agregar</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div v-if="cargandoReceta" class="text-center py-5">
                            <div class="spinner-border text-secondary"></div>
                            <p class="text-muted mt-2">Cargando insumos...</p>
                        </div>

                        <div v-else class="table-responsive receta-tabla-wrap">
                            <table class="table align-middle mb-0 receta-tabla">
                                <thead>
                                    <tr>
                                        <th class="text-center">Usar</th>
                                        <th>Insumo</th>
                                        <th>Unidad</th>
                                        <th>Costo por unidad (S/)</th>
                                        <th>Cantidad por plato</th>
                                        <th class="text-end">Subtotal (S/)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="fila in filasReceta" :key="fila.idInsumo" :class="{ 'receta-fila-inactiva': !fila.seleccionado }">
                                        <td class="text-center">
                                            <input v-model="fila.seleccionado" class="form-check-input" type="checkbox" :aria-label="`Usar ${fila.nombreInsumo}`">
                                        </td>
                                        <td class="fw-semibold">{{ fila.nombreInsumo }}</td>
                                        <td><span class="badge text-bg-light">{{ fila.unidadMedida }}</span></td>
                                        <td>
                                            <input v-model.number="fila.costoUnitario" :disabled="!fila.seleccionado" type="number" min="0.0001" step="0.0001" class="form-control form-control-sm receta-input">
                                        </td>
                                        <td>
                                            <input v-model.number="fila.cantidad" :disabled="!fila.seleccionado" type="number" min="0.0001" step="0.0001" class="form-control form-control-sm receta-input">
                                        </td>
                                        <td class="text-end fw-semibold">{{ formatearCostoReceta(fila) }}</td>
                                    </tr>
                                    <tr v-if="filasReceta.length === 0">
                                        <td colspan="6" class="text-center text-muted py-4">Aún no hay insumos. Registra el primero en el formulario superior.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="receta-total mt-3">
                            <span>Costo teórico por plato</span>
                            <strong>S/ {{ costoTotalReceta }}</strong>
                        </div>

                        <div v-if="errorReceta" class="alert alert-danger mt-3 mb-0">{{ errorReceta }}</div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-brand" :disabled="guardandoReceta || cargandoReceta" @click="guardarReceta">
                            <span v-if="guardandoReceta" class="spinner-border spinner-border-sm me-1"></span>
                            Guardar receta
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade" id="registrarCategoriaModal" tabindex="-1" aria-labelledby="registrarCategoriaModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" style="max-width: 480px;">
                <div class="modal-content border-0 p-3 shadow-lg" style="border-radius: 16px;">
                    <div class="modal-header border-0 pb-0">
                        <h4 class="modal-title fw-bold" id="registrarCategoriaModalLabel" style="color: #2c1a04; font-size: 1.4rem;">
                            {{ modoEdicion ? 'Editar Categoria' : 'Registrar Nueva Categoria' }}
                        </h4>
                    </div>

                    <div class="modal-body py-3">
                        <form id="formRegistrarCategoria" @submit.prevent="guardarCategoria">
                            <div class="mb-3">
                                <label for="nombreCategoria" class="form-label fw-medium text-dark mb-1" style="font-size: 0.9rem;">Nombre de la Categoria</label>
                                <input type="text"
                                       class="form-control px-3 py-2"
                                       id="nombreCategoria"
                                       v-model="nuevaCategoria.nombreCategoria"
                                       placeholder="Ej: Entradas"
                                       style="border-radius: 8px; border: 1px solid #e2d9cf; box-shadow: none;" required>
                            </div>
                            <div class="mb-2">
                                <label for="descripcionCategoria" class="form-label fw-medium text-dark mb-1" style="font-size: 0.9rem;">Descripcion</label>
                                <textarea class="form-control px-3 py-2"
                                          id="descripcionCategoria"
                                          rows="4"
                                          v-model="nuevaCategoria.descripcion"
                                          placeholder="Describe esta categoria..."
                                          style="border-radius: 8px; border: 1px solid #e2d9cf; box-shadow: none; resize: none;"></textarea>
                            </div>
                        </form>
                    </div>

                    <div class="modal-footer border-0 pt-0 d-flex gap-3">
                        <button type="button" class="btn btn-light bg-white text-muted w-100 py-2 fw-medium border" data-bs-dismiss="modal" style="border-radius: 8px; border-color: #e2d9cf !important; font-size: 0.95rem;">
                            Cancelar
                        </button>
                        <button type="button"
                                class="btn text-white w-100 py-2 fw-medium"
                                @click="guardarCategoria"
                                style="background-color: var(--brand-color); border-radius: 8px; font-size: 0.95rem;">
                            {{ modoEdicion ? 'Guardar Cambios' : 'Registrar' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import '@/assets/css/menu.css'
import { ref, computed, onMounted } from 'vue'
import * as bootstrap from 'bootstrap'

import SidebarComponent from '@/components/SidebarComponent.vue'
import NavbarComponent from '@/components/NavbarComponent.vue'

import * as menuService from '@/services/menuService'

// ================= ESTADOS REACTIVOS =================
const tabActual = ref('alimentos')
const alimentos = ref([])
const categorias = ref([])
const insumos = ref([])
const busquedaAlimento = ref('')
const busquedaCategoria = ref('')

// Estados de edición
const modoEdicionAlimento = ref(false)
const alimentoEditandoId = ref(null)
const modoEdicion = ref(false)
const categoriaEditandoId = ref(null)
const recetaAlimento = ref({ idAlimento: null, nombre: '' })
const filasReceta = ref([])
const cargandoReceta = ref(false)
const guardandoReceta = ref(false)
const guardandoInsumo = ref(false)
const errorReceta = ref('')
const nuevoInsumo = ref({ nombreInsumo: '', unidadMedida: '', costoUnitario: '' })

const nuevoAlimento = ref({
    nombreAlimento: '', descripcion: '', precio: '', disponible: true, idCategoria: ''
})

const nuevaCategoria = ref({
    nombreCategoria: '', descripcion: ''
})

// ================= PROPIEDADES COMPUTADAS =================
const categoriasActivas = computed(() => categorias.value)
const costoTotalReceta = computed(() => filasReceta.value
    .filter(fila => fila.seleccionado)
    .reduce((total, fila) => total + Number(fila.cantidad || 0) * Number(fila.costoUnitario || 0), 0)
    .toFixed(2))

const alimentosFiltrados = computed(() => {
    const termino = busquedaAlimento.value.trim().toLowerCase()
    if (!termino) return alimentos.value
    return alimentos.value.filter(alimento => {
        const cat = alimento.categoria ? alimento.categoria.nombreCategoria : ''
        return [alimento.nombreAlimento, alimento.descripcion, cat]
            .some(valor => (valor || '').toString().toLowerCase().includes(termino))
    })
})

const categoriasFiltradas = computed(() => {
    const termino = busquedaCategoria.value.trim().toLowerCase()
    if (!termino) return categorias.value
    return categorias.value.filter(cat =>
        cat.nombreCategoria.toLowerCase().includes(termino) ||
        (cat.descripcion && cat.descripcion.toLowerCase().includes(termino))
    )
})

// ================= UTILIDADES =================
const formatearPrecio = (precio) => {
    return precio ? parseFloat(precio).toFixed(2) : '0.00'
}

const formatearCostoReceta = fila => (
    Number(fila.cantidad || 0) * Number(fila.costoUnitario || 0)
).toFixed(2)

const contarAlimentosPorCategoria = (idCategoria) => {
    return alimentos.value.filter(a => a.categoria && a.categoria.idCategoria === idCategoria).length
}

const cerrarModalVisual = (idModal) => {
    const modalElement = document.getElementById(idModal)
    if (modalElement) {
        const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement)
        modalInstance.hide()
    }
}

// ================= MÉTODOS DE CONTROL =================
const cargarDatos = async () => {
    try {
        alimentos.value = await menuService.obtenerAlimentos()
        categorias.value = await menuService.obtenerCategorias()
    } catch (error) {
        console.error('Error al sincronizar datos del menú:', error)
    }
}

// --- Gestión Alimentos ---
const abrirModalAlimentoNuevo = () => {
    modoEdicionAlimento.value = false
    alimentoEditandoId.value = null
    nuevoAlimento.value = { nombreAlimento: '', descripcion: '', precio: '', disponible: true, idCategoria: '' }

    const modal = new bootstrap.Modal(document.getElementById('registrarAlimentoModal'))
    modal.show()
}

const editarAlimento = (alimento) => {
    modoEdicionAlimento.value = true
    alimentoEditandoId.value = alimento.idAlimento // <-- CORREGIDO: Antes estaba en null
    nuevoAlimento.value = {
        nombreAlimento: alimento.nombreAlimento,
        descripcion: alimento.descripcion || '',
        precio: alimento.precio,
        disponible: alimento.disponible,
        idCategoria: alimento.categoria ? alimento.categoria.idCategoria : ''
    }

    const modal = new bootstrap.Modal(document.getElementById('registrarAlimentoModal'))
    modal.show()
}

const guardarAlimento = async () => {
    // Validaciones básicas
    if (!nuevoAlimento.value.nombreAlimento || !nuevoAlimento.value.precio || !nuevoAlimento.value.idCategoria) {
        alert("Completa los campos obligatorios del alimento.");
        return;
    }

    const payload = {
        nombreAlimento: nuevoAlimento.value.nombreAlimento,
        descripcion: nuevoAlimento.value.descripcion,
        precio: parseFloat(nuevoAlimento.value.precio),
        disponible: nuevoAlimento.value.disponible,
        categoria: { idCategoria: parseInt(nuevoAlimento.value.idCategoria) }
    }

    try {
        if (modoEdicionAlimento.value && alimentoEditandoId.value) {
            await menuService.actualizarAlimento(alimentoEditandoId.value, payload)
        } else {
            await menuService.crearAlimento(payload)
        }
        await cargarDatos()
        cerrarModalVisual('registrarAlimentoModal')
    } catch (error) {
        console.error('Error al procesar alimento:', error)
    }
}

const procederEliminarAlimento = async (id) => {
    if (confirm('¿Seguro que deseas eliminar este alimento?')) {
        try {
            await menuService.eliminarAlimento(id)
            await cargarDatos()
        } catch (error) {
            console.error('Error al remover alimento:', error)
        }
    }
}

const cargarFilasReceta = async () => {
    const [listaInsumos, recetaActual] = await Promise.all([
        menuService.obtenerInsumos(),
        menuService.obtenerReceta(recetaAlimento.value.idAlimento)
    ])
    insumos.value = listaInsumos
    const cantidades = new Map(recetaActual.map(detalle => [detalle.idInsumo, detalle.cantidad]))
    filasReceta.value = listaInsumos.map(insumo => ({
        ...insumo,
        seleccionado: cantidades.has(insumo.idInsumo),
        cantidad: cantidades.get(insumo.idInsumo) || '',
        costoUnitario: Number(insumo.costoUnitario || 0)
    }))
}

const abrirReceta = async alimento => {
    recetaAlimento.value = { idAlimento: alimento.idAlimento, nombre: alimento.nombreAlimento }
    errorReceta.value = ''
    cargandoReceta.value = true
    const modal = new bootstrap.Modal(document.getElementById('recetaAlimentoModal'))
    modal.show()
    try {
        await cargarFilasReceta()
    } catch (error) {
        console.error('No se pudo cargar la receta:', error)
        errorReceta.value = 'No fue posible cargar los insumos y la receta.'
    } finally {
        cargandoReceta.value = false
    }
}

const registrarInsumoRapido = async () => {
    errorReceta.value = ''
    const costo = Number(nuevoInsumo.value.costoUnitario)
    if (!nuevoInsumo.value.nombreInsumo.trim() || !nuevoInsumo.value.unidadMedida.trim() || costo <= 0) {
        errorReceta.value = 'Completa el nombre, la unidad y un costo unitario mayor a cero.'
        return
    }
    guardandoInsumo.value = true
    try {
        await menuService.crearInsumo({
            nombreInsumo: nuevoInsumo.value.nombreInsumo.trim(),
            unidadMedida: nuevoInsumo.value.unidadMedida.trim(),
            stockActual: 0,
            stockMinimo: 0,
            costoUnitario: costo
        })
        nuevoInsumo.value = { nombreInsumo: '', unidadMedida: '', costoUnitario: '' }
        await cargarFilasReceta()
    } catch (error) {
        console.error('No se pudo registrar el insumo:', error)
        errorReceta.value = error.response?.data?.message || 'No fue posible registrar el insumo.'
    } finally {
        guardandoInsumo.value = false
    }
}

const guardarReceta = async () => {
    errorReceta.value = ''
    const seleccionados = filasReceta.value.filter(fila => fila.seleccionado)
    if (seleccionados.length === 0) {
        errorReceta.value = 'Selecciona al menos un insumo para la receta.'
        return
    }
    if (seleccionados.some(fila => Number(fila.cantidad) <= 0 || Number(fila.costoUnitario) <= 0)) {
        errorReceta.value = 'Todos los insumos seleccionados deben tener cantidad y costo mayores a cero.'
        return
    }

    guardandoReceta.value = true
    try {
        await Promise.all(seleccionados.map(fila => menuService.actualizarInsumo(fila.idInsumo, {
            idInsumo: fila.idInsumo,
            nombreInsumo: fila.nombreInsumo,
            unidadMedida: fila.unidadMedida,
            stockActual: fila.stockActual,
            stockMinimo: fila.stockMinimo,
            costoUnitario: Number(fila.costoUnitario)
        })))
        await menuService.reemplazarReceta(recetaAlimento.value.idAlimento, seleccionados.map(fila => ({
            idInsumo: fila.idInsumo,
            cantidad: Number(fila.cantidad)
        })))
        await cargarDatos()
        cerrarModalVisual('recetaAlimentoModal')
    } catch (error) {
        console.error('No se pudo guardar la receta:', error)
        errorReceta.value = error.response?.data?.message || 'No fue posible guardar la receta.'
    } finally {
        guardandoReceta.value = false
    }
}

// --- Gestión Categorías ---
const abrirModalCategoriaNueva = () => {
    modoEdicion.value = false
    categoriaEditandoId.value = null
    nuevaCategoria.value = { nombreCategoria: '', descripcion: '' }

    const modal = new bootstrap.Modal(document.getElementById('registrarCategoriaModal'))
    modal.show()
}

const editarCategoria = (categoria) => {
    modoEdicion.value = true
    categoriaEditandoId.value = categoria.idCategoria
    nuevaCategoria.value = {
        nombreCategoria: categoria.nombreCategoria,
        descripcion: categoria.descripcion || ''
    }

    const modal = new bootstrap.Modal(document.getElementById('registrarCategoriaModal'))
    modal.show()
}

const guardarCategoria = async () => {
    if (!nuevaCategoria.value.nombreCategoria) {
        alert("El nombre de la categoría es obligatorio.");
        return;
    }

    try {
        if (modoEdicion.value && categoriaEditandoId.value) {
            await menuService.actualizarCategoria(categoriaEditandoId.value, nuevaCategoria.value)
        } else {
            await menuService.crearCategoria(nuevaCategoria.value)
        }
        await cargarDatos()
        cerrarModalVisual('registrarCategoriaModal')
    } catch (error) {
        console.error('Error al procesar categoría:', error)
    }
}

// Para el botón de "Ojito" en las categorías
const cambiarEstadoCategoria = async (categoria) => {
    try {
        const payload = { ...categoria, eliminado: !categoria.eliminado }
        await menuService.actualizarCategoria(categoria.idCategoria, payload)
        await cargarDatos()
    } catch (error) {
        console.error('Error al cambiar el estado de la categoría:', error)
    }
}

// ================= CICLO DE VIDA =================
onMounted(() => {
    cargarDatos()
})
</script>

<style scoped>
/* Transiciones base si deseas mantener el efecto suave al cambiar pestañas */
.tab-pane-fade-in {
    animation: fadeIn 0.25s ease-in-out;
}
.receta-modal {
    border-radius: 16px;
}
.receta-nuevo-insumo {
    padding: 16px;
    border: 1px solid #e8e1da;
    border-radius: 12px;
    background: #faf8f5;
}
.receta-tabla-wrap {
    border: 1px solid #ece7e2;
    border-radius: 10px;
}
.receta-tabla th {
    padding: 12px;
    background: #f5f2ee;
    color: #5e5852;
    font-size: .78rem;
    text-transform: uppercase;
}
.receta-tabla td {
    padding: 10px 12px;
}
.receta-fila-inactiva {
    opacity: .55;
}
.receta-input {
    min-width: 115px;
}
.receta-total {
    display: flex;
    justify-content: flex-end;
    align-items: baseline;
    gap: 12px;
    color: #666;
}
.receta-total strong {
    color: #2c1a11;
    font-size: 1.4rem;
}
body.dark-theme .receta-nuevo-insumo,
body.dark-theme .receta-tabla th {
    border-color: #494949;
    background: #353535;
    color: #eee;
}
body.dark-theme .receta-tabla-wrap {
    border-color: #494949;
}
body.dark-theme .receta-total strong {
    color: #fff;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
