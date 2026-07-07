<template>
    <div class="layout">

        <SidebarComponent />

        <div class="main-content">

            <NavbarComponent />

            <main class="p-4 p-md-5">

                <h2 class="fw-bold mb-1">Configuración</h2>

                <p class="text-muted mb-4">
                    Gestiona la seguridad de tu cuenta.
                </p>

                <div class="row justify-content-center">

                    <div class="col-xl-4 col-lg-5">

                        <div class="card shadow-sm border-0">

                            <div class="card-header bg-white">
                                <h5 class="mb-0">
                                    <i class="bi bi-shield-lock me-2"></i>
                                    Cambiar contraseña
                                </h5>
                            </div>

                            <div class="card-body">

                                <div class="mb-3">

                                    <label class="form-label">
                                        Contraseña actual
                                    </label>

                                    <div class="position-relative">

                                        <input v-model="formulario.claveActual"
                                            :type="showClaveActual ? 'text' : 'password'" class="form-control pe-5"
                                            placeholder="Su contraseña actual">

                                        <button type="button"
                                            class="btn border-0 position-absolute top-50 end-0 translate-middle-y"
                                            style="background: transparent;"
                                            @click="showClaveActual = !showClaveActual">

                                            <i :class="[
                                                'bi',
                                                showClaveActual
                                                    ? 'bi-eye-slash'
                                                    : 'bi-eye'
                                            ]">
                                            </i>

                                        </button>

                                    </div>

                                </div>

                                <div class="mb-3">

                                    <label class="form-label">
                                        Nueva contraseña
                                    </label>

                                    <div class="position-relative">

                                        <input v-model="formulario.claveNueva"
                                            :type="showClaveNueva ? 'text' : 'password'" class="form-control pe-5"
                                            placeholder="Ingrese su nueva contraseña">

                                        <button type="button"
                                            class="btn border-0 position-absolute top-50 end-0 translate-middle-y"
                                            style="background: transparent;" @click="showClaveNueva = !showClaveNueva">

                                            <i :class="[
                                                'bi',
                                                showClaveNueva
                                                    ? 'bi-eye-slash'
                                                    : 'bi-eye'
                                            ]">
                                            </i>

                                        </button>

                                    </div>

                                </div>

                                <div class="mb-3">

                                    <label class="form-label">
                                        Confirmar contraseña
                                    </label>

                                    <div class="position-relative">

                                        <input v-model="formulario.confirmarClave"
                                            :type="showConfirmarClave ? 'text' : 'password'" class="form-control pe-5"
                                            placeholder="Confirmar contraseña">

                                        <button type="button"
                                            class="btn border-0 position-absolute top-50 end-0 translate-middle-y"
                                            style="background: transparent;"
                                            @click="showConfirmarClave = !showConfirmarClave">

                                            <i :class="[
                                                'bi',
                                                showConfirmarClave
                                                    ? 'bi-eye-slash'
                                                    : 'bi-eye'
                                            ]">
                                            </i>

                                        </button>

                                    </div>

                                </div>

                                <div v-if="mensajeError" class="alert alert-danger">

                                    <i class="bi bi-exclamation-circle me-2"></i>

                                    {{ mensajeError }}

                                </div>

                                <div v-if="mensajeExito" class="alert alert-success">

                                    <i class="bi bi-check-circle me-2"></i>

                                    {{ mensajeExito }}

                                </div>
                                <div class="d-grid">

                                    <button type="button" class="btn btn-resto w-100" :disabled="isLoading"
                                        @click="actualizarContrasena">

                                        <span v-if="isLoading" class="spinner-border spinner-border-sm me-2">
                                        </span>

                                        {{
                                            isLoading
                                                ? 'Actualizando...'
                                                : 'Actualizar contraseña'
                                        }}

                                    </button>

                                </div>

                            </div>

                        </div>
                        <div class="card shadow-sm border-0 mt-4">

                            <div class="card-header bg-white">
                                <h5 class="mb-0">
                                    <i class="bi bi-palette me-2"></i>
                                    Apariencia
                                </h5>
                            </div>

                            <div class="card-body">

                                <label class="form-label fw-semibold">
                                    Tema de la aplicación
                                </label>

                                <div class="form-check">

                                    <input class="form-check-input" type="radio" id="temaClaro" value="light"
                                        v-model="tema" @change="cambiarTema">

                                    <label class="form-check-label" for="temaClaro">

                                        ☀️ Claro

                                    </label>

                                </div>

                                <div class="form-check mt-2">

                                    <input class="form-check-input" type="radio" id="temaOscuro" value="dark"
                                        v-model="tema" @change="cambiarTema">

                                    <label class="form-check-label" for="temaOscuro">

                                        🌙 Oscuro

                                    </label>

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

import { ref } from 'vue'

import SidebarComponent from '@/components/SidebarComponent.vue'
import NavbarComponent from '@/components/NavbarComponent.vue'
import { cambiarContrasena } from '@/services/usuarioService'
import { obtenerTema,aplicarTema } from '@/services/temaService'

const tema = ref(obtenerTema())

const cambiarTema = () => {
    aplicarTema(tema.value)
}

const formulario = ref({
    claveActual: '',
    claveNueva: '',
    confirmarClave: ''
})
const showClaveActual = ref(false)
const showClaveNueva = ref(false)
const showConfirmarClave = ref(false)
const isLoading = ref(false)
const mensajeError = ref('')
const mensajeExito = ref('')
const actualizarContrasena = async () => {

    mensajeError.value = ''
    mensajeExito.value = ''

    if (!formulario.value.claveActual.trim()) {
        mensajeError.value = 'Ingrese su contraseña actual.'
        return
    }

    if (formulario.value.claveNueva.length < 6) {
        mensajeError.value =
            'La contraseña debe tener al menos 6 caracteres.'
        return
    }

    if (formulario.value.claveNueva !== formulario.value.confirmarClave) {
        mensajeError.value =
            'Las contraseñas no coinciden.'
        return
    }

    isLoading.value = true

    try {

        await cambiarContrasena(formulario.value)

        mensajeExito.value = 'La contraseña se actualizó correctamente.'

        formulario.value = {
            claveActual: '',
            claveNueva: '',
            confirmarClave: ''
        }

    } catch (error) {

        mensajeError.value =
            error.response?.data?.mensaje ||
            error.response?.data?.message ||
            'No se pudo actualizar la contraseña.'

    } finally {

        isLoading.value = false

    }

}

</script>
<style scoped>
.btn-resto {
    background: #df7a48;
    border: none;
    color: white;
}

.btn-resto:hover {
    background: #c96739;
}

.card-header h5 {
    font-size: 1.25rem;
}
</style>