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
                                    <td class="py-3 text-center">
                                        <span class="badge rounded-pill px-3 py-2"
                                              :class="alimento.disponible ? 'badge-soft-green' : 'bg-secondary text-white'">
                                            {{ alimento.disponible ? 'Disponible' : 'No disponible' }}
                                        </span>
                                    </td>
                                    <td class="pe-4 py-3 text-end">
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
const busquedaAlimento = ref('')
const busquedaCategoria = ref('')

// Estados de edición
const modoEdicionAlimento = ref(false)
const alimentoEditandoId = ref(null)
const modoEdicion = ref(false)
const categoriaEditandoId = ref(null)

const nuevoAlimento = ref({
    nombreAlimento: '', descripcion: '', precio: '', disponible: true, idCategoria: ''
})

const nuevaCategoria = ref({
    nombreCategoria: '', descripcion: ''
})

// ================= PROPIEDADES COMPUTADAS =================
const categoriasActivas = computed(() => categorias.value)

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
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
