<template>
  <div class="layout">

    <Sidebar />

    <div class="main-content">

      <Navbar />

      <div class="dashboard-container">

        <h2 class="dashboard-title">
          <i class="bi bi-bar-chart-fill"></i>
          Dashboard Ejecutivo
        </h2>

        <iframe
            title="RestoControlReportes"
            class="powerbi-frame"
            src="https://app.powerbi.com/view?r=eyJrIjoiZjhjMjZkYTUtNTMzNS00ZTg5LWExNzUtOWYzNzlhNmE4ODk0IiwidCI6ImM0YTY2YzM0LTJiYjctNDUxZi04YmUxLWIyYzI2YTQzMDE1OCIsImMiOjR9"
            frameborder="0"
            allowfullscreen>
        </iframe>

      </div>

    </div>

  </div>
</template>

<script setup>

import Sidebar from '@/components/SidebarComponent.vue'
import Navbar from '@/components/NavbarComponent.vue'

import '@/assets/css/disponible.css'
import '@/assets/css/dashboard.css'

</script>
