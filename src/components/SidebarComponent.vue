<template>
    <aside class="sidebar d-flex flex-column flex-shrink-0 bg-white border-end vh-100">

        <RouterLink to="/dashboard" class="brand-link d-flex align-items-center text-decoration-none p-3 border-bottom">
            <div class="logo-icon me-3 d-flex align-items-center justify-content-center text-white rounded-circle shadow-sm">
                <i class="bi bi-shop fs-4"></i>
            </div>
            <div>
                <span class="fs-5 fw-bold d-block text-dark lh-sm">RestoControl</span>
                <small class="text-muted" style="font-size:0.75rem;">Sistema de Gestión</small>
            </div>
        </RouterLink>

        <div class="sidebar-nav-container overflow-auto p-3 flex-grow-1">
            <ul class="nav nav-pills flex-column mb-auto gap-1">

                <li class="nav-item" v-if="usuarioActual?.rol?.toUpperCase() === 'ADMIN'">
                    <RouterLink to="/dashboard" class="nav-link custom-link d-flex align-items-center fw-medium" active-class="active">
                        <i class="bi bi-grid-1x2 me-3 fs-5"></i>
                        <span>Dashboard</span>
                    </RouterLink>
                </li>

                <li class="nav-item" v-if="usuarioActual?.rol?.toUpperCase() === 'ADMIN'">
                    <RouterLink to="/menu" class="nav-link custom-link d-flex align-items-center fw-medium" active-class="active">
                        <i class="bi bi-tags me-3 fs-5"></i>
                        <span>Menú y Categorías</span>
                    </RouterLink>
                </li>

                <li class="nav-item">
                    <RouterLink to="/mesas" class="nav-link custom-link d-flex align-items-center fw-medium" active-class="active">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-fork-knife me-3 fs-5" viewBox="0 0 16 16">
                            <path d="M13 .5c0-.276-.226-.506-.498-.465-1.703.257-2.94 2.012-3 8.462a.5.5 0 0 0 .498.5c.56.01 1 .13 1 1.003v5.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5zM4.25 0a.25.25 0 0 1 .25.25v5.122a.128.128 0 0 0 .256.006l.233-5.14A.25.25 0 0 1 5.24 0h.522a.25.25 0 0 1 .25.238l.233 5.14a.128.128 0 0 0 .256-.006V.25A.25.25 0 0 1 6.75 0h.29a.5.5 0 0 1 .498.458l.423 5.07a1.69 1.69 0 0 1-1.059 1.711l-.053.022a.92.92 0 0 0-.58.884L6.47 15a.971.971 0 1 1-1.942 0l.202-6.855a.92.92 0 0 0-.58-.884l-.053-.022a1.69 1.69 0 0 1-1.059-1.712L3.462.458A.5.5 0 0 1 3.96 0z"/>
                        </svg>
                        <span>Gestion de Mesas</span>
                    </RouterLink>
                </li>

                <li class="nav-item">
                    <RouterLink to="/pedidos" class="nav-link custom-link d-flex align-items-center fw-medium" active-class="active">
                        <i class="bi bi-receipt me-3 fs-5"></i>
                        <span>Pedidos</span>
                    </RouterLink>
                </li>

                <li class="nav-item" v-if="usuarioActual?.rol?.toUpperCase() === 'ADMIN'">
                    <RouterLink to="/usuarios" class="nav-link custom-link d-flex align-items-center fw-medium" active-class="active">
                        <i class="bi bi-people me-3 fs-5"></i>
                        <span>Usuarios y Roles</span>
                    </RouterLink>
                </li>

                <li class="nav-item" v-if="usuarioActual?.rol?.toUpperCase() === 'ADMIN'">
                    <RouterLink to="/configuracion" class="nav-link custom-link d-flex align-items-center fw-medium" active-class="active">
                        <i class="bi bi-gear me-3 fs-5"></i>
                        <span>Configuración</span>
                    </RouterLink>
                </li>

            </ul>
        </div>

        <div class="p-3 border-top">
            <div class="version-box p-3 rounded-3 text-center">
                <div class="text-muted" style="font-size:0.75rem;">Versión del Sistema</div>
                <div class="fw-bold text-dark" style="font-size:0.85rem;">v1.0.0</div>
            </div>
        </div>

    </aside>
</template>

<script setup>
import { useAuthStore } from '@/stores/authStore'
import { storeToRefs } from 'pinia'
import '@/assets/css/sidebar.css'

// 1. Instanciamos el store de autenticación
const authStore = useAuthStore()

// 2. Extraemos el usuario de forma reactiva para que el menú
// se actualice instantáneamente si cambia la sesión
const { usuario: usuarioActual } = storeToRefs(authStore)
</script>
