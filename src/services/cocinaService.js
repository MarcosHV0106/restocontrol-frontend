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
}
