<template>
    <div class="layout">
        <SidebarComponent />

        <div class="main-content reportes-main">
            <NavbarComponent />

            <main class="reportes-page">
                <header class="reportes-heading">
                    <div>
                        <h2>Reportes Operativos y Financieros</h2>
                        <p>Analiza las ventas y la rentabilidad real del restaurante.</p>
                    </div>
                </header>

                <section class="reportes-filtros" aria-label="Filtros del reporte">
                    <div class="reportes-control tipo-control">
                        <label for="tipoReporte">Tipo de reporte</label>
                        <select id="tipoReporte" v-model="filtros.tipo" class="form-select" @change="limpiarReporte">
                            <option value="rentabilidad">Rentabilidad</option>
                            <option value="ventas">Ventas</option>
                        </select>
                    </div>

                    <div class="reportes-control">
                        <label for="fechaDesde">Desde</label>
                        <input id="fechaDesde" v-model="filtros.desde" :max="filtros.hasta" type="date" class="form-control">
                    </div>

                    <div class="reportes-control">
                        <label for="fechaHasta">Hasta</label>
                        <input id="fechaHasta" v-model="filtros.hasta" :min="filtros.desde" :max="hoy" type="date" class="form-control">
                    </div>

                    <div class="reportes-actions">
                        <button class="btn btn-dark" :disabled="cargando" @click="generarReporte">
                            <span v-if="cargando" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                            <i v-else class="bi bi-play-fill"></i>
                            {{ cargando ? 'Generando...' : 'Generar' }}
                        </button>
                        <button class="btn btn-outline-secondary" :disabled="!reporte || cargando" @click="modalExportacion = true">
                            <i class="bi bi-download"></i>
                            Exportar reporte
                        </button>
                    </div>
                </section>

                <div v-if="mensajeError" class="alert alert-danger d-flex align-items-center gap-2" role="alert">
                    <i class="bi bi-exclamation-triangle-fill"></i>
                    <span>{{ mensajeError }}</span>
                </div>

                <template v-if="reporte && filtros.tipo === 'rentabilidad'">
                    <div v-if="!reporte.costosCompletos" class="alert alert-warning reportes-warning" role="alert">
                        <i class="bi bi-exclamation-circle me-2"></i>
                        Hay {{ reporte.platosSinCosto }} {{ reporte.platosSinCosto === 1 ? 'plato vendido con receta o costos incompletos' : 'platos vendidos con recetas o costos incompletos' }}.
                        El margen se actualizará automáticamente al completar esos datos en Menú y Categorías.
                    </div>

                    <section class="reportes-kpis" aria-label="Indicadores de rentabilidad">
                        <article class="reporte-kpi-card">
                            <div class="kpi-icon"><i class="bi bi-graph-up-arrow"></i></div>
                            <div>
                                <span>Ingresos totales (S/)</span>
                                <strong>{{ moneda(reporte.ingresosTotales) }}</strong>
                            </div>
                        </article>
                        <article class="reporte-kpi-card">
                            <div class="kpi-icon"><i class="bi bi-basket2"></i></div>
                            <div>
                                <span>Costo de insumos teórico (S/)</span>
                                <strong>{{ moneda(reporte.costoInsumosTeorico) }}</strong>
                            </div>
                        </article>
                        <article class="reporte-kpi-card">
                            <div class="kpi-icon"><i class="bi bi-pie-chart"></i></div>
                            <div>
                                <span>Margen neto (%)</span>
                                <strong>{{ porcentaje(reporte.margenNetoPorcentaje) }}</strong>
                                <small>S/ {{ moneda(reporte.margenNetoMonto) }}</small>
                            </div>
                        </article>
                    </section>

                    <section class="reporte-panel chart-panel">
                        <div class="panel-heading">
                            <div>
                                <h3>Ventas vs. costos por día (S/)</h3>
                                <p>Evolución de ingresos y costo teórico del periodo.</p>
                            </div>
                        </div>
                        <div class="chart-wrap chart-wide">
                            <Bar :data="datosGraficoRentabilidad" :options="opcionesGraficoMoneda" />
                        </div>
                    </section>

                    <section class="reporte-panel table-panel">
                        <div class="panel-heading">
                            <div>
                                <h3>Top 5 platos más rentables</h3>
                                <p>Ordenados por margen monetario total generado.</p>
                            </div>
                        </div>
                        <div class="table-responsive">
                            <table class="table reportes-table align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Plato</th>
                                        <th class="text-end">Vendidos</th>
                                        <th class="text-end">Precio venta (S/)</th>
                                        <th class="text-end">Costo receta (S/)</th>
                                        <th class="text-end">Margen (%)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(plato, indice) in reporte.platosMasRentables" :key="plato.idAlimento">
                                        <td>{{ indice + 1 }}</td>
                                        <td class="fw-semibold">{{ plato.plato }}</td>
                                        <td class="text-end">{{ plato.vendidos }}</td>
                                        <td class="text-end">{{ moneda(plato.precioVentaPromedio) }}</td>
                                        <td class="text-end">{{ moneda(plato.costoReceta) }}</td>
                                        <td class="text-end"><span class="margen-badge">{{ porcentaje(plato.margenPorcentaje) }}</span></td>
                                    </tr>
                                    <tr v-if="reporte.platosMasRentables.length === 0">
                                        <td colspan="6" class="reportes-empty">No hay ventas pagadas en el periodo seleccionado.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>
                </template>

                <template v-if="reporte && filtros.tipo === 'ventas'">
                    <section class="reportes-kpis" aria-label="Indicadores de ventas">
                        <article class="reporte-kpi-card">
                            <div class="kpi-icon"><i class="bi bi-cash-stack"></i></div>
                            <div>
                                <span>Ventas brutas totales (S/)</span>
                                <strong>{{ moneda(reporte.ventasBrutasTotales) }}</strong>
                            </div>
                        </article>
                        <article class="reporte-kpi-card">
                            <div class="kpi-icon"><i class="bi bi-receipt"></i></div>
                            <div>
                                <span>Total tickets emitidos</span>
                                <strong>{{ reporte.totalTickets }}</strong>
                            </div>
                        </article>
                        <article class="reporte-kpi-card">
                            <div class="kpi-icon"><i class="bi bi-tag"></i></div>
                            <div>
                                <span>Ticket promedio (S/)</span>
                                <strong>{{ moneda(reporte.ticketPromedio) }}</strong>
                            </div>
                        </article>
                    </section>

                    <section class="reportes-chart-grid">
                        <article class="reporte-panel">
                            <div class="panel-heading">
                                <div>
                                    <h3>Métodos de pago</h3>
                                    <p>Distribución por número de tickets.</p>
                                </div>
                            </div>
                            <div v-if="reporte.metodosPago.length" class="chart-wrap chart-donut">
                                <Doughnut :data="datosGraficoMetodos" :options="opcionesGraficoCircular" />
                            </div>
                            <div v-else class="reportes-empty chart-empty">No hay datos para mostrar.</div>
                        </article>

                        <article class="reporte-panel">
                            <div class="panel-heading">
                                <div>
                                    <h3>Horas punta de atención</h3>
                                    <p>Ventas pagadas agrupadas por hora.</p>
                                </div>
                            </div>
                            <div class="chart-wrap chart-hours">
                                <Line :data="datosGraficoHoras" :options="opcionesGraficoMoneda" />
                            </div>
                        </article>
                    </section>

                    <section class="reporte-panel table-panel">
                        <div class="panel-heading">
                            <div>
                                <h3>Últimas ventas registradas</h3>
                                <p>Los diez cobros más recientes del periodo.</p>
                            </div>
                        </div>
                        <div class="table-responsive">
                            <table class="table reportes-table align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Fecha / hora</th>
                                        <th>Ticket</th>
                                        <th>Mesa</th>
                                        <th>Cliente</th>
                                        <th>Método de pago</th>
                                        <th class="text-end">Total (S/)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="venta in reporte.ultimasVentas" :key="venta.idPedido">
                                        <td>{{ fechaHora(venta.fechaHora) }}</td>
                                        <td class="fw-semibold">{{ venta.ticket }}</td>
                                        <td>Mesa {{ venta.numeroMesa }}</td>
                                        <td>{{ venta.cliente }}</td>
                                        <td><span class="metodo-badge">{{ venta.metodoPago }}</span></td>
                                        <td class="text-end fw-semibold">S/ {{ moneda(venta.total) }}</td>
                                    </tr>
                                    <tr v-if="reporte.ultimasVentas.length === 0">
                                        <td colspan="6" class="reportes-empty">No hay ventas pagadas en el periodo seleccionado.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>
                </template>
            </main>
        </div>

        <div v-if="modalExportacion" class="export-backdrop" @click.self="modalExportacion = false">
            <section class="export-dialog" role="dialog" aria-modal="true" aria-labelledby="tituloExportar">
                <div class="export-header">
                    <div>
                        <h3 id="tituloExportar">Exportar reporte</h3>
                        <p>Selecciona el formato para descargar el reporte filtrado.</p>
                    </div>
                    <button class="btn-close" aria-label="Cerrar" @click="modalExportacion = false"></button>
                </div>

                <label class="export-option" :class="{ selected: formatoExportacion === 'pdf' }">
                    <input v-model="formatoExportacion" type="radio" value="pdf">
                    <i class="bi bi-file-earmark-pdf"></i>
                    <span><strong>Exportar como PDF</strong><small>Documento listo para imprimir o compartir</small></span>
                </label>
                <label class="export-option" :class="{ selected: formatoExportacion === 'excel' }">
                    <input v-model="formatoExportacion" type="radio" value="excel">
                    <i class="bi bi-file-earmark-excel"></i>
                    <span><strong>Exportar como Excel</strong><small>Datos editables para análisis adicional</small></span>
                </label>

                <div class="export-footer">
                    <button class="btn btn-outline-secondary" @click="modalExportacion = false">Cancelar</button>
                    <button class="btn btn-dark" :disabled="exportando" @click="exportarReporte">
                        <span v-if="exportando" class="spinner-border spinner-border-sm"></span>
                        {{ exportando ? 'Preparando...' : 'Descargar' }}
                    </button>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Bar, Doughnut, Line } from 'vue-chartjs'
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip
} from 'chart.js'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import writeXlsxFile from 'write-excel-file/browser'
import NavbarComponent from '@/components/NavbarComponent.vue'
import SidebarComponent from '@/components/SidebarComponent.vue'
import { obtenerReporteRentabilidad, obtenerReporteVentas } from '@/services/reporteService'
import '@/assets/css/disponible.css'
import '@/assets/css/reportes.css'

ChartJS.register(
    ArcElement,
    BarElement,
    CategoryScale,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip
)

const fechaIsoLocal = (fecha) => {
    const year = fecha.getFullYear()
    const month = String(fecha.getMonth() + 1).padStart(2, '0')
    const day = String(fecha.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const ahora = new Date()
const hoy = fechaIsoLocal(ahora)
const filtros = reactive({
    tipo: 'rentabilidad',
    desde: fechaIsoLocal(new Date(ahora.getFullYear(), ahora.getMonth(), 1)),
    hasta: hoy
})
const reporte = ref(null)
const cargando = ref(false)
const mensajeError = ref('')
const modalExportacion = ref(false)
const formatoExportacion = ref('pdf')
const exportando = ref(false)

const colores = ['#2d2d2d', '#df7a48', '#f0b36d', '#8b6f5a', '#9aa2a8', '#5d8a70']

const limpiarReporte = () => {
    reporte.value = null
    mensajeError.value = ''
}

const datosGraficoRentabilidad = computed(() => ({
    labels: reporte.value?.ventasVsCostosPorDia.map(item => fechaCorta(item.fecha)) || [],
    datasets: [
        {
            label: 'Ventas',
            data: reporte.value?.ventasVsCostosPorDia.map(item => Number(item.ventas)) || [],
            backgroundColor: '#2d2d2d',
            borderRadius: 4
        },
        {
            label: 'Costos',
            data: reporte.value?.ventasVsCostosPorDia.map(item => Number(item.costos)) || [],
            backgroundColor: '#c9c9c9',
            borderRadius: 4
        }
    ]
}))

const datosGraficoMetodos = computed(() => ({
    labels: reporte.value?.metodosPago.map(item => `${item.metodo} (${item.porcentaje}%)`) || [],
    datasets: [{
        data: reporte.value?.metodosPago.map(item => item.cantidad) || [],
        backgroundColor: colores,
        borderColor: '#ffffff',
        borderWidth: 3
    }]
}))

const datosGraficoHoras = computed(() => ({
    labels: reporte.value?.ventasPorHora.map(item => `${String(item.hora).padStart(2, '0')}:00`) || [],
    datasets: [{
        label: 'Ventas (S/)',
        data: reporte.value?.ventasPorHora.map(item => Number(item.ventas)) || [],
        borderColor: '#2d2d2d',
        backgroundColor: 'rgba(223, 122, 72, .16)',
        pointBackgroundColor: '#df7a48',
        pointRadius: 3,
        tension: 0.28,
        fill: true
    }]
}))

const opcionesGraficoMoneda = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
        legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 9 } },
        tooltip: {
            callbacks: { label: context => `${context.dataset.label}: S/ ${moneda(context.parsed.y)}` }
        }
    },
    scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } },
        y: { beginAtZero: true, ticks: { callback: value => `S/ ${Number(value).toLocaleString('es-PE')}` } }
    }
}

const opcionesGraficoCircular = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '52%',
    plugins: {
        legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 10, padding: 16 } }
    }
}

const generarReporte = async () => {
    mensajeError.value = ''
    reporte.value = null

    if (!filtros.desde || !filtros.hasta || filtros.desde > filtros.hasta) {
        mensajeError.value = 'Selecciona un periodo de fechas válido.'
        return
    }

    cargando.value = true
    try {
        reporte.value = filtros.tipo === 'rentabilidad'
            ? await obtenerReporteRentabilidad(filtros.desde, filtros.hasta)
            : await obtenerReporteVentas(filtros.desde, filtros.hasta)
    } catch (error) {
        mensajeError.value = error.response?.data?.message
            || error.response?.data?.mensaje
            || 'No fue posible generar el reporte. Inténtalo nuevamente.'
    } finally {
        cargando.value = false
    }
}

const moneda = valor => Number(valor || 0).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
})

const porcentaje = valor => `${Number(valor || 0).toFixed(1)}%`

const fechaCorta = fecha => new Date(`${fecha}T00:00:00`).toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit'
})

const fechaHora = fecha => new Date(fecha).toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
})

const tituloReporte = () => filtros.tipo === 'rentabilidad' ? 'Reporte de Rentabilidad' : 'Reporte de Ventas'
const nombreBase = () => `restocontrol-${filtros.tipo}-${filtros.desde}-${filtros.hasta}`

const exportarReporte = async () => {
    if (!reporte.value) return
    exportando.value = true
    try {
        if (formatoExportacion.value === 'pdf') {
            exportarPdf()
        } else {
            await exportarExcel()
        }
        modalExportacion.value = false
    } catch (error) {
        console.error('No se pudo exportar el reporte:', error)
        mensajeError.value = 'No se pudo preparar el archivo solicitado.'
    } finally {
        exportando.value = false
    }
}

const exportarPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    doc.setFontSize(18)
    doc.text('RestoControl', 14, 16)
    doc.setFontSize(14)
    doc.text(tituloReporte(), 14, 24)
    doc.setFontSize(9)
    doc.setTextColor(90)
    doc.text(`Periodo: ${filtros.desde} al ${filtros.hasta}`, 14, 30)

    if (filtros.tipo === 'rentabilidad') {
        autoTable(doc, {
            startY: 36,
            head: [['Ingresos totales', 'Costo teórico', 'Margen neto', 'Margen (%)']],
            body: [[
                `S/ ${moneda(reporte.value.ingresosTotales)}`,
                `S/ ${moneda(reporte.value.costoInsumosTeorico)}`,
                `S/ ${moneda(reporte.value.margenNetoMonto)}`,
                porcentaje(reporte.value.margenNetoPorcentaje)
            ]],
            theme: 'grid',
            headStyles: { fillColor: [45, 45, 45] }
        })
        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 8,
            head: [['#', 'Plato', 'Vendidos', 'Precio venta', 'Costo receta', 'Margen']],
            body: reporte.value.platosMasRentables.map((plato, indice) => [
                indice + 1, plato.plato, plato.vendidos, moneda(plato.precioVentaPromedio),
                moneda(plato.costoReceta), porcentaje(plato.margenPorcentaje)
            ]),
            theme: 'striped',
            headStyles: { fillColor: [223, 122, 72] }
        })
    } else {
        autoTable(doc, {
            startY: 36,
            head: [['Ventas brutas', 'Tickets', 'Ticket promedio']],
            body: [[
                `S/ ${moneda(reporte.value.ventasBrutasTotales)}`,
                reporte.value.totalTickets,
                `S/ ${moneda(reporte.value.ticketPromedio)}`
            ]],
            theme: 'grid',
            headStyles: { fillColor: [45, 45, 45] }
        })
        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 8,
            head: [['Fecha / hora', 'Ticket', 'Mesa', 'Cliente', 'Método de pago', 'Total']],
            body: reporte.value.ultimasVentas.map(venta => [
                fechaHora(venta.fechaHora), venta.ticket, `Mesa ${venta.numeroMesa}`, venta.cliente,
                venta.metodoPago, `S/ ${moneda(venta.total)}`
            ]),
            theme: 'striped',
            headStyles: { fillColor: [223, 122, 72] }
        })
    }
    doc.save(`${nombreBase()}.pdf`)
}

const celda = (value, extra = {}) => ({ value, ...extra })
const encabezadoExcel = texto => celda(texto, {
    fontWeight: 'bold', backgroundColor: '#2D2D2D', color: '#FFFFFF', align: 'center'
})

const exportarExcel = async () => {
    const filas = [
        [celda('RestoControl', { fontWeight: 'bold', fontSize: 18, span: 6 })],
        [celda(tituloReporte(), { fontWeight: 'bold', fontSize: 14, span: 6 })],
        [celda(`Periodo: ${filtros.desde} al ${filtros.hasta}`, { span: 6 })],
        []
    ]

    if (filtros.tipo === 'rentabilidad') {
        filas.push(
            ['Ingresos totales', 'Costo teórico', 'Margen neto', 'Margen (%)'].map(encabezadoExcel),
            [
                celda(Number(reporte.value.ingresosTotales), { format: 'S/ #,##0.00' }),
                celda(Number(reporte.value.costoInsumosTeorico), { format: 'S/ #,##0.00' }),
                celda(Number(reporte.value.margenNetoMonto), { format: 'S/ #,##0.00' }),
                celda(Number(reporte.value.margenNetoPorcentaje) / 100, { format: '0.0%' })
            ],
            [],
            ['#', 'Plato', 'Vendidos', 'Precio venta', 'Costo receta', 'Margen (%)'].map(encabezadoExcel),
            ...reporte.value.platosMasRentables.map((plato, indice) => [
                celda(indice + 1), celda(plato.plato), celda(plato.vendidos),
                celda(Number(plato.precioVentaPromedio), { format: 'S/ #,##0.00' }),
                celda(Number(plato.costoReceta), { format: 'S/ #,##0.00' }),
                celda(Number(plato.margenPorcentaje) / 100, { format: '0.0%' })
            ]),
            [],
            ['Fecha', 'Ventas', 'Costos'].map(encabezadoExcel),
            ...reporte.value.ventasVsCostosPorDia.map(item => [
                celda(item.fecha),
                celda(Number(item.ventas), { format: 'S/ #,##0.00' }),
                celda(Number(item.costos), { format: 'S/ #,##0.00' })
            ])
        )
    } else {
        filas.push(
            ['Ventas brutas', 'Tickets', 'Ticket promedio'].map(encabezadoExcel),
            [
                celda(Number(reporte.value.ventasBrutasTotales), { format: 'S/ #,##0.00' }),
                celda(reporte.value.totalTickets),
                celda(Number(reporte.value.ticketPromedio), { format: 'S/ #,##0.00' })
            ],
            [],
            ['Fecha / hora', 'Ticket', 'Mesa', 'Cliente', 'Método de pago', 'Total'].map(encabezadoExcel),
            ...reporte.value.ultimasVentas.map(venta => [
                celda(fechaHora(venta.fechaHora)), celda(venta.ticket), celda(`Mesa ${venta.numeroMesa}`),
                celda(venta.cliente), celda(venta.metodoPago), celda(Number(venta.total), { format: 'S/ #,##0.00' })
            ]),
            [],
            ['Método de pago', 'Tickets', 'Porcentaje'].map(encabezadoExcel),
            ...reporte.value.metodosPago.map(item => [
                celda(item.metodo), celda(item.cantidad), celda(Number(item.porcentaje) / 100, { format: '0.0%' })
            ])
        )
    }

    await writeXlsxFile(filas, {
        fileName: `${nombreBase()}.xlsx`,
        columns: [
            { width: 24 }, { width: 22 }, { width: 18 }, { width: 22 }, { width: 22 }, { width: 18 }
        ]
    })
}

onMounted(generarReporte)
</script>
