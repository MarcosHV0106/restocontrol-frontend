<template>
    <div class="layout management-layout">
        <SidebarComponent />

        <div class="main-content">
            <NavbarComponent />

            <main class="management-page catalog-page">
                <header class="management-heading">
                    <div class="management-title-group">
                        <span class="management-title-icon"><i class="bi bi-tags"></i></span>
                        <div><h1>Menú y categorías</h1><p>{{ descripcionTab }}</p></div>
                    </div>
                    <span class="management-count">
                        <i :class="esAlmacenero ? 'bi bi-box-seam' : 'bi bi-cloud-check'"></i>
                        {{ esAlmacenero ? 'Planificación de almacén' : 'Catálogo sincronizado' }}
                    </span>
                </header>

                <section v-if="!esAlmacenero" class="management-summary" aria-label="Resumen del catálogo">
                    <article><i class="bi bi-egg-fried"></i><div><span>Platos registrados</span><strong>{{ alimentos.length }}</strong></div></article>
                    <article><i class="bi bi-collection"></i><div><span>Categorías</span><strong>{{ categorias.length }}</strong></div></article>
                    <article><i class="bi bi-check-circle"></i><div><span>Disponibles</span><strong>{{ alimentosDisponibles }}</strong></div></article>
                    <article><i class="bi bi-card-checklist"></i><div><span>Con costo definido</span><strong>{{ recetasConfiguradas }}</strong></div></article>
                </section>

                <div v-if="errorDatos" class="management-error alert-danger" role="alert">
                    <i class="bi bi-exclamation-triangle-fill"></i><span>{{ errorDatos }}</span>
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="cargarDatos">Reintentar</button>
                </div>

                <div class="tabs-container management-tabs">
                    <button v-if="!esAlmacenero" class="btn px-4 py-2 border-0"
                            :class="{ active: tabActual === 'alimentos' }"
                            @click="tabActual = 'alimentos'">Alimentos/Platos</button>
                    <button v-if="!esAlmacenero" class="btn px-4 py-2 border-0"
                            :class="{ active: tabActual === 'categorias' }"
                            @click="tabActual = 'categorias'">Categorias</button>
                    <button class="btn px-4 py-2 border-0"
                            :class="{ active: tabActual === 'estimacion' }"
                            @click="tabActual = 'estimacion'">Estimacion Diaria</button>
                </div>

                <div v-if="tabActual === 'alimentos'">
                    <div class="management-toolbar">
                        <div class="input-group management-search">
                            <span class="input-group-text bg-transparent border-0">
                                <i class="bi bi-search text-muted"></i>
                            </span>
                            <input type="text"
                                   class="form-control border-0 bg-transparent"
                                   placeholder="Buscar alimento..."
                                   v-model="busquedaAlimento">
                        </div>
                        <button class="btn btn-brand management-primary px-3"
                                @click="abrirModalAlimentoNuevo">
                            <i class="bi bi-plus-lg me-1"></i> Registrar Alimento
                        </button>
                    </div>

                    <div class="custom-table-card management-table-card">
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
                                    <td data-label="Plato" class="ps-4 py-3 fw-bold">
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
                                    <td data-label="Categoría" class="py-3">
                                        <span class="badge rounded-pill badge-soft-blue px-3 py-2">
                                            {{ alimento.categoria ? alimento.categoria.nombreCategoria : 'Sin categoria' }}
                                        </span>
                                    </td>
                                    <td data-label="Precio" class="py-3 fw-medium">S/ {{ formatearPrecio(alimento.precio) }}</td>
                                    <td data-label="Costo receta" class="py-3 fw-medium">
                                        <span :class="Number(alimento.costoReceta) > 0 ? 'text-success' : 'text-warning'">
                                            {{ formatearPrecio(alimento.costoReceta) }}
                                        </span>
                                    </td>
                                    <td data-label="Estado" class="py-3 text-center">
                                        <span class="badge rounded-pill px-3 py-2"
                                              :class="alimento.disponible ? 'badge-soft-green' : 'bg-secondary text-white'">
                                            {{ alimento.disponible ? 'Disponible' : 'No disponible' }}
                                        </span>
                                    </td>
                                    <td data-label="Acciones" class="pe-4 py-3 text-end">
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
                                <tr v-if="cargandoDatos"><td colspan="6" class="management-empty"><span class="spinner-border spinner-border-sm"></span> Cargando catálogo…</td></tr>
                                <tr v-else-if="alimentosFiltrados.length === 0">
                                    <td colspan="6" class="management-empty"><i class="bi bi-search"></i><strong>No encontramos platos</strong><span>Prueba con otro término o registra uno nuevo.</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div v-if="tabActual === 'categorias'">
                    <div class="management-toolbar">
                        <div class="input-group management-search">
                            <span class="input-group-text bg-transparent border-0">
                                <i class="bi bi-search text-muted"></i>
                            </span>
                            <input type="text"
                                   class="form-control border-0 bg-transparent"
                                   placeholder="Buscar categoria..."
                                   v-model="busquedaCategoria">
                        </div>
                        <button class="btn btn-brand management-primary px-3"
                                @click="abrirModalCategoriaNueva">
                            <i class="bi bi-plus-lg me-1"></i> Registrar categoria
                        </button>
                    </div>

                    <div class="custom-table-card management-table-card">
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
                                    <td data-label="Categoría" class="ps-4 py-3 fw-bold">{{ categoria.nombreCategoria }}</td>
                                    <td data-label="Descripción" class="py-3 text-muted">{{ categoria.descripcion }}</td>
                                    <td data-label="Platos" class="py-3 text-center">
                                        <span class="badge rounded-pill badge-soft-orange px-3 py-2">
                                            {{ contarAlimentosPorCategoria(categoria.idCategoria) }}
                                        </span>
                                    </td>
                                    <td data-label="Estado" class="py-3 text-center">
                                        <span class="badge rounded-pill px-3 py-2"
                                              :class="categoria.eliminado ? 'bg-secondary text-white' : 'badge-soft-green'">
                                            {{ categoria.eliminado ? 'Inactivo' : 'Activo' }}
                                        </span>
                                    </td>
                                    <td data-label="Acciones" class="pe-4 py-3 text-end">
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
                                <tr v-if="cargandoDatos"><td colspan="5" class="management-empty"><span class="spinner-border spinner-border-sm"></span> Cargando categorías…</td></tr>
                                <tr v-else-if="categoriasFiltradas.length === 0">
                                    <td colspan="5" class="management-empty"><i class="bi bi-search"></i><strong>No encontramos categorías</strong><span>Prueba con otro término o registra una nueva.</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div v-if="tabActual === 'estimacion'">
                    <section class="estimate-intro">
                        <div>
                            <span class="estimate-intro-icon"><i class="bi bi-graph-up-arrow"></i></span>
                            <div>
                                <strong>Estimación del día</strong>
                                <p>Planifica las porciones que esperas vender y valida los insumos antes de guardar.</p>
                            </div>
                        </div>
                        <label class="estimate-date">
                            <span><i class="bi bi-calendar3"></i> Fecha de planificación</span>
                            <input v-model="fechaEstimacion" type="date" :min="fechaMinima" :max="fechaMaxima" @change="cargarEstimacion">
                        </label>
                    </section>

                    <div v-if="errorEstimacion" class="management-error alert-danger" role="alert">
                        <i class="bi bi-exclamation-triangle-fill"></i><span>{{ errorEstimacion }}</span>
                    </div>
                    <div v-if="mensajeEstimacion" class="estimate-success" role="status">
                        <i class="bi bi-check-circle-fill"></i><span>{{ mensajeEstimacion }}</span>
                    </div>

                    <section class="estimate-card management-table-card">
                        <div v-if="cargandoEstimacion" class="estimate-loading">
                            <span class="spinner-border spinner-border-sm"></span>
                            <strong>Validando recetas e inventario...</strong>
                        </div>

                        <div v-else class="table-responsive">
                            <table class="table estimate-table mb-0">
                                <thead>
                                    <tr>
                                        <th>Alimento</th>
                                        <th>Categoría</th>
                                        <th class="text-center">Cantidad a preparar (porciones)</th>
                                        <th>Estado de insumos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="fila in filasEstimacion" :key="fila.idAlimento">
                                        <td data-label="Alimento">
                                            <div class="estimate-food">
                                                <span><i class="bi bi-egg-fried"></i></span>
                                                <strong>{{ fila.alimento }}</strong>
                                            </div>
                                        </td>
                                        <td data-label="Categoría">
                                            <span class="badge rounded-pill badge-soft-blue">{{ fila.categoria }}</span>
                                        </td>
                                        <td data-label="Porciones">
                                            <div class="estimate-stepper">
                                                <button type="button" :disabled="fila.porciones <= 0 || guardandoEstimacion" aria-label="Reducir porciones" @click="ajustarPorciones(fila, -1)">−</button>
                                                <input v-model.number="fila.porciones" type="number" min="0" max="10000" :disabled="guardandoEstimacion" @change="normalizarPorciones(fila)">
                                                <button type="button" :disabled="fila.porciones >= 10000 || guardandoEstimacion" aria-label="Aumentar porciones" @click="ajustarPorciones(fila, 1)">+</button>
                                            </div>
                                        </td>
                                        <td data-label="Estado">
                                            <span class="estimate-status" :class="claseEstadoEstimacion(fila)">
                                                <i :class="iconoEstadoEstimacion(fila)"></i>
                                                {{ etiquetaEstadoEstimacion(fila) }}
                                            </span>
                                            <small class="estimate-detail">{{ fila.detalle }}</small>
                                        </td>
                                    </tr>
                                    <tr v-if="filasEstimacion.length === 0">
                                        <td colspan="4" class="management-empty">
                                            <i class="bi bi-egg-fried"></i><strong>No hay platos disponibles</strong>
                                            <span>Activa platos y configura sus recetas para poder planificarlos.</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <div v-if="insumosFaltantes.length" class="estimate-shortages" role="alert">
                        <i class="bi bi-exclamation-octagon-fill"></i>
                        <div>
                            <strong>La planificación necesita reposición</strong>
                            <span v-for="insumo in insumosFaltantes" :key="insumo.idInsumo">
                                {{ insumo.insumo }}: faltan {{ formatearCantidad(insumo.faltante) }} {{ insumo.unidadMedida }}
                            </span>
                        </div>
                    </div>

                    <footer class="estimate-footer">
                        <div>
                            <span>Porciones planificadas</span>
                            <strong>{{ totalPorcionesEstimadas }}</strong>
                        </div>
                        <button type="button" class="btn btn-brand" :disabled="cargandoEstimacion || guardandoEstimacion || !filasEstimacion.length" @click="validarYGuardarEstimacion">
                            <span v-if="guardandoEstimacion" class="spinner-border spinner-border-sm"></span>
                            <i v-else class="bi bi-shield-check"></i>
                            {{ guardandoEstimacion ? 'Validando...' : 'Validar y guardar estimación' }}
                        </button>
                    </footer>
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
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
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
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
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
import '@/assets/css/management.css'
import { ref, computed, onMounted, watch } from 'vue'
import * as bootstrap from 'bootstrap'
import { useRoute } from 'vue-router'

import SidebarComponent from '@/components/SidebarComponent.vue'
import NavbarComponent from '@/components/NavbarComponent.vue'

import * as menuService from '@/services/menuService'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const authStore = useAuthStore()
const esAlmacenero = computed(() => String(authStore.usuario?.rol || '').toUpperCase() === 'ALMACENERO')

const fechaLocal = fecha => {
    const anio = fecha.getFullYear()
    const mes = String(fecha.getMonth() + 1).padStart(2, '0')
    const dia = String(fecha.getDate()).padStart(2, '0')
    return `${anio}-${mes}-${dia}`
}

const hoy = new Date()
const limiteEstimacion = new Date(hoy)
limiteEstimacion.setDate(limiteEstimacion.getDate() + 365)

// ================= ESTADOS REACTIVOS =================
const tabActual = ref(esAlmacenero.value || route.query.tab === 'estimacion' ? 'estimacion' : 'alimentos')
const alimentos = ref([])
const categorias = ref([])
const insumos = ref([])
const busquedaAlimento = ref('')
const busquedaCategoria = ref('')
const cargandoDatos = ref(true)
const errorDatos = ref('')
const fechaMinima = fechaLocal(hoy)
const fechaMaxima = fechaLocal(limiteEstimacion)
const fechaEstimacion = ref(fechaMinima)
const filasEstimacion = ref([])
const resumenInsumos = ref([])
const cargandoEstimacion = ref(false)
const guardandoEstimacion = ref(false)
const errorEstimacion = ref('')
const mensajeEstimacion = ref('')

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
const alimentosDisponibles = computed(() => alimentos.value.filter(alimento => alimento.disponible).length)
const recetasConfiguradas = computed(() => alimentos.value.filter(alimento => Number(alimento.costoReceta) > 0).length)
const totalPorcionesEstimadas = computed(() => filasEstimacion.value
    .reduce((total, fila) => total + Number(fila.porciones || 0), 0))
const insumosFaltantes = computed(() => resumenInsumos.value
    .filter(insumo => Number(insumo.faltante || 0) > 0))
const descripcionTab = computed(() => ({
    alimentos: 'Administra platos, precios, disponibilidad y costos de receta.',
    categorias: 'Organiza el catálogo para que el equipo encuentre cada plato rápidamente.',
    estimacion: 'Consulta la planificación diaria del menú y su demanda esperada.'
})[tabActual.value])
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

const formatearCantidad = valor => Number(valor || 0).toLocaleString('es-PE', {
    maximumFractionDigits: 4
})

const payloadEstimacion = () => filasEstimacion.value.map(fila => ({
    idAlimento: fila.idAlimento,
    porciones: Math.max(0, Math.min(10000, Math.trunc(Number(fila.porciones) || 0)))
}))

const aplicarEstimacion = respuesta => {
    filasEstimacion.value = (respuesta.platos || []).map(fila => ({ ...fila }))
    resumenInsumos.value = respuesta.insumos || []
}

const marcarPendienteValidacion = () => {
    mensajeEstimacion.value = ''
    resumenInsumos.value = []
    filasEstimacion.value.forEach(fila => {
        fila.estado = fila.porciones > 0 ? 'POR_VALIDAR' : 'SIN_PLANIFICAR'
        fila.detalle = fila.porciones > 0
            ? 'Valida la estimación para comprobar el inventario.'
            : 'Define las porciones a preparar.'
    })
}

const normalizarPorciones = fila => {
    fila.porciones = Math.max(0, Math.min(10000, Math.trunc(Number(fila.porciones) || 0)))
    marcarPendienteValidacion()
}

const ajustarPorciones = (fila, cambio) => {
    fila.porciones = Math.max(0, Math.min(10000, Number(fila.porciones || 0) + cambio))
    marcarPendienteValidacion()
}

const etiquetaEstadoEstimacion = fila => ({
    SUFICIENTE: 'Insumos suficientes',
    INSUFICIENTE: 'Insumos insuficientes',
    SIN_RECETA: 'Receta incompleta',
    SIN_PLANIFICAR: 'Sin planificar',
    POR_VALIDAR: 'Por validar'
})[fila.estado] || 'Por validar'

const claseEstadoEstimacion = fila => `estimate-status-${String(fila.estado || 'POR_VALIDAR').toLowerCase()}`
const iconoEstadoEstimacion = fila => ({
    SUFICIENTE: 'bi bi-check-circle-fill',
    INSUFICIENTE: 'bi bi-exclamation-triangle-fill',
    SIN_RECETA: 'bi bi-card-checklist',
    SIN_PLANIFICAR: 'bi bi-dash-circle',
    POR_VALIDAR: 'bi bi-arrow-repeat'
})[fila.estado] || 'bi bi-arrow-repeat'

const cerrarModalVisual = (idModal) => {
    const modalElement = document.getElementById(idModal)
    if (modalElement) {
        const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement)
        modalInstance.hide()
    }
}

// ================= MÉTODOS DE CONTROL =================
const cargarDatos = async () => {
    cargandoDatos.value = true
    errorDatos.value = ''
    try {
        const [listaAlimentos, listaCategorias] = await Promise.all([
            menuService.obtenerAlimentos(),
            menuService.obtenerCategorias()
        ])
        alimentos.value = listaAlimentos
        categorias.value = listaCategorias
    } catch (error) {
        console.error('Error al sincronizar datos del menú:', error)
        errorDatos.value = error.response?.data?.mensaje || 'No se pudo sincronizar el catálogo.'
    } finally {
        cargandoDatos.value = false
    }
}

const cargarEstimacion = async () => {
    if (!fechaEstimacion.value) return
    cargandoEstimacion.value = true
    errorEstimacion.value = ''
    mensajeEstimacion.value = ''
    try {
        aplicarEstimacion(await menuService.obtenerEstimacionDiaria(fechaEstimacion.value))
    } catch (error) {
        filasEstimacion.value = []
        resumenInsumos.value = []
        errorEstimacion.value = error.response?.data?.mensaje
            || error.response?.data?.message
            || 'No se pudo cargar la estimación diaria.'
    } finally {
        cargandoEstimacion.value = false
    }
}

const validarYGuardarEstimacion = async () => {
    guardandoEstimacion.value = true
    errorEstimacion.value = ''
    mensajeEstimacion.value = ''
    try {
        const datos = payloadEstimacion()
        const validacion = await menuService.validarEstimacionDiaria(fechaEstimacion.value, datos)
        aplicarEstimacion(validacion)
        if (!validacion.factible) {
            errorEstimacion.value = 'La estimación no se guardó. Corrige las recetas o repón los insumos indicados.'
            return
        }
        aplicarEstimacion(await menuService.guardarEstimacionDiaria(fechaEstimacion.value, datos))
        mensajeEstimacion.value = 'Estimación validada y guardada correctamente.'
    } catch (error) {
        errorEstimacion.value = error.response?.data?.mensaje
            || error.response?.data?.message
            || 'No se pudo validar y guardar la estimación.'
    } finally {
        guardandoEstimacion.value = false
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
watch(tabActual, nuevaTab => {
    if (nuevaTab === 'estimacion') cargarEstimacion()
})

watch(() => route.query.tab, tab => {
    if (tab === 'estimacion') tabActual.value = 'estimacion'
})

onMounted(async () => {
    if (!esAlmacenero.value) await cargarDatos()
    if (tabActual.value === 'estimacion') await cargarEstimacion()
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
.estimate-intro {
    align-items: center;
    background: linear-gradient(135deg, #fff8f3, #fdf0e9);
    border: 1px solid #f0d8cb;
    border-radius: 13px;
    display: flex;
    gap: 1rem;
    justify-content: space-between;
    margin-bottom: .85rem;
    padding: .8rem 1rem;
}
.estimate-intro > div { align-items: center; display: flex; gap: .7rem; }
.estimate-intro-icon { align-items: center; background: #fff; border-radius: 9px; color: var(--rc-primary); display: flex; height: 38px; justify-content: center; width: 38px; }
.estimate-intro strong { color: var(--rc-ink); display: block; font-size: .9rem; }
.estimate-intro p { color: var(--rc-muted); font-size: .72rem; margin: .12rem 0 0; }
.estimate-date { color: var(--rc-ink-soft); display: grid; font-size: .68rem; font-weight: 700; gap: .25rem; }
.estimate-date input { background: var(--rc-surface); border: 1px solid var(--rc-border); border-radius: 8px; color: var(--rc-ink); min-height: 38px; padding: .35rem .55rem; }
.estimate-card { background: var(--rc-surface); border: 1px solid var(--rc-border); border-radius: 13px; box-shadow: var(--rc-shadow-sm); overflow: hidden; }
.estimate-loading { align-items: center; color: var(--rc-muted); display: flex; gap: .55rem; justify-content: center; min-height: 230px; }
.estimate-table { table-layout: fixed; width: 100%; }
.estimate-table th { overflow-wrap: anywhere; white-space: normal; }
.estimate-table th:nth-child(1) { width: 23%; }
.estimate-table th:nth-child(2) { width: 17%; }
.estimate-table th:nth-child(3) { width: 27%; }
.estimate-table th:nth-child(4) { width: 33%; }
.estimate-table td { vertical-align: middle; }
.estimate-food { align-items: center; display: flex; gap: .65rem; }
.estimate-food > span { align-items: center; background: #f9ece6; border-radius: 8px; color: var(--rc-primary); display: flex; height: 32px; justify-content: center; width: 32px; }
.estimate-stepper { align-items: center; display: flex; justify-content: center; }
.estimate-stepper button { background: #fff8f4; border: 1px solid #eadbd3; color: var(--rc-primary); height: 32px; width: 32px; }
.estimate-stepper button:first-child { border-radius: 8px 0 0 8px; }
.estimate-stepper button:last-child { border-radius: 0 8px 8px 0; }
.estimate-stepper button:disabled { color: #b8aaa3; opacity: .65; }
.estimate-stepper input { appearance: textfield; border: 1px solid #eadbd3; border-left: 0; border-right: 0; color: var(--rc-ink); font-weight: 750; height: 32px; text-align: center; width: 66px; }
.estimate-stepper input::-webkit-inner-spin-button { appearance: none; }
.estimate-status { align-items: center; border-radius: 999px; display: inline-flex; font-size: .66rem; font-weight: 750; gap: .3rem; padding: .3rem .55rem; }
.estimate-status-suficiente { background: #e5f5ec; color: #267449; }
.estimate-status-insuficiente { background: #fff0df; color: #ad5d16; }
.estimate-status-sin_receta { background: #fde8e5; color: #aa4038; }
.estimate-status-sin_planificar, .estimate-status-por_validar { background: #eeeae7; color: #70645e; }
.estimate-detail { color: var(--rc-muted); display: block; font-size: .62rem; margin-top: .2rem; max-width: 310px; }
.estimate-shortages, .estimate-success { align-items: flex-start; border-radius: 10px; display: flex; gap: .6rem; margin-top: .75rem; padding: .7rem .85rem; }
.estimate-shortages { background: #fff3e4; border: 1px solid #f1d2a8; color: #8b541b; }
.estimate-shortages div { display: grid; font-size: .7rem; gap: .15rem; }
.estimate-success { background: #e9f6ee; border: 1px solid #bee1cb; color: #2d7149; font-size: .75rem; }
.estimate-footer { align-items: center; display: flex; justify-content: flex-end; gap: 1rem; padding-top: .85rem; }
.estimate-footer > div { display: grid; text-align: right; }
.estimate-footer span { color: var(--rc-muted); font-size: .65rem; }
.estimate-footer strong { color: var(--rc-ink); font-size: 1.15rem; }
.estimate-footer .btn { align-items: center; display: inline-flex; gap: .45rem; min-height: 42px; padding: .55rem 1rem; }
body.dark-theme .estimate-intro { background: #302a27; border-color: #554137; }
body.dark-theme .estimate-intro-icon, body.dark-theme .estimate-food > span { background: #3a312d; }
body.dark-theme .estimate-stepper button, body.dark-theme .estimate-stepper input { background: #333; border-color: #555; color: #f4d2c4; }
body.dark-theme .estimate-status-sin_planificar, body.dark-theme .estimate-status-por_validar { background: #3b3938; color: #d3cbc7; }
body.dark-theme .estimate-shortages { background: #3c3023; border-color: #655036; color: #f0c78e; }
body.dark-theme .estimate-success { background: #233a2c; border-color: #365c45; color: #a9dbbb; }
@media (max-width: 1100px) {
    .estimate-card { background: transparent; border: 0; box-shadow: none; overflow: visible; }
    .estimate-card .table-responsive { overflow: visible; }
    .estimate-table, .estimate-table tbody { display: block; min-width: 0; width: 100%; }
    .estimate-table thead { display: none; }
    .estimate-table tbody { display: grid; gap: .65rem; }
    .estimate-table tbody tr { background: var(--rc-surface); border: 1px solid var(--rc-border); border-radius: 12px; box-shadow: var(--rc-shadow-xs); display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); overflow: hidden; padding: .3rem .75rem; }
    .estimate-table tbody tr > td { align-items: center; border-bottom: 1px solid var(--rc-border); display: flex; gap: .65rem; justify-content: space-between; min-height: 52px; padding: .55rem 0; text-align: right; white-space: normal; }
    .estimate-table tbody tr > td:nth-child(odd) { border-right: 1px solid var(--rc-border); padding-right: .75rem; }
    .estimate-table tbody tr > td:nth-child(even) { padding-left: .75rem; }
    .estimate-table tbody tr > td::before { color: var(--rc-muted); content: attr(data-label); flex: 0 0 29%; font-size: .56rem; font-weight: 760; letter-spacing: .025em; text-align: left; text-transform: uppercase; }
    .estimate-table tbody tr > td[colspan] { display: block; grid-column: 1 / -1; }
    .estimate-table tbody tr > td[colspan]::before { display: none; }
    .estimate-table .estimate-detail { margin-left: auto; text-align: right; }
}
@media (max-width: 767.98px) {
    .estimate-intro { align-items: stretch; flex-direction: column; }
    .estimate-card { background: transparent; border: 0; box-shadow: none; overflow: visible; }
    .estimate-table { table-layout: fixed; }
    .estimate-table tbody tr { grid-template-columns: 1fr; }
    .estimate-table tbody tr > td:nth-child(n) { border-right: 0; padding-left: 0; padding-right: 0; }
    .estimate-table tbody tr > td:last-child { border-bottom: 0; }
    .estimate-footer { align-items: stretch; flex-direction: column; }
    .estimate-footer > div { text-align: left; }
    .estimate-footer .btn { justify-content: center; width: 100%; }
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
