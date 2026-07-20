<template>
  <div class="layout">
    <SidebarComponent />

    <div class="main-content audit-main">
      <NavbarComponent />

      <main class="audit-page">
        <header class="audit-heading">
          <div class="audit-title-group">
            <span class="audit-title-icon"><i class="bi bi-shield-check"></i></span>
            <div>
              <h1>Auditoría de operaciones</h1>
              <p>{{ subtituloRol }}</p>
            </div>
          </div>
          <span class="audit-live-badge"><i class="bi bi-database-check"></i>Registro persistente</span>
        </header>

        <section class="audit-intro" aria-label="Alcance de la auditoría">
          <span><i class="bi bi-fingerprint"></i></span>
          <div>
            <strong>Trazabilidad centralizada</strong>
            <p>Cada alta, modificación, cambio de estado, pago o anulación queda asociado al usuario, módulo, resultado y solicitud que lo originó.</p>
          </div>
        </section>

        <form class="audit-filters" aria-label="Filtros de auditoría" @submit.prevent="aplicarFiltros">
          <label class="audit-control audit-search">
            <span>Buscar operación</span>
            <span class="audit-input-icon"><i class="bi bi-search"></i><input v-model.trim="filtros.texto" type="search" maxlength="100" placeholder="Usuario, ruta, recurso o detalle"></span>
          </label>
          <label class="audit-control"><span>Desde</span><input v-model="filtros.desde" :max="filtros.hasta" type="date" required></label>
          <label class="audit-control"><span>Hasta</span><input v-model="filtros.hasta" :min="filtros.desde" :max="hoy" type="date" required></label>
          <label class="audit-control">
            <span>Usuario</span>
            <select v-model="filtros.idUsuario">
              <option value="">Todos los usuarios</option>
              <option v-for="usuario in opciones.usuarios" :key="usuario.idUsuario" :value="usuario.idUsuario">{{ usuario.nombre }} · {{ etiqueta(usuario.rol) }}</option>
            </select>
          </label>
          <label class="audit-control">
            <span>Módulo</span>
            <select v-model="filtros.modulo"><option value="">Todos los módulos</option><option v-for="modulo in opciones.modulos" :key="modulo" :value="modulo">{{ etiqueta(modulo) }}</option></select>
          </label>
          <label class="audit-control">
            <span>Acción</span>
            <select v-model="filtros.accion"><option value="">Todas las acciones</option><option v-for="accion in opciones.acciones" :key="accion" :value="accion">{{ etiqueta(accion) }}</option></select>
          </label>
          <label class="audit-control">
            <span>Resultado</span>
            <select v-model="filtros.resultado"><option value="">Todos los resultados</option><option value="EXITO">Éxito</option><option value="FALLO">Fallo</option></select>
          </label>
          <div class="audit-filter-actions">
            <button type="submit" class="audit-primary-button" :disabled="cargando"><i class="bi bi-funnel"></i>{{ cargando ? 'Consultando...' : 'Aplicar filtros' }}</button>
            <button type="button" class="audit-secondary-button" :disabled="cargando" @click="limpiarFiltros"><i class="bi bi-arrow-counterclockwise"></i>Limpiar</button>
          </div>
        </form>

        <div v-if="mensajeError" class="alert alert-danger audit-alert" role="alert"><i class="bi bi-exclamation-triangle-fill"></i><span>{{ mensajeError }}</span><button type="button" class="btn btn-sm btn-outline-danger ms-auto" @click="consultar()">Reintentar</button></div>

        <section class="audit-kpis" aria-label="Resumen del periodo">
          <article><span class="audit-kpi-icon total"><i class="bi bi-list-check"></i></span><div><strong>{{ numero(resumen.totalElementos) }}</strong><small>Operaciones encontradas</small></div></article>
          <article><span class="audit-kpi-icon success"><i class="bi bi-check2-circle"></i></span><div><strong>{{ numero(resumen.exitosas) }}</strong><small>Operaciones exitosas</small></div></article>
          <article><span class="audit-kpi-icon failure"><i class="bi bi-x-octagon"></i></span><div><strong>{{ numero(resumen.fallidas) }}</strong><small>Operaciones con fallo</small></div></article>
        </section>

        <section class="audit-panel" aria-label="Historial de operaciones">
          <header class="audit-panel-heading">
            <div><h2>Historial del sistema</h2><p>Ordenado desde la operación más reciente.</p></div>
            <label class="audit-page-size">Filas<select v-model.number="tamanoPagina" @change="cambiarTamano"><option :value="15">15</option><option :value="25">25</option><option :value="50">50</option><option :value="100">100</option></select></label>
          </header>

          <div v-if="cargando && !operaciones.length" class="audit-loading" aria-live="polite"><span class="spinner-border"></span><strong>Consultando bitácora</strong><small>Recuperando operaciones del periodo seleccionado.</small></div>

          <div v-else class="audit-table-wrap">
            <table class="audit-table">
              <thead><tr><th>Fecha y hora</th><th>Usuario</th><th>Módulo / acción</th><th>Recurso</th><th>Resultado</th><th>Duración</th><th>Detalle</th></tr></thead>
              <tbody>
                <tr v-for="operacion in operaciones" :key="operacion.idAuditoria">
                  <td data-label="Fecha y hora"><time :datetime="operacion.fechaHora">{{ fechaHora(operacion.fechaHora) }}</time><small>#{{ operacion.idAuditoria }}</small></td>
                  <td data-label="Usuario"><strong>{{ operacion.nombreUsuario }}</strong><small>{{ operacion.correoUsuario }} · {{ etiqueta(operacion.rolUsuario) }}</small></td>
                  <td data-label="Módulo / acción"><span class="audit-module-badge">{{ etiqueta(operacion.modulo) }}</span><strong class="audit-action">{{ etiqueta(operacion.accion) }}</strong></td>
                  <td data-label="Recurso"><code>{{ operacion.recursoId ? `#${operacion.recursoId}` : 'General' }}</code><small>{{ operacion.metodoHttp }}</small></td>
                  <td data-label="Resultado"><span class="audit-result" :class="operacion.resultado === 'EXITO' ? 'is-success' : 'is-failure'"><i :class="operacion.resultado === 'EXITO' ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'"></i>{{ operacion.resultado === 'EXITO' ? 'Éxito' : 'Fallo' }}</span><small>HTTP {{ operacion.estadoHttp }}</small></td>
                  <td data-label="Duración"><strong>{{ operacion.duracionMs }} ms</strong><small :class="{ slow: operacion.duracionMs >= 5000 }">{{ operacion.duracionMs < 5000 ? 'Dentro del objetivo' : 'Revisar rendimiento' }}</small></td>
                  <td data-label="Detalle">
                    <details class="audit-details"><summary>Ver trazabilidad</summary><dl><div><dt>Ruta</dt><dd>{{ operacion.ruta }}</dd></div><div><dt>Solicitud</dt><dd>{{ operacion.requestId || 'Sin identificador' }}</dd></div><div><dt>Origen</dt><dd>{{ operacion.direccionIp || 'No disponible' }}</dd></div><div v-if="operacion.tipoError"><dt>Error</dt><dd>{{ operacion.tipoError }}</dd></div></dl></details>
                  </td>
                </tr>
                <tr v-if="!operaciones.length"><td colspan="7" class="audit-empty"><i class="bi bi-journal-check"></i><strong>No hay operaciones para estos filtros</strong><span>La bitácora comenzará a poblarse con las nuevas acciones realizadas después de aplicar la migración V14.</span></td></tr>
              </tbody>
            </table>
          </div>

          <footer class="audit-pagination">
            <span>Mostrando {{ rangoDesde }}–{{ rangoHasta }} de {{ numero(resumen.totalElementos) }}</span>
            <div><button type="button" :disabled="paginaActual === 0 || cargando" aria-label="Página anterior" @click="irPagina(paginaActual - 1)"><i class="bi bi-chevron-left"></i></button><span>Página {{ totalPaginas ? paginaActual + 1 : 0 }} de {{ totalPaginas }}</span><button type="button" :disabled="paginaActual + 1 >= totalPaginas || cargando" aria-label="Página siguiente" @click="irPagina(paginaActual + 1)"><i class="bi bi-chevron-right"></i></button></div>
          </footer>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import NavbarComponent from '@/components/NavbarComponent.vue'
import SidebarComponent from '@/components/SidebarComponent.vue'
import { obtenerAuditoria, obtenerOpcionesAuditoria } from '@/services/auditoriaService'
import { useAuthStore } from '@/stores/authStore'
import { normalizeRole } from '@/router/roleNavigation'
import '@/assets/css/auditoria.css'

const authStore = useAuthStore()
const hoy = fechaLocal(new Date())
const fechaInicial = new Date()
fechaInicial.setDate(fechaInicial.getDate() - 29)

const filtros = reactive({
  desde: fechaLocal(fechaInicial),
  hasta: hoy,
  idUsuario: '',
  modulo: '',
  accion: '',
  resultado: '',
  texto: '',
})
const opciones = reactive({ modulos: [], acciones: [], usuarios: [] })
const operaciones = ref([])
const paginaActual = ref(0)
const totalPaginas = ref(0)
const tamanoPagina = ref(25)
const resumen = reactive({ totalElementos: 0, exitosas: 0, fallidas: 0 })
const cargando = ref(false)
const mensajeError = ref('')

const subtituloRol = computed(() => normalizeRole(authStore.usuario?.rol) === 'GERENTE'
  ? 'Consulta qué operaciones realizó cada usuario y detecta fallos o demoras.'
  : 'Supervisa el historial general de acciones registradas en RestoControl.')
const rangoDesde = computed(() => resumen.totalElementos ? paginaActual.value * tamanoPagina.value + 1 : 0)
const rangoHasta = computed(() => Math.min((paginaActual.value + 1) * tamanoPagina.value, resumen.totalElementos))

onMounted(async () => {
  await Promise.all([cargarOpciones(), consultar()])
})

async function cargarOpciones() {
  try {
    const data = await obtenerOpcionesAuditoria()
    opciones.modulos = data.modulos || []
    opciones.acciones = data.acciones || []
    opciones.usuarios = data.usuarios || []
  } catch {
    opciones.modulos = []
    opciones.acciones = []
    opciones.usuarios = []
  }
}

async function consultar(pagina = paginaActual.value) {
  if (filtros.hasta < filtros.desde) {
    mensajeError.value = 'La fecha final no puede ser anterior a la fecha inicial.'
    return
  }

  cargando.value = true
  mensajeError.value = ''
  try {
    const data = await obtenerAuditoria({
      desde: filtros.desde,
      hasta: filtros.hasta,
      idUsuario: filtros.idUsuario || undefined,
      modulo: filtros.modulo || undefined,
      accion: filtros.accion || undefined,
      resultado: filtros.resultado || undefined,
      texto: filtros.texto || undefined,
      pagina,
      tamano: tamanoPagina.value,
    })
    operaciones.value = data.operaciones || []
    paginaActual.value = data.pagina || 0
    totalPaginas.value = data.totalPaginas || 0
    resumen.totalElementos = data.totalElementos || 0
    resumen.exitosas = data.exitosas || 0
    resumen.fallidas = data.fallidas || 0
  } catch (error) {
    mensajeError.value = error.response?.data?.mensaje || 'No se pudo consultar el historial de operaciones.'
  } finally {
    cargando.value = false
  }
}

function aplicarFiltros() {
  consultar(0)
}

function limpiarFiltros() {
  filtros.desde = fechaLocal(fechaInicial)
  filtros.hasta = hoy
  filtros.idUsuario = ''
  filtros.modulo = ''
  filtros.accion = ''
  filtros.resultado = ''
  filtros.texto = ''
  consultar(0)
}

function cambiarTamano() {
  consultar(0)
}

function irPagina(pagina) {
  if (pagina >= 0 && pagina < totalPaginas.value) consultar(pagina)
}

function fechaLocal(fecha) {
  const desplazamiento = fecha.getTimezoneOffset() * 60000
  return new Date(fecha.getTime() - desplazamiento).toISOString().slice(0, 10)
}

function fechaHora(valor) {
  if (!valor) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(valor))
}

function etiqueta(valor) {
  return String(valor || 'General').replaceAll('_', ' ').toLocaleLowerCase('es').replace(/(^|\s)\S/g, letra => letra.toLocaleUpperCase('es'))
}

function numero(valor) {
  return new Intl.NumberFormat('es-PE').format(Number(valor || 0))
}
</script>
