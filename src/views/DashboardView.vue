<template>

    <div class="layout">

        <Sidebar />

        <div class="main-content">

            <Navbar />

        <div class="main-container">
                    <div class="info-card">
                        <div class="coming-soon-badge">
                            <i class="bi bi-star-fill me-1"></i> Próximamente
                        </div>
<div class="icon-wrapper">
    <i class="bi bi-rocket-takeoff"></i>
</div>
                        <h1>Módulo en Desarrollo</h1>
                        <p>Estamos trabajando intensamente para perfeccionar esta funcionalidad y ofrecerte las mejores herramientas de gestión gastronómica.</p>

                        <div class="timeline-feature">
                            <i class="bi bi-hourglass-split"></i>
                            <span>Estará disponible en breve</span>
                        </div>

                        <div class="features-list">
                            <div class="feature-item">
                                <i class="bi bi-lightning-fill"></i>
                                <span>Rendimiento</span>
                            </div>
                            <div class="feature-item">
                                <i class="bi bi-shield-check"></i>
                                <span>Seguridad</span>
                            </div>
                            <div class="feature-item">
                                <i class="bi bi-sliders"></i>
                                <span>Personalizable</span>
                            </div>
                            <div class="feature-item">
                                <i class="bi bi-speedometer"></i>
                                <span>Optimizado</span>
                            </div>
                        </div>

                        <div class="badge-avance">
                            <i class="fa-solid fa-rocket"></i> Disponible desde el Avance #4
                        </div>
                    </div>
        </div>

        </div>

    </div>

</template>

<script setup>

import Sidebar from '@/components/SidebarComponent.vue'
import Navbar from '@/components/NavbarComponent.vue'

import '@/assets/css/disponible.css'

</script>
