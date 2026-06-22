<template>
    <nav class="navbar-custom sticky-top top-0 d-flex justify-content-between align-items-center p-3 bg-white border-bottom shadow-sm">

        <div class="navbar-left">
            <div class="d-flex align-items-center bg-light px-3 py-2 rounded-pill text-muted" style="font-size: 0.85rem;">
                <i class="bi bi-calendar3 me-2"></i>
                <span>{{ fechaActual }}</span>
            </div>
        </div>

        <div class="navbar-center flex-grow-1 mx-4">
            <div class="input-group" style="max-width: 350px;">
                <span class="input-group-text bg-light border-0 rounded-start-pill text-muted">
                    <i class="bi bi-search"></i>
                </span>
                <input
                    type="text"
                    class="form-control bg-light border-0 rounded-end-pill"
                    placeholder="Buscar..."
                    style="box-shadow: none;" />
            </div>
        </div>

        <div class="navbar-right d-flex align-items-center gap-4">
            <i class="bi bi-bell position-relative fs-5 text-muted cursor-pointer">
                <span class="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"></span>
            </i>

            <div class="dropdown position-relative">

                <button
                    type="button"
                    class="btn p-0 border-0 bg-transparent d-flex align-items-center gap-2"
                    @click.stop="menuAbierto = !menuAbierto">

                    <div
                        class="rounded-circle text-white d-flex align-items-center justify-content-center"
                        style="width: 38px; height: 38px; background: linear-gradient(135deg, #df7a48 0%, #e67e22 100%);">
                        <i class="bi bi-person fs-5"></i>
                    </div>

                    <div class="text-end" style="line-height: 1.2;">
                        <div class="fw-bold fs-6">
                            {{ usuario?.nombre ? 'Hola, ' + usuario.nombre : 'Hola' }}
                        </div>
                        <div class="text-muted text-capitalize" style="font-size: 0.75rem;">
                            {{ usuario?.rol || 'Rol' }}
                        </div>
                    </div>

                    <i
                        class="bi bi-chevron-down ms-1 text-muted"
                        :class="{ 'rotate-180': menuAbierto }"
                        style="font-size: 0.8rem;">
                    </i>

                </button>

                <ul
                    v-show="menuAbierto"
                    class="dropdown-menu dropdown-menu-end shadow-sm show"
                    style="border: 1px solid #e8e0d7; border-radius: 12px; min-width: 250px;">

                    <li class="border-bottom">
                        <a class="dropdown-item small" href="#">
                            <i class="bi bi-person-gear me-2"></i> Mi Perfil
                        </a>
                    </li>

                    <li class="border-bottom">
                        <a class="dropdown-item small" href="#">
                            <i class="bi bi-gear me-2"></i> Configuración
                        </a>
                    </li>

                    <li>
                        <button
                            class="dropdown-item small text-danger w-100 text-start"
                            @click="cerrarSesion">
                            <i class="bi bi-box-arrow-right me-2"></i>
                            Cerrar Sesión
                        </button>
                    </li>

                </ul>

            </div>
        </div>

    </nav>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import '@/assets/css/navbar.css'

const router = useRouter()
const authStore = useAuthStore()

const menuAbierto = ref(false)

const usuario = JSON.parse(localStorage.getItem('usuario')) || {}

const fechaActual = computed(() => {
    return new Date().toLocaleDateString('es-PE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
})

const cerrarMenu = () => {
    menuAbierto.value = false
}

onMounted(() => {
    document.addEventListener('click', cerrarMenu)
})

onBeforeUnmount(() => {
    document.removeEventListener('click', cerrarMenu)
})

function cerrarSesion() {
    authStore.logout()
    router.push('/login')
}
</script>
