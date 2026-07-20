<template>
    <div class="layout">
        <SidebarComponent />

        <div class="main-content reportes-main">
            <NavbarComponent />

            <main class="reportes-page">
                <header class="reportes-heading">
                    <div class="reportes-title-group">
                        <span class="reportes-title-icon"><i class="bi bi-bar-chart-line"></i></span>
                        <div>
                        <h1>Reportes operativos y financieros</h1>
                        <p>Analiza ventas, operación, inventario y abastecimiento desde una sola vista.</p>
                        </div>
                    </div>
                </header>

                <section class="reportes-filtros" aria-label="Filtros del reporte">
                    <div class="reportes-control tipo-control">
                        <label for="tipoReporte">Tipo de reporte</label>
                        <select id="tipoReporte" v-model="filtros.tipo" class="form-select" @change="limpiarReporte">
                            <option value="rentabilidad">Rentabilidad</option>
                            <option value="ventas">Ventas</option>
                            <option value="gerencial">Gestión gerencial</option>
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
                        <button class="btn reportes-generate-button" :disabled="cargando" @click="generarReporte">
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
                                        <td data-label="#">{{ indice + 1 }}</td>
                                        <td data-label="Plato" class="fw-semibold">{{ plato.plato }}</td>
                                        <td data-label="Vendidos" class="text-end">{{ plato.vendidos }}</td>
                                        <td data-label="Precio venta">{{ moneda(plato.precioVentaPromedio) }}</td>
                                        <td data-label="Costo receta">{{ moneda(plato.costoReceta) }}</td>
                                        <td data-label="Margen"><span class="margen-badge">{{ porcentaje(plato.margenPorcentaje) }}</span></td>
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
                                        <td data-label="Fecha / hora">{{ fechaHora(venta.fechaHora) }}</td>
                                        <td data-label="Ticket" class="fw-semibold">{{ venta.ticket }}</td>
                                        <td data-label="Mesa">Mesa {{ venta.numeroMesa }}</td>
                                        <td data-label="Cliente">{{ venta.cliente }}</td>
                                        <td data-label="Método de pago"><span class="metodo-badge">{{ venta.metodoPago }}</span></td>
                                        <td data-label="Total" class="fw-semibold">S/ {{ moneda(venta.total) }}</td>
                                    </tr>
                                    <tr v-if="reporte.ultimasVentas.length === 0">
                                        <td colspan="6" class="reportes-empty">No hay ventas pagadas en el periodo seleccionado.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>
                </template>

                <template v-if="reporte && filtros.tipo === 'gerencial'">
                    <section class="gerencial-intro" aria-label="Alcance del reporte gerencial">
                        <span><i class="bi bi-compass"></i></span>
                        <div>
                            <strong>Centro de decisiones</strong>
                            <p>Las ventas, cancelaciones, compras, consumos y movimientos corresponden al periodo seleccionado. Los agotados reflejan el inventario actual.</p>
                        </div>
                    </section>

                    <section class="reportes-kpis gerencial-kpis" aria-label="Indicadores para toma de decisiones">
                        <article class="reporte-kpi-card">
                            <div class="kpi-icon"><i class="bi bi-cash-stack"></i></div>
                            <div><span>Ventas del periodo (S/)</span><strong>{{ moneda(reporte.indicadores.ventasTotales) }}</strong><small>{{ reporte.indicadores.pedidosPagados }} pedidos pagados</small></div>
                        </article>
                        <article class="reporte-kpi-card">
                            <div class="kpi-icon"><i class="bi bi-truck"></i></div>
                            <div><span>Compras registradas (S/)</span><strong>{{ moneda(reporte.indicadores.comprasRegistradas) }}</strong><small>Abastecimiento del periodo</small></div>
                        </article>
                        <article class="reporte-kpi-card">
                            <div class="kpi-icon"><i class="bi bi-basket2"></i></div>
                            <div><span>Consumo real valorizado (S/)</span><strong>{{ moneda(reporte.indicadores.costoConsumoInventario) }}</strong><small>Insumos descontados por pedidos</small></div>
                        </article>
                        <article class="reporte-kpi-card">
                            <div class="kpi-icon"><i class="bi bi-boxes"></i></div>
                            <div><span>Valor del inventario actual (S/)</span><strong>{{ moneda(reporte.indicadores.valorInventarioActual) }}</strong><small>{{ reporte.indicadores.insumosBajoMinimo }} bajo el mínimo</small></div>
                        </article>
                        <article class="reporte-kpi-card" :class="{ 'kpi-attention': reporte.indicadores.pedidosCancelados > 0 }">
                            <div class="kpi-icon"><i class="bi bi-x-octagon"></i></div>
                            <div><span>Tasa de cancelación</span><strong>{{ porcentaje(reporte.indicadores.tasaCancelacion) }}</strong><small>{{ reporte.indicadores.pedidosCancelados }} pedidos cancelados</small></div>
                        </article>
                        <article class="reporte-kpi-card" :class="{ 'kpi-attention': reporte.indicadores.alertasActivas > 0 }">
                            <div class="kpi-icon"><i class="bi bi-bell"></i></div>
                            <div><span>Alertas activas</span><strong>{{ reporte.indicadores.alertasActivas }}</strong><small>{{ reporte.indicadores.insumosAgotados }} insumos agotados</small></div>
                        </article>
                    </section>

                    <nav class="gerencial-tabs" aria-label="Secciones del reporte gerencial">
                        <button v-for="seccion in seccionesGerenciales" :key="seccion.id" type="button"
                            :class="{ active: seccionGerencial === seccion.id }" @click="seccionGerencial = seccion.id">
                            <i :class="seccion.icono"></i>{{ seccion.nombre }}
                        </button>
                    </nav>

                    <template v-if="seccionGerencial === 'resumen'">
                        <section class="reportes-chart-grid gerencial-chart-grid">
                            <article class="reporte-panel">
                                <div class="panel-heading gerencial-panel-heading">
                                    <div><h3>Ventas por periodo</h3><p>Consulta el desempeño diario, semanal o mensual.</p></div>
                                    <select v-model="agrupacionVentas" class="form-select gerencial-select" aria-label="Agrupar ventas">
                                        <option value="dia">Por día</option>
                                        <option value="semana">Por semana</option>
                                        <option value="mes">Por mes</option>
                                    </select>
                                </div>
                                <div v-if="ventasAgrupadas.length" class="chart-wrap gerencial-sales-chart">
                                    <Bar :data="datosGraficoVentasGerenciales" :options="opcionesGraficoMoneda" />
                                </div>
                                <div v-else class="reportes-empty chart-empty">No hay ventas pagadas en el periodo.</div>
                            </article>

                            <article class="reporte-panel table-panel">
                                <div class="panel-heading"><div><h3>Ventas por tipo de atención</h3><p>Participación de cada modalidad sobre las ventas.</p></div></div>
                                <div class="table-responsive">
                                    <table class="table reportes-table align-middle mb-0">
                                        <thead><tr><th>Modalidad</th><th>Pedidos</th><th>Ventas (S/)</th><th>Participación</th></tr></thead>
                                        <tbody>
                                            <tr v-for="item in reporte.ventasPorModalidad" :key="item.modalidad">
                                                <td data-label="Modalidad"><span class="metodo-badge">{{ item.modalidad }}</span></td>
                                                <td data-label="Pedidos">{{ item.pedidos }}</td>
                                                <td data-label="Ventas">S/ {{ moneda(item.ventas) }}</td>
                                                <td data-label="Participación">{{ porcentaje(item.participacion) }}</td>
                                            </tr>
                                            <tr v-if="!reporte.ventasPorModalidad.length"><td colspan="4" class="reportes-empty">Sin ventas para comparar.</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </article>
                        </section>
                    </template>

                    <template v-if="seccionGerencial === 'productos'">
                        <section class="reportes-chart-grid products-grid">
                            <article class="reporte-panel table-panel">
                                <div class="panel-heading"><div><h3>Productos más vendidos</h3><p>Ranking por porciones pagadas.</p></div><span class="ranking-icon success"><i class="bi bi-graph-up-arrow"></i></span></div>
                                <div class="table-responsive"><table class="table reportes-table align-middle mb-0">
                                    <thead><tr><th>#</th><th>Producto</th><th>Categoría</th><th>Vendidos</th><th>Ingresos (S/)</th></tr></thead>
                                    <tbody>
                                        <tr v-for="(item, indice) in reporte.productosMasVendidos" :key="item.idAlimento"><td data-label="#">{{ indice + 1 }}</td><td data-label="Producto" class="fw-semibold">{{ item.producto }}</td><td data-label="Categoría">{{ item.categoria }}</td><td data-label="Vendidos">{{ item.cantidadVendida }}</td><td data-label="Ingresos">S/ {{ moneda(item.ingresos) }}</td></tr>
                                        <tr v-if="!reporte.productosMasVendidos.length"><td colspan="5" class="reportes-empty">No hay productos vendidos.</td></tr>
                                    </tbody>
                                </table></div>
                            </article>
                            <article class="reporte-panel table-panel">
                                <div class="panel-heading"><div><h3>Productos menos vendidos</h3><p>Incluye platos activos sin ventas en el periodo.</p></div><span class="ranking-icon warning"><i class="bi bi-graph-down-arrow"></i></span></div>
                                <div class="table-responsive"><table class="table reportes-table align-middle mb-0">
                                    <thead><tr><th>#</th><th>Producto</th><th>Categoría</th><th>Vendidos</th><th>Ingresos (S/)</th></tr></thead>
                                    <tbody>
                                        <tr v-for="(item, indice) in reporte.productosMenosVendidos" :key="item.idAlimento"><td data-label="#">{{ indice + 1 }}</td><td data-label="Producto" class="fw-semibold">{{ item.producto }}</td><td data-label="Categoría">{{ item.categoria }}</td><td data-label="Vendidos">{{ item.cantidadVendida }}</td><td data-label="Ingresos">S/ {{ moneda(item.ingresos) }}</td></tr>
                                        <tr v-if="!reporte.productosMenosVendidos.length"><td colspan="5" class="reportes-empty">No hay productos activos.</td></tr>
                                    </tbody>
                                </table></div>
                            </article>
                        </section>
                    </template>

                    <template v-if="seccionGerencial === 'inventario'">
                        <section class="inventory-decision-strip" aria-label="Estado actual de inventario">
                            <div><i class="bi bi-exclamation-triangle"></i><span><strong>{{ reporte.indicadores.insumosAgotados }}</strong> agotados</span></div>
                            <div><i class="bi bi-speedometer"></i><span><strong>{{ reporte.indicadores.insumosBajoMinimo }}</strong> bajo el mínimo</span></div>
                            <div><i class="bi bi-bell"></i><span><strong>{{ reporte.indicadores.alertasActivas }}</strong> alertas activas</span></div>
                        </section>

                        <section class="reporte-panel table-panel">
                            <div class="panel-heading"><div><h3>Consumo de insumos por pedidos</h3><p>Cantidades realmente descontadas del inventario durante el periodo.</p></div></div>
                            <div class="table-responsive"><table class="table reportes-table align-middle mb-0">
                                <thead><tr><th>Insumo</th><th>Unidad</th><th>Cantidad consumida</th><th>Costo teórico (S/)</th><th>Movimientos</th><th>Último consumo</th></tr></thead>
                                <tbody>
                                    <tr v-for="item in reporte.consumoInsumos" :key="item.idInsumo"><td data-label="Insumo" class="fw-semibold">{{ item.insumo }}</td><td data-label="Unidad">{{ item.unidadMedida }}</td><td data-label="Cantidad">{{ cantidad(item.cantidadConsumida) }}</td><td data-label="Costo">S/ {{ moneda(item.costoTeorico) }}</td><td data-label="Movimientos">{{ item.movimientos }}</td><td data-label="Último consumo">{{ fechaHora(item.ultimoConsumo) }}</td></tr>
                                    <tr v-if="!reporte.consumoInsumos.length"><td colspan="6" class="reportes-empty">No hubo consumo automático por pedidos.</td></tr>
                                </tbody>
                            </table></div>
                        </section>

                        <section class="reportes-chart-grid inventory-report-grid">
                            <article class="reporte-panel table-panel">
                                <div class="panel-heading"><div><h3>Insumos agotados</h3><p>Estado actual que requiere reposición.</p></div></div>
                                <div class="table-responsive"><table class="table reportes-table align-middle mb-0">
                                    <thead><tr><th>Insumo</th><th>Stock</th><th>Mínimo</th><th>Costo unitario</th></tr></thead>
                                    <tbody>
                                        <tr v-for="item in reporte.insumosAgotados" :key="item.idInsumo"><td data-label="Insumo" class="fw-semibold">{{ item.insumo }}</td><td data-label="Stock"><span class="stockout-badge">{{ cantidad(item.stockActual) }} {{ item.unidadMedida }}</span></td><td data-label="Mínimo">{{ cantidad(item.stockMinimo) }}</td><td data-label="Costo">S/ {{ moneda(item.costoUnitario) }}</td></tr>
                                        <tr v-if="!reporte.insumosAgotados.length"><td colspan="4" class="reportes-empty">No hay insumos agotados.</td></tr>
                                    </tbody>
                                </table></div>
                            </article>
                            <article class="reporte-panel table-panel movements-panel">
                                <div class="panel-heading"><div><h3>Movimientos de inventario</h3><p>Trazabilidad de entradas, consumos y ajustes.</p></div></div>
                                <div class="table-responsive movements-scroll"><table class="table reportes-table align-middle mb-0">
                                    <thead><tr><th>Fecha</th><th>Tipo</th><th>Insumo</th><th>Cantidad</th><th>Referencia</th><th>Responsable</th></tr></thead>
                                    <tbody>
                                        <tr v-for="item in reporte.movimientosInventario" :key="item.idMovimiento"><td data-label="Fecha">{{ fechaHora(item.fecha) }}</td><td data-label="Tipo"><span class="movement-badge" :class="claseMovimiento(item.tipo)">{{ tipoMovimientoTexto(item.tipo) }}</span></td><td data-label="Insumo">{{ item.insumo }}</td><td data-label="Cantidad">{{ cantidad(item.cantidad) }} {{ item.unidadMedida }}</td><td data-label="Referencia">{{ item.referencia }}</td><td data-label="Responsable">{{ item.responsable }}</td></tr>
                                        <tr v-if="!reporte.movimientosInventario.length"><td colspan="6" class="reportes-empty">No hay movimientos en el periodo.</td></tr>
                                    </tbody>
                                </table></div>
                            </article>
                        </section>
                    </template>

                    <template v-if="seccionGerencial === 'cancelaciones'">
                        <section class="reporte-panel table-panel">
                            <div class="panel-heading"><div><h3>Pedidos anulados o cancelados</h3><p>Consulta causas, responsables y monto potencial perdido.</p></div><span class="cancel-summary">S/ {{ moneda(totalCancelado) }} anulados</span></div>
                            <div class="table-responsive"><table class="table reportes-table align-middle mb-0">
                                <thead><tr><th>Fecha</th><th>Pedido</th><th>Modalidad</th><th>Mesa</th><th>Responsable</th><th>Motivo</th><th>Total (S/)</th></tr></thead>
                                <tbody>
                                    <tr v-for="item in reporte.pedidosCancelados" :key="item.idPedido"><td data-label="Fecha">{{ fechaHora(item.fechaCancelacion) }}</td><td data-label="Pedido" class="fw-semibold">#{{ item.idPedido }}</td><td data-label="Modalidad">{{ item.modalidad }}</td><td data-label="Mesa">{{ mesaTexto(item.numeroMesa) }}</td><td data-label="Responsable">{{ item.responsable }}</td><td data-label="Motivo">{{ item.motivo }}</td><td data-label="Total">S/ {{ moneda(item.totalAnulado) }}</td></tr>
                                    <tr v-if="!reporte.pedidosCancelados.length"><td colspan="7" class="reportes-empty">No hubo pedidos cancelados en el periodo.</td></tr>
                                </tbody>
                            </table></div>
                        </section>
                    </template>
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
import {
    obtenerReporteGerencial,
    obtenerReporteRentabilidad,
    obtenerReporteVentas
} from '@/services/reporteService'
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
const seccionGerencial = ref('resumen')
const agrupacionVentas = ref('dia')

const seccionesGerenciales = [
    { id: 'resumen', nombre: 'Resumen', icono: 'bi bi-speedometer2' },
    { id: 'productos', nombre: 'Productos', icono: 'bi bi-stars' },
    { id: 'inventario', nombre: 'Inventario', icono: 'bi bi-box-seam' },
    { id: 'cancelaciones', nombre: 'Cancelaciones', icono: 'bi bi-x-octagon' }
]

const colores = ['#2d2d2d', '#df7a48', '#f0b36d', '#8b6f5a', '#9aa2a8', '#5d8a70']

const limpiarReporte = () => {
    reporte.value = null
    mensajeError.value = ''
    seccionGerencial.value = 'resumen'
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

const ventasAgrupadas = computed(() => {
    if (!reporte.value || filtros.tipo !== 'gerencial') return []
    const campo = {
        dia: 'ventasPorDia',
        semana: 'ventasPorSemana',
        mes: 'ventasPorMes'
    }[agrupacionVentas.value]
    return reporte.value[campo] || []
})

const datosGraficoVentasGerenciales = computed(() => ({
    labels: ventasAgrupadas.value.map(item => periodoTexto(item)),
    datasets: [{
        label: 'Ventas (S/)',
        data: ventasAgrupadas.value.map(item => Number(item.ventas)),
        backgroundColor: '#df7a48',
        borderRadius: 6,
        maxBarThickness: 44
    }]
}))

const totalCancelado = computed(() => reporte.value?.pedidosCancelados
    ?.reduce((total, item) => total + Number(item.totalAnulado || 0), 0) || 0)

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
        const generadores = {
            rentabilidad: obtenerReporteRentabilidad,
            ventas: obtenerReporteVentas,
            gerencial: obtenerReporteGerencial
        }
        reporte.value = await generadores[filtros.tipo](filtros.desde, filtros.hasta)
        if (filtros.tipo === 'gerencial') seccionGerencial.value = 'resumen'
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

const cantidad = valor => Number(valor || 0).toLocaleString('es-PE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4
})

const fechaCorta = fecha => new Date(`${fecha}T00:00:00`).toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit'
})

const fechaHora = fecha => new Date(fecha).toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
})

const periodoTexto = item => {
    if (agrupacionVentas.value === 'dia') return fechaCorta(item.inicio)
    if (agrupacionVentas.value === 'mes') {
        return new Date(`${item.inicio}T00:00:00`).toLocaleDateString('es-PE', { month: 'short', year: 'numeric' })
    }
    return `${fechaCorta(item.inicio)} - ${fechaCorta(item.fin)}`
}

const mesaTexto = numeroMesa => numeroMesa ? `Mesa ${numeroMesa}` : 'Sin mesa'

const tipoMovimientoTexto = tipo => String(tipo || 'Sin tipo')
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^./, letra => letra.toUpperCase())

const claseMovimiento = tipo => {
    const valor = String(tipo || '').toUpperCase()
    if (valor.includes('ENTRADA') || valor.includes('POSITIVA')) return 'movement-in'
    if (valor.includes('CONSUMO') || valor.includes('SALIDA')) return 'movement-out'
    if (valor.includes('MERMA') || valor.includes('NEGATIVA')) return 'movement-loss'
    return 'movement-neutral'
}

const tituloReporte = () => ({
    rentabilidad: 'Reporte de Rentabilidad',
    ventas: 'Reporte de Ventas',
    gerencial: 'Reporte de Gestión Gerencial'
}[filtros.tipo])
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

    const agregarTabla = (encabezados, cuerpo, color = [223, 122, 72]) => {
        let inicio = doc.lastAutoTable ? doc.lastAutoTable.finalY + 7 : 36
        if (inicio > 178) {
            doc.addPage()
            inicio = 16
        }
        autoTable(doc, {
            startY: inicio,
            head: [encabezados],
            body: cuerpo,
            theme: 'striped',
            headStyles: { fillColor: color },
            styles: { fontSize: 7.5, cellPadding: 2 }
        })
    }

    if (filtros.tipo === 'gerencial') {
        agregarTabla(
            ['Ventas', 'Compras', 'Consumo valorizado', 'Valor inventario', 'Cancelación', 'Alertas'],
            [[
                `S/ ${moneda(reporte.value.indicadores.ventasTotales)}`,
                `S/ ${moneda(reporte.value.indicadores.comprasRegistradas)}`,
                `S/ ${moneda(reporte.value.indicadores.costoConsumoInventario)}`,
                `S/ ${moneda(reporte.value.indicadores.valorInventarioActual)}`,
                porcentaje(reporte.value.indicadores.tasaCancelacion),
                reporte.value.indicadores.alertasActivas
            ]],
            [45, 45, 45]
        )
        agregarTabla(
            ['Ranking', 'Producto', 'Categoría', 'Vendidos', 'Ingresos'],
            [
                ...reporte.value.productosMasVendidos.map(item => [
                    'Más vendido', item.producto, item.categoria, item.cantidadVendida, `S/ ${moneda(item.ingresos)}`
                ]),
                ...reporte.value.productosMenosVendidos.map(item => [
                    'Menos vendido', item.producto, item.categoria, item.cantidadVendida, `S/ ${moneda(item.ingresos)}`
                ])
            ]
        )
        agregarTabla(
            ['Modalidad', 'Pedidos', 'Ventas', 'Participación'],
            reporte.value.ventasPorModalidad.map(item => [
                item.modalidad, item.pedidos, `S/ ${moneda(item.ventas)}`, porcentaje(item.participacion)
            ])
        )
        agregarTabla(
            ['Insumo', 'Unidad', 'Cantidad consumida', 'Costo teórico', 'Movimientos', 'Último consumo'],
            reporte.value.consumoInsumos.map(item => [
                item.insumo, item.unidadMedida, cantidad(item.cantidadConsumida),
                `S/ ${moneda(item.costoTeorico)}`, item.movimientos, fechaHora(item.ultimoConsumo)
            ])
        )
        agregarTabla(
            ['Fecha', 'Pedido', 'Modalidad', 'Mesa', 'Responsable', 'Motivo', 'Total anulado'],
            reporte.value.pedidosCancelados.map(item => [
                fechaHora(item.fechaCancelacion), `#${item.idPedido}`, item.modalidad, mesaTexto(item.numeroMesa),
                item.responsable, item.motivo, `S/ ${moneda(item.totalAnulado)}`
            ]),
            [177, 80, 66]
        )
        agregarTabla(
            ['Insumo agotado', 'Stock', 'Mínimo', 'Unidad', 'Costo unitario'],
            reporte.value.insumosAgotados.map(item => [
                item.insumo, cantidad(item.stockActual), cantidad(item.stockMinimo),
                item.unidadMedida, `S/ ${moneda(item.costoUnitario)}`
            ]),
            [177, 80, 66]
        )
        agregarTabla(
            ['Fecha', 'Tipo', 'Insumo', 'Cantidad', 'Unidad', 'Referencia', 'Responsable'],
            reporte.value.movimientosInventario.map(item => [
                fechaHora(item.fecha), tipoMovimientoTexto(item.tipo), item.insumo, cantidad(item.cantidad),
                item.unidadMedida, item.referencia, item.responsable
            ])
        )
    } else if (filtros.tipo === 'rentabilidad') {
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
    const totalColumnas = filtros.tipo === 'gerencial' ? 8 : 6
    const filas = [
        [celda('RestoControl', { fontWeight: 'bold', fontSize: 18, span: totalColumnas })],
        [celda(tituloReporte(), { fontWeight: 'bold', fontSize: 14, span: totalColumnas })],
        [celda(`Periodo: ${filtros.desde} al ${filtros.hasta}`, { span: totalColumnas })],
        []
    ]

    if (filtros.tipo === 'gerencial') {
        filas.push(
            ['Ventas', 'Compras', 'Consumo valorizado', 'Valor inventario', 'Pedidos pagados', 'Pedidos cancelados', 'Tasa cancelación', 'Alertas'].map(encabezadoExcel),
            [
                celda(Number(reporte.value.indicadores.ventasTotales), { format: 'S/ #,##0.00' }),
                celda(Number(reporte.value.indicadores.comprasRegistradas), { format: 'S/ #,##0.00' }),
                celda(Number(reporte.value.indicadores.costoConsumoInventario), { format: 'S/ #,##0.00' }),
                celda(Number(reporte.value.indicadores.valorInventarioActual), { format: 'S/ #,##0.00' }),
                celda(reporte.value.indicadores.pedidosPagados),
                celda(reporte.value.indicadores.pedidosCancelados),
                celda(Number(reporte.value.indicadores.tasaCancelacion) / 100, { format: '0.0%' }),
                celda(reporte.value.indicadores.alertasActivas)
            ],
            [],
            ['Periodo diario', 'Desde', 'Hasta', 'Pedidos', 'Ventas'].map(encabezadoExcel),
            ...reporte.value.ventasPorDia.map(item => [
                celda(item.periodo), celda(item.inicio), celda(item.fin), celda(item.pedidos),
                celda(Number(item.ventas), { format: 'S/ #,##0.00' })
            ]),
            [],
            ['Ranking', 'Producto', 'Categoría', 'Vendidos', 'Ingresos'].map(encabezadoExcel),
            ...reporte.value.productosMasVendidos.map(item => [
                celda('Más vendido'), celda(item.producto), celda(item.categoria), celda(item.cantidadVendida),
                celda(Number(item.ingresos), { format: 'S/ #,##0.00' })
            ]),
            ...reporte.value.productosMenosVendidos.map(item => [
                celda('Menos vendido'), celda(item.producto), celda(item.categoria), celda(item.cantidadVendida),
                celda(Number(item.ingresos), { format: 'S/ #,##0.00' })
            ]),
            [],
            ['Modalidad', 'Pedidos', 'Ventas', 'Participación'].map(encabezadoExcel),
            ...reporte.value.ventasPorModalidad.map(item => [
                celda(item.modalidad), celda(item.pedidos),
                celda(Number(item.ventas), { format: 'S/ #,##0.00' }),
                celda(Number(item.participacion) / 100, { format: '0.0%' })
            ]),
            [],
            ['Insumo', 'Unidad', 'Cantidad consumida', 'Costo teórico', 'Movimientos', 'Último consumo'].map(encabezadoExcel),
            ...reporte.value.consumoInsumos.map(item => [
                celda(item.insumo), celda(item.unidadMedida), celda(Number(item.cantidadConsumida)),
                celda(Number(item.costoTeorico), { format: 'S/ #,##0.00' }), celda(item.movimientos),
                celda(fechaHora(item.ultimoConsumo))
            ]),
            [],
            ['Fecha', 'Pedido', 'Modalidad', 'Mesa', 'Responsable', 'Motivo', 'Total anulado'].map(encabezadoExcel),
            ...reporte.value.pedidosCancelados.map(item => [
                celda(fechaHora(item.fechaCancelacion)), celda(`#${item.idPedido}`), celda(item.modalidad),
                celda(mesaTexto(item.numeroMesa)), celda(item.responsable), celda(item.motivo),
                celda(Number(item.totalAnulado), { format: 'S/ #,##0.00' })
            ]),
            [],
            ['Insumo agotado', 'Stock', 'Mínimo', 'Unidad', 'Costo unitario'].map(encabezadoExcel),
            ...reporte.value.insumosAgotados.map(item => [
                celda(item.insumo), celda(Number(item.stockActual)), celda(Number(item.stockMinimo)),
                celda(item.unidadMedida), celda(Number(item.costoUnitario), { format: 'S/ #,##0.00' })
            ]),
            [],
            ['Fecha', 'Tipo', 'Insumo', 'Cantidad', 'Unidad', 'Referencia', 'Responsable'].map(encabezadoExcel),
            ...reporte.value.movimientosInventario.map(item => [
                celda(fechaHora(item.fecha)), celda(tipoMovimientoTexto(item.tipo)), celda(item.insumo),
                celda(Number(item.cantidad)), celda(item.unidadMedida), celda(item.referencia), celda(item.responsable)
            ])
        )
    } else if (filtros.tipo === 'rentabilidad') {
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
            { width: 24 }, { width: 22 }, { width: 18 }, { width: 22 },
            { width: 22 }, { width: 24 }, { width: 20 }, { width: 18 }
        ]
    })
}

onMounted(generarReporte)
</script>
