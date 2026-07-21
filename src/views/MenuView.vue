<template>
  <div class="layout management-layout">
    <SidebarComponent />
    <div class="main-content">
      <NavbarComponent />

      <main class="management-page catalog-page">
        <header class="management-heading">
          <div class="management-title-group">
            <span class="management-title-icon"><i class="bi bi-tags"></i></span>
            <div>
              <h1>Menú y categorías</h1>
              <p>Administra los platos, su precio y el stock disponible para la venta.</p>
            </div>
          </div>
          <span class="management-count"><i class="bi bi-cloud-check"></i>Catálogo sincronizado</span>
        </header>

        <section class="management-summary" aria-label="Resumen del catálogo">
          <article><i class="bi bi-egg-fried"></i><div><span>Platos registrados</span><strong>{{ alimentos.length }}</strong></div></article>
          <article><i class="bi bi-collection"></i><div><span>Categorías</span><strong>{{ categorias.length }}</strong></div></article>
          <article><i class="bi bi-check-circle"></i><div><span>Disponibles</span><strong>{{ disponibles }}</strong></div></article>
          <article><i class="bi bi-x-circle"></i><div><span>Sin stock</span><strong>{{ sinStock }}</strong></div></article>
        </section>

        <div v-if="mensajeError" class="management-error alert-danger" role="alert">
          <i class="bi bi-exclamation-triangle-fill"></i><span>{{ mensajeError }}</span>
          <button type="button" class="btn btn-sm btn-outline-danger" @click="cargarDatos">Reintentar</button>
        </div>
        <div v-if="mensajeExito" class="alert alert-success py-2" role="status">{{ mensajeExito }}</div>

        <div class="tabs-container management-tabs">
          <button class="btn px-4 py-2 border-0" :class="{ active: tabActual === 'alimentos' }" @click="tabActual = 'alimentos'">Platos</button>
          <button class="btn px-4 py-2 border-0" :class="{ active: tabActual === 'categorias' }" @click="tabActual = 'categorias'">Categorías</button>
        </div>

        <section v-if="tabActual === 'alimentos'">
          <div class="management-toolbar">
            <div class="input-group management-search">
              <span class="input-group-text bg-transparent border-0"><i class="bi bi-search text-muted"></i></span>
              <input v-model.trim="busquedaAlimento" type="search" class="form-control border-0 bg-transparent" placeholder="Buscar plato...">
            </div>
            <button class="btn btn-brand management-primary px-3" @click="abrirAlimento()"><i class="bi bi-plus-lg me-1"></i>Registrar plato</button>
          </div>

          <div class="custom-table-card management-table-card">
            <table class="table table-hover align-middle mb-0">
              <thead><tr><th class="ps-4">Plato</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th class="pe-4 text-end">Acciones</th></tr></thead>
              <tbody>
                <tr v-for="alimento in alimentosFiltrados" :key="alimento.idAlimento" :class="{ 'fila-inactiva': !alimento.disponibleParaPedidos }">
                  <td data-label="Plato" class="ps-4 fw-bold">
                    <div class="d-flex align-items-center gap-3">
                      <span class="food-icon-box"><i class="bi bi-egg-fried"></i></span>
                      <div><span>{{ alimento.nombreAlimento }}</span><small v-if="alimento.descripcion" class="d-block text-muted fw-normal">{{ alimento.descripcion }}</small></div>
                    </div>
                  </td>
                  <td data-label="Categoría"><span class="badge rounded-pill badge-soft-blue">{{ alimento.categoria?.nombreCategoria || 'Sin categoría' }}</span></td>
                  <td data-label="Precio" class="fw-semibold">S/ {{ moneda(alimento.precio) }}</td>
                  <td data-label="Stock"><strong>{{ alimento.stock }}</strong> porciones</td>
                  <td data-label="Estado"><span class="badge rounded-pill" :class="claseEstado(alimento)" :title="alimento.motivoNoDisponible || ''">{{ textoEstado(alimento) }}</span></td>
                  <td data-label="Acciones" class="pe-4 text-end">
                    <button class="btn btn-sm text-muted me-1" title="Editar plato" @click="abrirAlimento(alimento)"><i class="bi bi-pencil-square"></i></button>
                    <button class="btn btn-sm text-muted" title="Eliminar plato" @click="eliminarAlimento(alimento)"><i class="bi bi-trash"></i></button>
                  </td>
                </tr>
                <tr v-if="cargando"><td colspan="6" class="management-empty"><span class="spinner-border spinner-border-sm"></span> Cargando catálogo...</td></tr>
                <tr v-else-if="!alimentosFiltrados.length"><td colspan="6" class="management-empty"><i class="bi bi-search"></i><strong>No hay platos para mostrar</strong><span>Registra uno nuevo o cambia la búsqueda.</span></td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section v-else>
          <div class="management-toolbar">
            <div class="input-group management-search">
              <span class="input-group-text bg-transparent border-0"><i class="bi bi-search text-muted"></i></span>
              <input v-model.trim="busquedaCategoria" type="search" class="form-control border-0 bg-transparent" placeholder="Buscar categoría...">
            </div>
            <button class="btn btn-brand management-primary px-3" @click="abrirCategoria()"><i class="bi bi-plus-lg me-1"></i>Registrar categoría</button>
          </div>

          <div class="custom-table-card management-table-card">
            <table class="table table-hover align-middle mb-0">
              <thead><tr><th class="ps-4">Categoría</th><th>Descripción</th><th>Platos</th><th class="pe-4 text-end">Acciones</th></tr></thead>
              <tbody>
                <tr v-for="categoria in categoriasFiltradas" :key="categoria.idCategoria">
                  <td data-label="Categoría" class="ps-4 fw-bold">{{ categoria.nombreCategoria }}</td>
                  <td data-label="Descripción" class="text-muted">{{ categoria.descripcion || 'Sin descripción' }}</td>
                  <td data-label="Platos"><span class="badge rounded-pill badge-soft-orange">{{ cantidadPlatos(categoria.idCategoria) }}</span></td>
                  <td data-label="Acciones" class="pe-4 text-end">
                    <button class="btn btn-sm text-muted me-1" title="Editar categoría" @click="abrirCategoria(categoria)"><i class="bi bi-pencil-square"></i></button>
                    <button class="btn btn-sm text-muted" title="Eliminar categoría" :disabled="cantidadPlatos(categoria.idCategoria) > 0" @click="eliminarCategoria(categoria)"><i class="bi bi-trash"></i></button>
                  </td>
                </tr>
                <tr v-if="cargando"><td colspan="4" class="management-empty"><span class="spinner-border spinner-border-sm"></span> Cargando categorías...</td></tr>
                <tr v-else-if="!categoriasFiltradas.length"><td colspan="4" class="management-empty"><i class="bi bi-search"></i><strong>No hay categorías para mostrar</strong></td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>

    <div v-if="modalAlimento" class="catalog-modal-backdrop" @click.self="cerrarModales">
      <form class="catalog-modal" @submit.prevent="guardarAlimento">
        <header><div><small>CATÁLOGO</small><h2>{{ alimentoForm.idAlimento ? 'Editar plato' : 'Nuevo plato' }}</h2></div><button type="button" @click="cerrarModales"><i class="bi bi-x-lg"></i></button></header>
        <div class="catalog-modal-body">
          <label>Nombre<input v-model.trim="alimentoForm.nombreAlimento" class="form-control" maxlength="100" required></label>
          <label>Descripción<textarea v-model.trim="alimentoForm.descripcion" class="form-control" maxlength="200" rows="2"></textarea></label>
          <div class="form-grid">
            <label>Precio (S/)<input v-model.number="alimentoForm.precio" class="form-control" type="number" min="0.01" step="0.01" required></label>
            <label>Stock (porciones)<input v-model.number="alimentoForm.stock" class="form-control" type="number" min="0" step="1" required></label>
          </div>
          <label>Categoría<select v-model.number="alimentoForm.idCategoria" class="form-select" required><option :value="null" disabled>Selecciona una categoría</option><option v-for="categoria in categorias" :key="categoria.idCategoria" :value="categoria.idCategoria">{{ categoria.nombreCategoria }}</option></select></label>
          <label class="form-check"><input v-model="alimentoForm.disponible" class="form-check-input" type="checkbox"><span class="form-check-label">Habilitado para la venta</span></label>
          <div v-if="errorFormulario" class="alert alert-danger py-2 mb-0">{{ errorFormulario }}</div>
        </div>
        <footer><button type="button" class="btn btn-light" @click="cerrarModales">Cancelar</button><button class="btn btn-brand" :disabled="guardando">{{ guardando ? 'Guardando...' : 'Guardar plato' }}</button></footer>
      </form>
    </div>

    <div v-if="modalCategoria" class="catalog-modal-backdrop" @click.self="cerrarModales">
      <form class="catalog-modal catalog-modal-small" @submit.prevent="guardarCategoria">
        <header><div><small>CATÁLOGO</small><h2>{{ categoriaForm.idCategoria ? 'Editar categoría' : 'Nueva categoría' }}</h2></div><button type="button" @click="cerrarModales"><i class="bi bi-x-lg"></i></button></header>
        <div class="catalog-modal-body">
          <label>Nombre<input v-model.trim="categoriaForm.nombreCategoria" class="form-control" maxlength="100" required></label>
          <label>Descripción<textarea v-model.trim="categoriaForm.descripcion" class="form-control" maxlength="200" rows="3"></textarea></label>
          <div v-if="errorFormulario" class="alert alert-danger py-2 mb-0">{{ errorFormulario }}</div>
        </div>
        <footer><button type="button" class="btn btn-light" @click="cerrarModales">Cancelar</button><button class="btn btn-brand" :disabled="guardando">{{ guardando ? 'Guardando...' : 'Guardar categoría' }}</button></footer>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import NavbarComponent from '@/components/NavbarComponent.vue'
import SidebarComponent from '@/components/SidebarComponent.vue'
import * as menuService from '@/services/menuService'
import '@/assets/css/menu.css'
import '@/assets/css/management.css'

const alimentos = ref([])
const categorias = ref([])
const tabActual = ref('alimentos')
const busquedaAlimento = ref('')
const busquedaCategoria = ref('')
const cargando = ref(false)
const guardando = ref(false)
const mensajeError = ref('')
const mensajeExito = ref('')
const errorFormulario = ref('')
const modalAlimento = ref(false)
const modalCategoria = ref(false)
const alimentoForm = ref(nuevoAlimento())
const categoriaForm = ref(nuevaCategoria())

const disponibles = computed(() => alimentos.value.filter((item) => item.disponibleParaPedidos).length)
const sinStock = computed(() => alimentos.value.filter((item) => Number(item.stock || 0) === 0).length)
const alimentosFiltrados = computed(() => {
  const termino = busquedaAlimento.value.toLocaleLowerCase('es')
  return alimentos.value.filter((item) => `${item.nombreAlimento} ${item.descripcion || ''} ${item.categoria?.nombreCategoria || ''}`.toLocaleLowerCase('es').includes(termino))
})
const categoriasFiltradas = computed(() => {
  const termino = busquedaCategoria.value.toLocaleLowerCase('es')
  return categorias.value.filter((item) => `${item.nombreCategoria} ${item.descripcion || ''}`.toLocaleLowerCase('es').includes(termino))
})

function nuevoAlimento() {
  return { idAlimento: null, nombreAlimento: '', descripcion: '', precio: null, stock: 0, idCategoria: null, disponible: true }
}
function nuevaCategoria() {
  return { idCategoria: null, nombreCategoria: '', descripcion: '' }
}
function mensajeApi(error, defecto) {
  return error.response?.data?.message || error.response?.data?.mensaje || defecto
}
function moneda(valor) {
  return Number(valor || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function cantidadPlatos(idCategoria) {
  return alimentos.value.filter((item) => item.categoria?.idCategoria === idCategoria).length
}
function textoEstado(alimento) {
  if (!alimento.disponible) return 'Deshabilitado'
  if (alimento.bloqueadoCocina) return 'Pausado por Cocina'
  return Number(alimento.stock || 0) > 0 ? 'Disponible' : 'Sin stock'
}
function claseEstado(alimento) {
  if (alimento.disponibleParaPedidos) return 'badge-soft-green'
  if (!alimento.disponible) return 'bg-secondary text-white'
  return 'badge-soft-orange'
}
function mostrarExito(mensaje) {
  mensajeExito.value = mensaje
  window.setTimeout(() => { mensajeExito.value = '' }, 3000)
}

async function cargarDatos() {
  cargando.value = true
  mensajeError.value = ''
  try {
    const [listaAlimentos, listaCategorias] = await Promise.all([menuService.obtenerAlimentos(), menuService.obtenerCategorias()])
    alimentos.value = listaAlimentos
    categorias.value = listaCategorias
  } catch (error) {
    mensajeError.value = mensajeApi(error, 'No fue posible cargar el catálogo.')
  } finally {
    cargando.value = false
  }
}
function abrirAlimento(alimento = null) {
  alimentoForm.value = alimento ? {
    idAlimento: alimento.idAlimento,
    nombreAlimento: alimento.nombreAlimento,
    descripcion: alimento.descripcion || '',
    precio: Number(alimento.precio),
    stock: Number(alimento.stock || 0),
    idCategoria: alimento.categoria?.idCategoria || null,
    disponible: Boolean(alimento.disponible),
  } : nuevoAlimento()
  errorFormulario.value = ''
  modalAlimento.value = true
}
function abrirCategoria(categoria = null) {
  categoriaForm.value = categoria ? { ...categoria } : nuevaCategoria()
  errorFormulario.value = ''
  modalCategoria.value = true
}
function cerrarModales() {
  modalAlimento.value = false
  modalCategoria.value = false
  errorFormulario.value = ''
}
async function guardarAlimento() {
  if (!Number.isInteger(Number(alimentoForm.value.stock)) || Number(alimentoForm.value.stock) < 0) {
    errorFormulario.value = 'El stock debe ser un número entero igual o mayor a cero.'
    return
  }
  guardando.value = true
  errorFormulario.value = ''
  try {
    const payload = { ...alimentoForm.value, stock: Number(alimentoForm.value.stock) }
    if (payload.idAlimento) await menuService.actualizarAlimento(payload.idAlimento, payload)
    else await menuService.crearAlimento(payload)
    cerrarModales()
    await cargarDatos()
    mostrarExito('Plato guardado correctamente.')
  } catch (error) {
    errorFormulario.value = mensajeApi(error, 'No fue posible guardar el plato.')
  } finally {
    guardando.value = false
  }
}
async function guardarCategoria() {
  guardando.value = true
  errorFormulario.value = ''
  try {
    const payload = { ...categoriaForm.value }
    if (payload.idCategoria) await menuService.actualizarCategoria(payload.idCategoria, payload)
    else await menuService.crearCategoria(payload)
    cerrarModales()
    await cargarDatos()
    mostrarExito('Categoría guardada correctamente.')
  } catch (error) {
    errorFormulario.value = mensajeApi(error, 'No fue posible guardar la categoría.')
  } finally {
    guardando.value = false
  }
}
async function eliminarAlimento(alimento) {
  if (!window.confirm(`¿Eliminar el plato "${alimento.nombreAlimento}"?`)) return
  try {
    await menuService.eliminarAlimento(alimento.idAlimento)
    await cargarDatos()
    mostrarExito('Plato eliminado correctamente.')
  } catch (error) {
    mensajeError.value = mensajeApi(error, 'No fue posible eliminar el plato.')
  }
}
async function eliminarCategoria(categoria) {
  if (!window.confirm(`¿Eliminar la categoría "${categoria.nombreCategoria}"?`)) return
  try {
    await menuService.eliminarCategoria(categoria.idCategoria)
    await cargarDatos()
    mostrarExito('Categoría eliminada correctamente.')
  } catch (error) {
    mensajeError.value = mensajeApi(error, 'No fue posible eliminar la categoría.')
  }
}

onMounted(cargarDatos)
</script>

<style scoped>
.food-icon-box { align-items: center; background: var(--rc-primary-soft); border-radius: 9px; color: var(--rc-primary-hover); display: inline-flex; flex: 0 0 auto; height: 36px; justify-content: center; width: 36px; }
.catalog-modal-backdrop { align-items: center; background: rgba(18, 15, 13, .55); display: flex; inset: 0; justify-content: center; padding: 1rem; position: fixed; z-index: 1100; }
.catalog-modal { background: var(--rc-surface); border: 1px solid var(--rc-border); border-radius: 16px; box-shadow: 0 20px 70px rgba(0, 0, 0, .25); max-width: 620px; overflow: hidden; width: 100%; }
.catalog-modal-small { max-width: 520px; }
.catalog-modal header { align-items: flex-start; border-bottom: 1px solid var(--rc-border); display: flex; justify-content: space-between; padding: 1rem 1.15rem; }
.catalog-modal header small { color: var(--rc-primary); font-size: .65rem; font-weight: 800; letter-spacing: .08em; }
.catalog-modal h2 { color: var(--rc-ink); font-size: 1.15rem; margin: .15rem 0 0; }
.catalog-modal header button { background: transparent; border: 0; color: var(--rc-muted); }
.catalog-modal-body { display: grid; gap: .85rem; padding: 1.1rem 1.15rem; }
.catalog-modal-body label:not(.form-check) { color: var(--rc-ink-soft); display: grid; font-size: .72rem; font-weight: 700; gap: .35rem; }
.form-grid { display: grid; gap: .8rem; grid-template-columns: 1fr 1fr; }
.catalog-modal footer { background: var(--rc-page); border-top: 1px solid var(--rc-border); display: flex; gap: .6rem; justify-content: flex-end; padding: .8rem 1.15rem; }
body.dark-theme .catalog-modal .form-control, body.dark-theme .catalog-modal .form-select { background: #272728; color: #f2efed; }
@media (max-width: 575.98px) { .form-grid { grid-template-columns: 1fr; } .catalog-modal { max-height: 94vh; overflow-y: auto; } }
</style>
