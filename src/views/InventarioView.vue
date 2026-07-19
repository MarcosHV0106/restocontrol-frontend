<template>
  <div class="layout">
    <SidebarComponent />

    <div class="main-content">
      <NavbarComponent />

      <div class="container-fluid p-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 class="fw-bold mb-1">Inventario</h2>
            <p class="text-muted mb-0">Gestión de insumos y lotes del restaurante</p>
          </div>

          <button class="btn btn-primary-custom" @click="nuevoInsumo">

            <i class="bi bi-plus-circle me-2"></i>

            Nuevo Insumo

          </button>
        </div>

        <div class="card shadow-sm">
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-md-4">
                <input
                  v-model="busqueda"
                  type="search"
                  class="form-control"
                  placeholder="Buscar insumo..."
                >
              </div>
            </div>

            <div class="table-responsive">
              <table class="table table-hover align-middle">
                <thead class="table-light">
                  <tr>
                    <th>Nombre</th>
                    <th>Unidad</th>
                    <th>Stock</th>
                    <th>Stock mínimo</th>
                    <th>Costo</th>
                    <th>Estado</th>
                    <th class="text-center">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="item in insumosFiltrados" :key="item.idInsumo">
                    <td>{{ item.nombreInsumo }}</td>
                    <td>{{ item.unidadMedida }}</td>
                    <td>{{ formatearCantidad(item.stockActual) }}</td>
                    <td>{{ formatearCantidad(item.stockMinimo) }}</td>
                    <td>S/ {{ Number(item.costoUnitario || 0).toFixed(2) }}</td>
                    <td>
                      <span class="badge" :class="obtenerClaseEstado(insumo)">
                        {{ obtenerEstado(insumo) }}
                      </span>
                    </td>
                    <td class="text-center text-nowrap">
                      <button
                        class="btn btn-sm btn-outline-success me-2"
                        title="Gestionar lotes"
                        @click="abrirLotes(item)"
                      >
                        <i class="bi bi-box-seam"></i>
                      </button>

                      <button
                        class="btn btn-sm btn-outline-primary me-2"
                        title="Editar insumo"
                        @click="editarInsumo(item)"
                      >
                        <i class="bi bi-pencil"></i>
                      </button>

                      <button
                        class="btn btn-sm btn-outline-danger"
                        title="Eliminar insumo"
                        @click="prepararEliminar(item)"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>

                  <tr v-if="insumosFiltrados.length === 0">
                    <td colspan="7" class="text-center text-muted py-4">
                      No se encontraron insumos.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div id="insumoModal" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ insumo.idInsumo ? 'Editar insumo' : 'Nuevo insumo' }}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">
          <div class="row g-3">
            <div class="col-md-6">

              <label class="form-label">
                Nombre
              </label>

              <input class="form-control" maxlength="100" v-model.trim="insumo.nombreInsumo" @input="filtrarNombre" />

            </div>

            <div class="col-md-6">
              <label class="form-label">Unidad</label>
              <select v-model="insumo.unidadMedida" class="form-select">
                <option disabled value="">Seleccione...</option>
                <option value="kg">Kilogramos (kg)</option>
                <option value="g">Gramos (g)</option>
                <option value="lt">Litros (lt)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="unidad">Unidad</option>
              </select>
            </div>

            <div class="col-12">

              <label class="form-label">
                Descripción
              </label>

              <textarea class="form-control" maxlength="250" v-model.trim="insumo.descripcion" />

            </div>
            <div class="col-md-4">

              <label class="form-label">

                Stock Actual

              </label>

              <input type="number" class="form-control" v-model.number="insumo.stockActual" min="0" step="1">

            <div v-if="insumo.idInsumo" class="col-md-4">
              <label class="form-label">Stock actual</label>
              <input :value="formatearCantidad(insumo.stockActual)" class="form-control" disabled>
              <div class="form-text">Se calcula automáticamente desde los lotes.</div>
            </div>

            <div class="col-md-4">

              <label class="form-label">

                Stock Mínimo

              </label>

              <input type="number" class="form-control" v-model.number="insumo.stockMinimo" min="0" step="1">

            </div>

            <div class="col-md-4">

              <label class="form-label">

                Costo Unitario

              </label>

              <input type="number" class="form-control" v-model.number="insumo.costoUnitario" min="0.01" step="0.01">

            </div>
            <div class="col-md-6">

              <label class="form-label">

                Fecha de vencimiento

              </label>

              <input type="date" class="form-control" v-model="insumo.fechaVencimiento" :min="fechaHoy">

            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="button" class="btn btn-success" :disabled="guardando" @click="guardarInsumo">
            {{ guardando ? 'Guardando...' : (insumo.idInsumo ? 'Actualizar' : 'Guardar') }}
          </button>
        </div>
      </div>
    </div>
  </div>

          <button type="button" class="btn btn-primary-custom" @click="guardarInsumo">

        <div class="modal-body">
          <div class="card border-success-subtle mb-4">
            <div class="card-body">
              <h6 class="fw-bold mb-3">Registrar ingreso de lote</h6>
              <div class="row g-3 align-items-end">
                <div class="col-md-3">
                  <label class="form-label">Cantidad</label>
                  <input v-model.number="nuevoLote.cantidad" type="number" min="0.0001" step="0.0001" class="form-control">
                </div>
                <div class="col-md-3">
                  <label class="form-label">Fecha de vencimiento</label>
                  <input v-model="nuevoLote.fechaVencimiento" type="date" class="form-control">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Referencia (opcional)</label>
                  <input v-model.trim="nuevoLote.referencia" class="form-control" maxlength="100" placeholder="Factura, compra u observación">
                </div>
                <div class="col-md-2 d-grid">
                  <button class="btn btn-success" :disabled="guardandoLote" @click="registrarLote">
                    {{ guardandoLote ? 'Registrando...' : 'Registrar lote' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="cargandoLotes" class="text-center py-4">
            <div class="spinner-border text-success" role="status"></div>
          </div>

          <div v-else class="table-responsive">
            <table class="table table-sm table-hover align-middle">
              <thead class="table-light">
                <tr>
                  <th>Código</th>
                  <th>Ingreso</th>
                  <th>Vencimiento</th>
                  <th>Cantidad inicial</th>
                  <th>Existencia</th>
                  <th>Estado</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="lote in lotes" :key="lote.idLote">
                  <td>{{ lote.codigo }}</td>
                  <td>{{ lote.fechaIngreso }}</td>
                  <td>{{ lote.fechaVencimiento || 'Lote heredado' }}</td>
                  <td>{{ formatearCantidad(lote.cantidadInicial) }}</td>
                  <td>{{ formatearCantidad(lote.cantidadActual) }}</td>
                  <td>
                    <span class="badge" :class="lote.estado === 'ACTIVO' ? 'text-bg-success' : 'text-bg-secondary'">
                      {{ lote.estado }}
                    </span>
                  </td>
                  <td class="text-center text-nowrap">
                    <button
                      class="btn btn-sm btn-outline-primary me-2"
                      :disabled="lote.estado !== 'ACTIVO'"
                      title="Editar lote"
                      @click="prepararEdicionLote(lote)"
                    >
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button
                      class="btn btn-sm btn-outline-danger"
                      :disabled="lote.estado !== 'ACTIVO' || Number(lote.cantidadActual) <= 0"
                      title="Retirar como merma"
                      @click="retirarExistencia(lote)"
                    >
                      <i class="bi bi-box-arrow-right"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="lotes.length === 0">
                  <td colspan="7" class="text-center text-muted py-4">Este insumo todavía no tiene lotes.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
        </div>
      </div>
    </div>
  </div>

  <div id="editarLoteModal" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Editar lote</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">Código</label>
            <input v-model.trim="edicionLote.codigo" class="form-control" maxlength="60">
          </div>
          <div>
            <label class="form-label">Fecha de vencimiento</label>
            <input v-model="edicionLote.fechaVencimiento" type="date" class="form-control">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="button" class="btn btn-primary" :disabled="guardandoLote" @click="guardarEdicionLote">
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  </div>

  <div id="confirmarEliminarModal" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Confirmar eliminación</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          ¿Está seguro de eliminar el insumo <strong>{{ insumoEliminar?.nombreInsumo }}</strong>?
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="button" class="btn btn-danger" @click="confirmarEliminacion">Eliminar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Modal } from 'bootstrap'
import NavbarComponent from '@/components/NavbarComponent.vue'
import SidebarComponent from '@/components/SidebarComponent.vue'
import {
  actualizarInsumo,
  crearInsumo,
  eliminarInsumo,
  obtenerInsumos
} from '@/services/insumoService'
import NavbarComponent from '@/components/NavbarComponent.vue';
import SidebarComponent from '@/components/SidebarComponent.vue';
import '@/assets/css/insumo.css'

import { Modal } from 'bootstrap'

const insumos = ref([])
const lotes = ref([])
const busqueda = ref('')
const insumoSeleccionado = ref(null)
const insumoEliminar = ref(null)
const DIAS_PROXIMO_VENCER = 3
const insumo = ref({
  idInsumo: null,
  nombreInsumo: '',
  descripcion: '',
  unidadMedida: '',
  stockActual: 0,
  stockMinimo: 0,
  costoUnitario: null,
  fechaVencimiento: null
})
const fechaHoy = new Date().toISOString().split('T')[0]

const insumo = ref(insumoVacio())
const nuevoLote = ref(loteVacio())
const edicionLote = ref({ idLote: null, codigo: '', fechaVencimiento: '' })

const insumosFiltrados = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  if (!texto) return insumos.value
  return insumos.value.filter(item => item.nombreInsumo.toLowerCase().includes(texto))
})

onMounted(cargarInsumos)

function insumoVacio() {
  return {
    idInsumo: null,
    nombreInsumo: '',
    descripcion: '',
    unidadMedida: '',
    stockActual: 0,
    stockMinimo: 0,
    costoUnitario: null
  }
}

function loteVacio() {
  return { cantidad: null, fechaVencimiento: '', referencia: '' }
}

function mensajeError(error) {
  return error?.response?.data?.mensaje || error?.response?.data?.message || 'No se pudo completar la operación.'
}

function formatearCantidad(valor) {
  return Number(valor || 0).toLocaleString('es-PE', { maximumFractionDigits: 4 })
}

async function cargarInsumos() {
  try {
    insumos.value = await obtenerInsumos()
  } catch (error) {
    alert(mensajeError(error))
  }
}

function nuevoInsumo() {
  insumo.value = insumoVacio()
  Modal.getOrCreateInstance(document.getElementById('insumoModal')).show()
}

function editarInsumo(item) {
  insumo.value = { ...item }
  Modal.getOrCreateInstance(document.getElementById('insumoModal')).show()
}

function validarInsumo() {
  if (!insumo.value.nombreInsumo.trim()) return 'Ingrese el nombre del insumo.'
  if (!insumo.value.descripcion?.trim()) return 'Ingrese la descripción.'
  if (!insumo.value.unidadMedida) return 'Seleccione la unidad de medida.'
  if (insumo.value.stockMinimo == null || Number(insumo.value.stockMinimo) < 0) return 'Ingrese un stock mínimo válido.'
  if (insumo.value.costoUnitario == null || Number(insumo.value.costoUnitario) <= 0) return 'Ingrese un costo válido.'
  return null
}

async function guardarInsumo() {
  const errorValidacion = validarInsumo()
  if (errorValidacion) return alert(errorValidacion)

  guardando.value = true
  try {
    if (insumo.value.idInsumo) {
      await actualizarInsumo(insumo.value.idInsumo, insumo.value)
    } else {
      await crearInsumo(insumo.value)
    }
    await cargarInsumos()
    Modal.getOrCreateInstance(document.getElementById('insumoModal')).hide()
  } catch (error) {
    alert(mensajeError(error))
  } finally {
    guardando.value = false
  }
}

async function abrirLotes(item) {
  insumoSeleccionado.value = item
  nuevoLote.value = loteVacio()
  Modal.getOrCreateInstance(document.getElementById('lotesModal')).show()
  await cargarLotes()
}

async function cargarLotes() {
  if (!insumoSeleccionado.value) return
  cargandoLotes.value = true
  try {
    lotes.value = await obtenerLotes(insumoSeleccionado.value.idInsumo)
  } catch (error) {
    alert(mensajeError(error))
  } finally {
    cargandoLotes.value = false
  }
}

async function refrescarInventarioYLotes() {
  const idSeleccionado = insumoSeleccionado.value?.idInsumo
  await Promise.all([cargarInsumos(), cargarLotes()])
  insumoSeleccionado.value = insumos.value.find(item => item.idInsumo === idSeleccionado) || null
}

async function registrarLote() {
  if (!nuevoLote.value.cantidad || Number(nuevoLote.value.cantidad) <= 0) return alert('Ingrese una cantidad mayor a cero.')
  if (!nuevoLote.value.fechaVencimiento) return alert('Seleccione la fecha de vencimiento.')

  guardandoLote.value = true
  try {
    await crearLote(insumoSeleccionado.value.idInsumo, nuevoLote.value)
    nuevoLote.value = loteVacio()
    await refrescarInventarioYLotes()
  } catch (error) {
    alert(mensajeError(error))
  } finally {
    guardandoLote.value = false
  }
}

function prepararEdicionLote(lote) {
  edicionLote.value = {
    idLote: lote.idLote,
    codigo: lote.codigo,
    fechaVencimiento: lote.fechaVencimiento || ''
  }
  Modal.getOrCreateInstance(document.getElementById('editarLoteModal')).show()
}

async function guardarEdicionLote() {
  if (!edicionLote.value.codigo.trim()) return alert('Ingrese el código del lote.')
  if (!edicionLote.value.fechaVencimiento) return alert('Seleccione la fecha de vencimiento.')

  guardandoLote.value = true
  try {
    await actualizarLote(edicionLote.value.idLote, edicionLote.value)
    Modal.getOrCreateInstance(document.getElementById('editarLoteModal')).hide()
    await refrescarInventarioYLotes()
  } catch (error) {
    alert(mensajeError(error))
  } finally {
    guardandoLote.value = false
  }
}

async function retirarExistencia(lote) {
  const confirmado = confirm(`Se retirarán ${formatearCantidad(lote.cantidadActual)} unidades del lote ${lote.codigo} como merma. ¿Continuar?`)
  if (!confirmado) return

  guardandoLote.value = true
  try {
    await retirarLote(lote.idLote, {
      motivo: 'Retiro manual del lote como merma',
      referencia: 'Inventario'
    })
    await refrescarInventarioYLotes()
  } catch (error) {
    alert(mensajeError(error))
  } finally {
    guardandoLote.value = false
  }
}

function prepararEliminar(item) {
  insumoEliminar.value = item
  Modal.getOrCreateInstance(document.getElementById('confirmarEliminarModal')).show()
}

function filtrarNombre() {
  insumo.value.nombreInsumo =
    insumo.value.nombreInsumo.replace(
      /[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s().,/ -]/g,
      ''
    )
}

function obtenerEstado(insumo) {

  const hoy = new Date()

  const fechaVencimiento = new Date(insumo.fechaVencimiento)

  hoy.setHours(0, 0, 0, 0)
fechaVencimiento.setHours(0, 0, 0, 0)

const diferenciaDias =
  (fechaVencimiento - hoy) / (1000 * 60 * 60 * 24)

  if (fechaVencimiento < hoy) {
    return "Vencido"
  }

  if (diferenciaDias <= DIAS_PROXIMO_VENCER) {
    return "Próximo a vencer"
}

  if (insumo.stockActual === 0) {
    return "Sin Stock"
  }

  if (insumo.stockActual <= insumo.stockMinimo) {
    return "Stock Bajo"
  }

  return "Ok"

}

function obtenerClaseEstado(insumo) {

    const hoy = new Date()

    const fechaVencimiento = new Date(insumo.fechaVencimiento)

    hoy.setHours(0,0,0,0)
    fechaVencimiento.setHours(0,0,0,0)

    const diferenciaDias =
        (fechaVencimiento - hoy) / (1000 * 60 * 60 * 24)

    if (fechaVencimiento < hoy) {
        return "bg-danger"
    }

    if (diferenciaDias <= DIAS_PROXIMO_VENCER) {
        return "bg-warning text-dark"
    }

    if (insumo.stockActual === 0) {
        return "bg-danger"
    }

    if (insumo.stockActual <= insumo.stockMinimo) {
        return "bg-warning text-dark"
    }

    return "bg-success"
}

</script>
