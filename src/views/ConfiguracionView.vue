<template>
  <div class="layout">
    <SidebarComponent />

    <div class="main-content settings-main">
      <NavbarComponent />

      <main class="settings-page">
        <div class="settings-shell">
          <nav class="settings-breadcrumb" aria-label="Ruta de navegación">
            <span>Mi cuenta</span><i class="bi bi-chevron-right"></i><strong>Configuración</strong>
          </nav>

          <header class="settings-heading">
            <div class="settings-title-row">
              <span class="settings-title-icon"><i class="bi bi-sliders2"></i></span>
              <div>
                <h1>Configuración de cuenta</h1>
                <p>Administra la seguridad y apariencia de tu experiencia en RestoControl.</p>
              </div>
            </div>
            <span class="settings-private-badge"><i class="bi bi-lock-fill"></i>Área privada</span>
          </header>

          <section class="account-summary" aria-label="Cuenta actual">
            <span class="account-avatar">{{ iniciales }}</span>
            <div class="account-identity">
              <small>Sesión iniciada como</small>
              <strong>{{ nombreCompleto }}</strong>
              <span>{{ usuario?.correo || 'Correo no disponible' }}</span>
            </div>
            <span class="account-role"><i class="bi bi-person-badge"></i>{{ nombreRol }}</span>
          </section>

          <div class="settings-grid">
            <section class="settings-card security-card" aria-labelledby="security-title">
              <header class="settings-card-header">
                <span class="settings-card-icon security-icon"><i class="bi bi-shield-lock"></i></span>
                <div>
                  <div class="settings-card-title-line">
                    <h2 id="security-title">Seguridad</h2>
                    <span class="security-status"><i class="bi bi-check-circle-fill"></i>Protegida</span>
                  </div>
                  <p>Actualiza periódicamente tu contraseña para mantener protegida la cuenta.</p>
                </div>
              </header>

              <form class="password-form" novalidate @submit.prevent="actualizarContrasena">
                <div v-if="mensajeError" class="settings-alert alert-error" role="alert">
                  <i class="bi bi-exclamation-circle-fill"></i>
                  <span>{{ mensajeError }}</span>
                  <button type="button" aria-label="Cerrar mensaje" @click="mensajeError = ''"><i class="bi bi-x"></i></button>
                </div>

                <div v-if="mensajeExito" class="settings-alert alert-success" role="status">
                  <i class="bi bi-check-circle-fill"></i>
                  <span>{{ mensajeExito }}</span>
                  <button type="button" aria-label="Cerrar mensaje" @click="mensajeExito = ''"><i class="bi bi-x"></i></button>
                </div>

                <div class="settings-field">
                  <label for="claveActual">Contraseña actual</label>
                  <div class="password-input-wrap">
                    <i class="bi bi-key field-leading-icon"></i>
                    <input
                      id="claveActual"
                      v-model="formulario.claveActual"
                      :type="visibilidad.claveActual ? 'text' : 'password'"
                      autocomplete="current-password"
                      placeholder="Ingresa tu contraseña actual"
                      @input="limpiarMensajes"
                    />
                    <button
                      type="button"
                      class="password-toggle"
                      :aria-label="visibilidad.claveActual ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'"
                      :aria-pressed="visibilidad.claveActual"
                      @click="visibilidad.claveActual = !visibilidad.claveActual"
                    >
                      <i :class="visibilidad.claveActual ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                  </div>
                </div>

                <div class="settings-field">
                  <label for="claveNueva">Nueva contraseña</label>
                  <div class="password-input-wrap">
                    <i class="bi bi-shield-plus field-leading-icon"></i>
                    <input
                      id="claveNueva"
                      v-model="formulario.claveNueva"
                      :type="visibilidad.claveNueva ? 'text' : 'password'"
                      autocomplete="new-password"
                      placeholder="Crea una nueva contraseña"
                      :aria-describedby="formulario.claveNueva ? 'password-strength password-rules' : 'password-rules'"
                      @input="limpiarMensajes"
                    />
                    <button
                      type="button"
                      class="password-toggle"
                      :aria-label="visibilidad.claveNueva ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'"
                      :aria-pressed="visibilidad.claveNueva"
                      @click="visibilidad.claveNueva = !visibilidad.claveNueva"
                    >
                      <i :class="visibilidad.claveNueva ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                  </div>

                  <div v-if="formulario.claveNueva" id="password-strength" class="password-strength" aria-live="polite">
                    <div class="strength-track"><span :class="`strength-${fortaleza.nivel}`" :style="{ width: fortaleza.porcentaje }"></span></div>
                    <small>Seguridad: <strong>{{ fortaleza.etiqueta }}</strong></small>
                  </div>
                </div>

                <div class="settings-field">
                  <label for="confirmarClave">Confirmar nueva contraseña</label>
                  <div class="password-input-wrap" :class="{ 'field-invalid': confirmacionInvalida }">
                    <i class="bi bi-shield-check field-leading-icon"></i>
                    <input
                      id="confirmarClave"
                      v-model="formulario.confirmarClave"
                      :type="visibilidad.confirmarClave ? 'text' : 'password'"
                      autocomplete="new-password"
                      placeholder="Repite la nueva contraseña"
                      :aria-invalid="confirmacionInvalida"
                      @input="limpiarMensajes"
                    />
                    <button
                      type="button"
                      class="password-toggle"
                      :aria-label="visibilidad.confirmarClave ? 'Ocultar confirmación' : 'Mostrar confirmación'"
                      :aria-pressed="visibilidad.confirmarClave"
                      @click="visibilidad.confirmarClave = !visibilidad.confirmarClave"
                    >
                      <i :class="visibilidad.confirmarClave ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                  </div>
                  <small v-if="confirmacionInvalida" class="field-error"><i class="bi bi-exclamation-circle"></i>Las contraseñas no coinciden.</small>
                </div>

                <div id="password-rules" class="password-rules">
                  <strong>La contraseña debe:</strong>
                  <ul>
                    <li :class="{ valid: reglas.longitud }"><i :class="reglas.longitud ? 'bi bi-check-circle-fill' : 'bi bi-circle'"></i>Tener al menos 6 caracteres</li>
                    <li :class="{ valid: reglas.diferente }"><i :class="reglas.diferente ? 'bi bi-check-circle-fill' : 'bi bi-circle'"></i>Ser diferente de la contraseña actual</li>
                  </ul>
                </div>

                <footer class="security-actions">
                  <span><i class="bi bi-info-circle"></i>Al cambiarla, úsala en tu próximo inicio de sesión.</span>
                  <button type="submit" class="settings-primary-button" :disabled="!formularioValido || isLoading">
                    <span v-if="isLoading" class="spinner-border spinner-border-sm"></span>
                    <i v-else class="bi bi-shield-check"></i>
                    {{ isLoading ? 'Actualizando…' : 'Actualizar contraseña' }}
                  </button>
                </footer>
              </form>
            </section>

            <aside class="settings-side-column">
              <section class="settings-card appearance-card" aria-labelledby="appearance-title">
                <header class="settings-card-header compact-header">
                  <span class="settings-card-icon appearance-icon"><i class="bi bi-palette"></i></span>
                  <div>
                    <h2 id="appearance-title">Apariencia</h2>
                    <p>Elige cómo quieres visualizar la aplicación.</p>
                  </div>
                </header>

                <fieldset class="theme-options">
                  <legend class="visually-hidden">Tema de la aplicación</legend>
                  <label class="theme-option" :class="{ selected: tema === 'light' }">
                    <input v-model="tema" type="radio" value="light" @change="cambiarTema" />
                    <span class="theme-preview theme-preview-light">
                      <i></i><span><b></b><b></b><b></b></span>
                    </span>
                    <span class="theme-copy"><i class="bi bi-sun"></i><span><strong>Claro</strong><small>Interfaz luminosa y cálida</small></span></span>
                    <i class="bi theme-check" :class="tema === 'light' ? 'bi-check-circle-fill' : 'bi-circle'"></i>
                  </label>

                  <label class="theme-option" :class="{ selected: tema === 'dark' }">
                    <input v-model="tema" type="radio" value="dark" @change="cambiarTema" />
                    <span class="theme-preview theme-preview-dark">
                      <i></i><span><b></b><b></b><b></b></span>
                    </span>
                    <span class="theme-copy"><i class="bi bi-moon-stars"></i><span><strong>Oscuro</strong><small>Menor brillo en ambientes tenues</small></span></span>
                    <i class="bi theme-check" :class="tema === 'dark' ? 'bi-check-circle-fill' : 'bi-circle'"></i>
                  </label>
                </fieldset>

                <p class="theme-note"><i class="bi bi-lightning-charge-fill"></i>El cambio se aplica al instante y se guarda en este dispositivo.</p>
              </section>

              <section class="settings-card security-tips" aria-labelledby="tips-title">
                <div class="tips-heading">
                  <span><i class="bi bi-lightbulb"></i></span>
                  <div><h2 id="tips-title">Recomendaciones</h2><p>Buenas prácticas de seguridad</p></div>
                </div>
                <ul>
                  <li><i class="bi bi-check2"></i>No compartas tus credenciales.</li>
                  <li><i class="bi bi-check2"></i>Evita reutilizar contraseñas.</li>
                  <li><i class="bi bi-check2"></i>Cierra sesión en equipos compartidos.</li>
                </ul>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import NavbarComponent from '@/components/NavbarComponent.vue'
import SidebarComponent from '@/components/SidebarComponent.vue'
import { useAuthStore } from '@/stores/authStore'
import { cambiarContrasena } from '@/services/usuarioService'
import { aplicarTema, obtenerTema } from '@/services/temaService'
import '@/assets/css/configuracion.css'

const authStore = useAuthStore()
const { usuario } = storeToRefs(authStore)
const tema = ref(obtenerTema())
const isLoading = ref(false)
const mensajeError = ref('')
const mensajeExito = ref('')
const formulario = reactive({ claveActual: '', claveNueva: '', confirmarClave: '' })
const visibilidad = reactive({ claveActual: false, claveNueva: false, confirmarClave: false })

const nombreCompleto = computed(() => {
  const nombre = [usuario.value?.nombre, usuario.value?.apellido].filter(Boolean).join(' ').trim()
  return nombre || 'Usuario de RestoControl'
})
const iniciales = computed(() => {
  const partes = nombreCompleto.value.split(/\s+/).filter(Boolean)
  return partes.slice(0, 2).map((parte) => parte[0]).join('').toUpperCase()
})
const nombreRol = computed(() => {
  const rol = String(usuario.value?.rol || 'Usuario').toLowerCase()
  return rol.charAt(0).toUpperCase() + rol.slice(1)
})
const reglas = computed(() => ({
  longitud: formulario.claveNueva.length >= 6,
  diferente: Boolean(formulario.claveNueva) && formulario.claveNueva !== formulario.claveActual,
}))
const confirmacionInvalida = computed(() =>
  Boolean(formulario.confirmarClave) && formulario.claveNueva !== formulario.confirmarClave,
)
const formularioValido = computed(() =>
  Boolean(formulario.claveActual.trim()) &&
  reglas.value.longitud &&
  reglas.value.diferente &&
  formulario.claveNueva === formulario.confirmarClave,
)
const fortaleza = computed(() => {
  const clave = formulario.claveNueva
  let puntos = 0
  if (clave.length >= 6) puntos += 1
  if (clave.length >= 10) puntos += 1
  if (/[a-z]/.test(clave) && /[A-Z]/.test(clave)) puntos += 1
  if (/\d/.test(clave)) puntos += 1
  if (/[^\w\s]/.test(clave)) puntos += 1
  if (puntos <= 1) return { nivel: 'weak', etiqueta: 'Baja', porcentaje: '33%' }
  if (puntos <= 3) return { nivel: 'medium', etiqueta: 'Media', porcentaje: '66%' }
  return { nivel: 'strong', etiqueta: 'Alta', porcentaje: '100%' }
})

function cambiarTema() {
  aplicarTema(tema.value)
}

function limpiarMensajes() {
  mensajeError.value = ''
  mensajeExito.value = ''
}

async function actualizarContrasena() {
  limpiarMensajes()
  if (!formularioValido.value) {
    mensajeError.value = 'Revisa los requisitos antes de actualizar la contraseña.'
    return
  }

  isLoading.value = true
  try {
    await cambiarContrasena({ ...formulario })
    mensajeExito.value = 'Tu contraseña se actualizó correctamente.'
    formulario.claveActual = ''
    formulario.claveNueva = ''
    formulario.confirmarClave = ''
    visibilidad.claveActual = false
    visibilidad.claveNueva = false
    visibilidad.confirmarClave = false
  } catch (error) {
    mensajeError.value =
      error.response?.data?.mensaje || error.response?.data?.message || 'No se pudo actualizar la contraseña.'
  } finally {
    isLoading.value = false
  }
}
</script>
