<template>
  <div class="layout">
    <SidebarComponent />
    <div class="main-content">
      <NavbarComponent />

      <main class="container-fluid p-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 class="fw-bold text-dark">Gestión de Pedidos</h2>
            <p class="text-muted">Control de ventas y estado de cuentas</p>
          </div>
          <button class="btn btn-primary" @click="cargarPedidos">
            <i class="bi bi-arrow-clockwise"></i> Actualizar
          </button>
        </div>

        <div class="card shadow-sm">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Mesa</th>
                    <th>Observación</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th class="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="pedido in pedidos" :key="pedido.idPedido">
                    <td>Mesa {{ pedido.mesa.numeroMesa }}</td>
                    <td>{{ pedido.observacion || 'Sin observaciónes' }}</td>
                    <td class="fw-bold">S/ {{ pedido.total.toFixed(2) }}</td>
                    <td>
                      <span :class="['badge', getEstadoClass(pedido.estadoPedido.nombreEstado)]">
                        {{ pedido.estadoPedido.nombreEstado }}
                      </span>
                    </td>
                      <td class="text-center">
                        <div class="d-flex gap-2 justify-content-center">
                          <button class="btn btn-sm btn-outline-primary" @click="irAEditarPedido(pedido)">
                            <i class="bi bi-pencil-square"></i> Ver / Editar
                          </button>

                          <button v-if="pedido.estadoPedido !== 'PAGADO'" class="btn btn-sm btn-success" @click="confirmarCobro(pedido.idPedido)">
                            <i class="bi bi-cash-coin"></i> Cobrar
                          </button>
                        </div>
                      </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import pedidoService from '@/services/pedidoService'; // Asegúrate que la ruta sea correcta
import NavbarComponent from '@/components/NavbarComponent.vue';
import SidebarComponent from '@/components/SidebarComponent.vue';
import { useRouter } from 'vue-router';
const router = useRouter();

const irAEditarPedido = (pedido) => {
  router.push({
    path: '/nuevo-pedido',
    query: {
      idPedido: pedido.idPedido,
      idMesa: pedido.mesa.idMesa,
      numeroMesa: pedido.mesa.numeroMesa // Enviamos el número visible
    }
  });
};

const pedidos = ref([]);

// Cargar lista
const cargarPedidos = async () => {
  try {
    pedidos.value = await pedidoService.getPedidos();
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    alert("No se pudieron cargar los pedidos.");
  }
};

// Acción Cobrar
const confirmarCobro = async (idPedido) => {
  if (!confirm(`¿Confirmar cobro del pedido #${idPedido}?`)) return;

  try {
    // Usamos el endpoint put que definiste: /api/pedidos/{idPedido}/cobrar
    await pedidoService.cobrarPedido(idPedido); // Debes agregar este método a tu service
    alert("Pedido cobrado exitosamente");
    await cargarPedidos(); // Refrescar lista
  } catch (error) {
    console.error("Error al cobrar:", error);
    alert("Error al procesar el pago");
  }
};

// Utilidad de diseño
const getEstadoClass = (estado) => {
  const map = {
    'PENDIENTE': 'bg-warning text-dark',
    'PAGADO': 'bg-success text-white',
    'CANCELADO': 'bg-danger text-white'
  };
  return map[estado] || 'bg-secondary';
};

onMounted(() => {
  cargarPedidos();
});
</script>

<style scoped>
.table th { padding: 1rem; }
.table td { padding: 1rem; }
</style>
