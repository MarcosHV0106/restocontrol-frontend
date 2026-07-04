<template>
    <div class="login-page">
        <div class="login-container">
            <div class="login-card activation-card">
                <div class="card-header">
                    <div class="logo-wrapper">
                        <i class="bi bi-shield-lock"></i>
                    </div>

                    <h1 class="titulo">RestoControl</h1>

                    <p class="subtitulo">
                        Crea tu contrasena para activar tu cuenta
                    </p>
                </div>

                <div
                    v-if="isValidating"
                    class="activation-state">

                    <span class="loading-spinner activation-spinner"></span>
                    <p>Validando enlace...</p>

                </div>

                <form
                    v-else-if="tokenValido && !cuentaActivada"
                    @submit.prevent="crearClave">

                    <p class="activation-description">
                        Hola {{ nombreCompleto }}, define una contrasena segura para terminar la activacion de tu cuenta.
                    </p>

                    <div class="form-group password-group">
                        <label
                            class="form-label"
                            for="passwordInput">

                            <i class="bi bi-lock"></i>
                            Contrasena

                        </label>

                        <input
                            id="passwordInput"
                            v-model="clave"
                            :type="showPassword ? 'text' : 'password'"
                            class="form-control password-input"
                            placeholder="Minimo 6 caracteres"
                            required>

                        <button
                            type="button"
                            class="toggle-password"
                            @click="showPassword = !showPassword">

                            <i
                                :class="[
                                    'bi',
                                    showPassword
                                        ? 'bi-eye-slash'
                                        : 'bi-eye'
                                ]">
                            </i>

                        </button>
                    </div>

                    <div class="form-group password-group">
                        <label
                            class="form-label"
                            for="confirmPasswordInput">

                            <i class="bi bi-check2-circle"></i>
                            Confirmar contrasena

                        </label>

                        <input
                            id="confirmPasswordInput"
                            v-model="confirmacionClave"
                            :type="showConfirmPassword ? 'text' : 'password'"
                            class="form-control password-input"
                            placeholder="Repite tu contrasena"
                            required>

                        <button
                            type="button"
                            class="toggle-password"
                            @click="showConfirmPassword = !showConfirmPassword">

                            <i
                                :class="[
                                    'bi',
                                    showConfirmPassword
                                        ? 'bi-eye-slash'
                                        : 'bi-eye'
                                ]">
                            </i>

                        </button>
                    </div>

                    <div
                        v-if="mensajeError"
                        class="alert alert-danger">

                        <i class="bi bi-exclamation-circle me-2"></i>
                        {{ mensajeError }}

                    </div>

                    <button
                        type="submit"
                        class="btn btn-login"
                        :disabled="isLoading">

                        <span
                            v-if="isLoading"
                            class="loading-spinner">
                        </span>

                        {{
                            isLoading
                                ? 'Activando cuenta...'
                                : 'Crear contrasena'
                        }}

                    </button>
                </form>

                <div
                    v-else
                    class="activation-result">

                    <div
                        class="activation-result-icon"
                        :class="{ success: cuentaActivada }">
                        <i
                            :class="[
                                'bi',
                                cuentaActivada
                                    ? 'bi-check-circle-fill'
                                    : 'bi-x-circle-fill'
                            ]">
                        </i>
                    </div>

                    <h2>
                        {{
                            cuentaActivada
                                ? 'Cuenta activada'
                                : 'Enlace no disponible'
                        }}
                    </h2>

                    <p>
                        {{
                            cuentaActivada
                                ? mensajeExito
                                : mensajeError
                        }}
                    </p>

                    <button
                        type="button"
                        class="btn btn-login"
                        @click="irLogin">
                        Ir al login
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import '@/assets/css/login.css'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import {
    crearClaveActivacion,
    validarActivacionCuenta
} from '@/services/authService'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const cuenta = ref(null)
const clave = ref('')
const confirmacionClave = ref('')
const mensajeError = ref('')
const mensajeExito = ref('')
const tokenValido = ref(false)
const cuentaActivada = ref(false)
const isValidating = ref(true)
const isLoading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const token = computed(() => String(route.params.token || ''))

const nombreCompleto = computed(() => {
    if (!cuenta.value) return 'tu cuenta'

    return `${cuenta.value.nombre || ''} ${cuenta.value.apellido || ''}`.trim()
})

async function validarToken() {
    isValidating.value = true
    mensajeError.value = ''

    if (!token.value) {
        tokenValido.value = false
        mensajeError.value = 'El enlace de activacion no es valido.'
        isValidating.value = false
        return
    }

    try {
        cuenta.value = await validarActivacionCuenta(token.value)
        tokenValido.value = true
    } catch (error) {
        tokenValido.value = false
        mensajeError.value =
            error.response?.data?.mensaje ||
            error.response?.data?.message ||
            'El enlace de activacion no es valido o ha expirado.'
    } finally {
        isValidating.value = false
    }
}

async function crearClave() {
    if (isLoading.value) return

    mensajeError.value = ''

    if (clave.value.trim().length < 6) {
        mensajeError.value = 'La contrasena debe tener al menos 6 caracteres.'
        return
    }

    if (clave.value !== confirmacionClave.value) {
        mensajeError.value = 'Las contrasenas no coinciden.'
        return
    }

    isLoading.value = true

    try {
        const response = await crearClaveActivacion(
            token.value,
            clave.value,
            confirmacionClave.value
        )

        cuentaActivada.value = true
        tokenValido.value = false
        mensajeExito.value =
            response.message ||
            'Tu cuenta fue activada correctamente. Ya puedes iniciar sesion.'
        irLogin()
    } catch (error) {
        mensajeError.value =
            error.response?.data?.mensaje ||
            error.response?.data?.message ||
            'No se pudo activar la cuenta.'
    } finally {
        isLoading.value = false
    }
}

function irLogin() {
    authStore.logout()
    router.replace('/login')
}

onMounted(() => {
    validarToken()
})
</script>
