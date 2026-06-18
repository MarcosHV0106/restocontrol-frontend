<template>

    <div class="login-page">
        <div class="login-container">

            <div class="login-card">

                <div class="card-header">
                    <div class="logo-wrapper">
                        <i class="bi bi-shop"></i>
                    </div>

                    <h1 class="titulo">RestoControl</h1>

                    <p class="subtitulo">
                        Sistema de Gestión Gastronómica
                    </p>
                </div>

                <form @submit.prevent="iniciarSesion">

                    <div class="form-group email-input-wrapper">

                        <label
                            class="form-label"
                            for="correoInput">

                            <i class="bi bi-envelope"></i>
                            Correo Electrónico

                        </label>

                        <input
                            id="correoInput"
                            v-model="correo"
                            @input="handleEmailInput"
                            @focus="showEmailSuggestions = true"
                            @blur="ocultarSugerencias"
                            type="email"
                            class="form-control"
                            placeholder="tu@correo.com"
                            required>

                        <div
                            :class="[
                                'email-suggestions',
                                {
                                    show:
                                        showEmailSuggestions &&
                                        emailSuggestions.length > 0
                                }
                            ]">

                            <div
                                v-for="email in emailSuggestions"
                                :key="email"
                                @click="selectEmail(email)"
                                class="email-suggestion-item">

                                <i class="bi bi-clock-history"></i>

                                {{ email }}

                            </div>

                        </div>

                    </div>

                    <div class="form-group password-group">

                        <label
                            class="form-label"
                            for="passwordInput">

                            <i class="bi bi-lock"></i>
                            Contraseña

                        </label>

                        <input
                            id="passwordInput"
                            v-model="clave"
                            :type="showPassword ? 'text' : 'password'"
                            class="form-control password-input"
                            placeholder="••••••••"
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
                                ? 'Iniciando sesión...'
                                : 'Iniciar Sesión'
                        }}

                    </button>

                </form>

            </div>

        </div>
    </div>

</template>

<script setup>

import '@/assets/css/login.css'
import { login } from '@/services/authService'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const correo = ref('')
const clave = ref('')

const mensajeError = ref('')

const showPassword = ref(false)

const isLoading = ref(false)

const emailHistory = ref([])

const showEmailSuggestions = ref(false)

const emailSuggestions = ref([])

function loadEmailHistory() {

    try {

        const history =
            localStorage.getItem('loginEmailHistory')

        emailHistory.value =
            history
                ? JSON.parse(history)
                : []

    } catch {

        emailHistory.value = []

    }

}

function saveEmailToHistory(email) {

    if (!email || !email.includes('@')) {
        return
    }

    emailHistory.value =
        emailHistory.value.filter(
            e => e !== email
        )

    emailHistory.value.unshift(email)

    emailHistory.value =
        emailHistory.value.slice(0, 10)

    localStorage.setItem(
        'loginEmailHistory',
        JSON.stringify(emailHistory.value)
    )

}

function handleEmailInput() {

    if (!correo.value) {

        emailSuggestions.value = []

        return

    }

    const input =
        correo.value.toLowerCase()

    emailSuggestions.value =
        emailHistory.value.filter(
            email =>
                email
                    .toLowerCase()
                    .includes(input)
        )

}

function selectEmail(email) {

    correo.value = email

    showEmailSuggestions.value = false

    emailSuggestions.value = []

    document
        .getElementById('passwordInput')
        ?.focus()

}

function ocultarSugerencias() {

    setTimeout(() => {

        showEmailSuggestions.value = false

    }, 200)

}

async function iniciarSesion() {

    if (!correo.value || !clave.value) {
        mensajeError.value = 'Por favor completa todos los campos'
        return
    }

    if (!correo.value.includes('@')) {
        mensajeError.value = 'Por favor ingresa un correo válido'
        return
    }

    isLoading.value = true
    mensajeError.value = ''

    try {

        const data = await login(
            correo.value,
            clave.value
        )

        // 1. ¡NUEVO! Guardamos el token JWT en el almacenamiento local
        if (data.token) {
            localStorage.setItem('token', data.token)
        }

        // 2. Guardamos los datos del usuario como ya lo hacías
        localStorage.setItem(
            'usuario',
            JSON.stringify(data.usuario)
        )

        localStorage.setItem(
            'loginDateTime',
            new Date().toISOString()
        )

        saveEmailToHistory(
            correo.value
        )

        router.push('/dashboard')

    } catch (error) {

        console.error(error)

        // Mejora opcional: Mostrar el mensaje de error exacto que envía Spring Boot
        mensajeError.value = error.response?.data?.message || 'Credenciales inválidas. Intenta de nuevo.'

    } finally {

        isLoading.value = false

    }

}

onMounted(() => {

    loadEmailHistory()

    setTimeout(() => {

        document
            .getElementById('correoInput')
            ?.focus()

    }, 100)

})

</script>
