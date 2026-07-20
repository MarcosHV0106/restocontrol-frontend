import api from '@/services/api'

export default {
  async getPedidos() {
    const response = await api.get('/cocina/pedidos')
    return response.data
  },

  async actualizarEstado(idPedido, estado) {
    const response = await api.put(`/cocina/pedidos/${idPedido}/estado`, { estado })
    return response.data
  },

  async getProductos() {
    const response = await api.get('/cocina/productos')
    return response.data
  },

  async actualizarDisponibilidad(idAlimento, disponible, motivo = null) {
    const response = await api.put(`/cocina/productos/${idAlimento}/disponibilidad`, { disponible, motivo })
    return response.data
  },

  async getHistorial(turno = 'ACTUAL') {
    const response = await api.get('/cocina/historial', { params: { turno } })
    return response.data
  },
}
