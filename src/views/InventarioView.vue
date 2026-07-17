<template>
  <div class="layout">
    <SidebarComponent />

    <div class="main-content">
      <NavbarComponent />
      <div class="container-fluid p-4">

        <div class="d-flex justify-content-between align-items-center mb-4">

          <div>
            <h2 class="fw-bold mb-1">
              Inventario
            </h2>

            <p class="text-muted mb-0">
              Gestión de insumos del restaurante
            </p>
          </div>

          <button class="btn btn-success" @click="nuevoInsumo">

            <i class="bi bi-plus-circle me-2"></i>

            Nuevo Insumo

          </button>

        </div>

        <div class="card shadow-sm">

          <div class="card-body">

            <div class="row mb-3">

              <div class="col-md-4">

                <input v-model="busqueda" type="text" class="form-control" placeholder="Buscar insumo...">

              </div>

            </div>

            <div class="table-responsive">

              <table class="table table-hover align-middle">

                <thead class="table-light">

                  <tr>

                    <th>Nombre</th>
                    <th>Unidad</th>
                    <th>Stock</th>
                    <th>Costo</th>
                    <th>Vencimiento</th>
                    <th>Estado</th>
                    <th class="text-center">Acciones</th>

                  </tr>

                </thead>

                <tbody>

                  <tr v-for="insumo in insumosFiltrados" :key="insumo.idInsumo">

                    <td>{{ insumo.nombreInsumo }}</td>

                    <td>{{ insumo.unidadMedida }}</td>

                    <td>{{ insumo.stockActual }}</td>

                    <td>S/ {{ insumo.costoUnitario }}</td>

                    <td>{{ insumo.fechaVencimiento }}</td>

                    <td>

                      Activo

                    </td>

                    <td class="text-center">

                      <button class="btn btn-sm btn-outline-primary me-2" @click="editarInsumo(insumo)">

                        <i class="bi bi-pencil"></i>

                      </button>

                      <button class="btn btn-sm btn-outline-danger" @click="prepararEliminar(insumo)"
                        data-bs-toggle="modal" data-bs-target="#confirmarEliminarModal">

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
  <!-- Modal Registrar / Editar -->
  <div class="modal fade" id="insumoModal" tabindex="-1" aria-hidden="true">

    <div class="modal-dialog modal-lg">

      <div class="modal-content">

        <!-- Header -->
        <div class="modal-header">

          <h5 class="modal-title">

            {{ insumo.idInsumo ? 'Editar Insumo' : 'Nuevo Insumo' }}

          </h5>

          <button type="button" class="btn-close" data-bs-dismiss="modal">
          </button>

        </div>

        <!-- Body -->
        <div class="modal-body">

          <div class="row g-3">

            <div class="col-md-6">

              <label class="form-label">
                Nombre
              </label>

              <input class="form-control" maxlength="100" v-model.trim="insumo.nombreInsumo">

            </div>

            <div class="col-md-6">

              <label class="form-label">
                Unidad
              </label>

              <select class="form-select" v-model="insumo.unidadMedida">

                <option disabled value="">
                  Seleccione...
                </option>

                <option value="kg">
                  Kilogramos (Kg)
                </option>

                <option value="g">
                  Gramos (g)
                </option>

                <option value="lt">
                  Litros (Lt)
                </option>

                <option value="ml">
                  Mililitros (ml)
                </option>

                <option value="unidad">
                  Unidad
                </option>

              </select>

            </div>

            <div class="col-12">

              <label class="form-label">
                Descripción
              </label>

              <textarea class="form-control" maxlength="250" v-model.trim="insumo.descripcion">
</textarea>

            </div>
            <div class="col-md-4">

              <label class="form-label">

                Stock Actual

              </label>

              <input type="number" class="form-control" v-model="insumo.stockActual">

            </div>

            <div class="col-md-4">

              <label class="form-label">

                Stock Mínimo

              </label>

              <input type="number" class="form-control" v-model="insumo.stockMinimo">

            </div>

            <div class="col-md-4">

              <label class="form-label">

                Costo Unitario

              </label>

              <input type="number" step="0.01" class="form-control" v-model="insumo.costoUnitario">

            </div>
            <div class="col-md-6">

              <label class="form-label">

                Fecha de vencimiento

              </label>

              <input type="date" class="form-control" v-model="insumo.fechaVencimiento">

            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="modal-footer">

          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">

            Cancelar

          </button>

          <button type="button" class="btn btn-success" @click="guardarInsumo">

            {{ insumo.idInsumo ? 'Actualizar' : 'Guardar' }}

          </button>

        </div>

      </div>

    </div>

  </div>

  <!-- Modal Eliminar -->
  <div class="modal fade" id="confirmarEliminarModal" tabindex="-1" aria-hidden="true">

    <div class="modal-dialog modal-dialog-centered">

      <div class="modal-content">

        <div class="modal-header">

          <h5 class="modal-title">
            Confirmar eliminación
          </h5>

          <button type="button" class="btn-close" data-bs-dismiss="modal">
          </button>

        </div>

        <div class="modal-body">

          ¿Está seguro que desea eliminar este insumo?

        </div>

        <div class="modal-footer">

          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">

            Cancelar

          </button>

          <button type="button" class="btn btn-danger" @click="confirmarEliminacion">

            Eliminar

          </button>

        </div>

      </div>

    </div>

  </div>

</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import {
  obtenerInsumos,
  crearInsumo,
  actualizarInsumo,
  eliminarInsumo
} from '@/services/insumoService'
import NavbarComponent from '@/components/NavbarComponent.vue';
import SidebarComponent from '@/components/SidebarComponent.vue';

import { Modal } from 'bootstrap'

const insumos = ref([])
const busqueda = ref('')
const insumoSeleccionado = ref(null)
const insumoEliminar = ref(null)
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

async function cargarInsumos() {

  try {

    insumos.value = await obtenerInsumos()

  } catch (error) {

    console.error(error)

  }

}

const insumosFiltrados = computed(() => {

  if (!busqueda.value.trim()) {
    return insumos.value
  }

  return insumos.value.filter(insumo =>
    insumo.nombreInsumo
      .toLowerCase()
      .includes(busqueda.value.toLowerCase())
  )

})

onMounted(() => {

  cargarInsumos()

})

async function guardarInsumo() {

  if (!validarFormulario()) return

  try {

    if (insumo.value.idInsumo) {

      await actualizarInsumo(
        insumo.value.idInsumo,
        insumo.value
      )

    } else {

      await crearInsumo(insumo.value)

    }

    await cargarInsumos()



    const modalElement = document.getElementById('insumoModal')

    const modal = Modal.getOrCreateInstance(modalElement)

    modal.hide()

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.remove()
    })
    document.body.classList.remove('modal-open')
    document.body.style.removeProperty('padding-right')


  } catch (error) {

    console.error(error)

  }

}

async function confirmarEliminacion() {





  if (!insumoEliminar.value) return

  try {



    await eliminarInsumo(insumoEliminar.value.idInsumo)

    const modalElement = document.getElementById('confirmarEliminarModal')
    const modal = Modal.getOrCreateInstance(modalElement)

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }

    modal.hide()

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.remove()
    })

    document.body.classList.remove('modal-open')
    document.body.style.removeProperty('padding-right')

    await cargarInsumos()

    insumoEliminar.value = null



  } catch (error) {
    console.error(error)
  }

}

function editarInsumo(item) {

  insumo.value = {
    ...item
  }

  const modal = new Modal(
    document.getElementById('insumoModal')
  )

  modal.show()

}

function limpiarFormulario() {
  insumo.value = {
    idInsumo: null,
    nombreInsumo: '',
    descripcion: '',
    unidadMedida: '',
    stockActual: 0,
    stockMinimo: 0,
    costoUnitario: null,
    fechaVencimiento: null
  }
}

function nuevoInsumo() {
  limpiarFormulario()

  const modal = new Modal(
    document.getElementById('insumoModal')
  )

  modal.show()
}

function validarFormulario() {

  if (!insumo.value.nombreInsumo.trim()) {
    alert("Ingrese el nombre del insumo")
    return false
  }

  if (!insumo.value.descripcion.trim()) {
    alert("Ingrese la descripción")
    return false
  }

  if (!insumo.value.unidadMedida) {
    alert("Seleccione la unidad de medida")
    return false
  }

  if (insumo.value.stockActual < 0) {
    alert("El stock actual no puede ser negativo")
    return false
  }

  if (insumo.value.stockMinimo < 0) {
    alert("El stock mínimo no puede ser negativo")
    return false
  }

  if (insumo.value.costoUnitario <= 0 || insumo.value.costoUnitario == null) {
    alert("Ingrese un costo válido")
    return false
  }

  if (!insumo.value.fechaVencimiento) {
    alert("Seleccione la fecha de vencimiento")
    return false
  }

  return true

}

function prepararEliminar(insumo) {


  insumoEliminar.value = insumo
}

</script>