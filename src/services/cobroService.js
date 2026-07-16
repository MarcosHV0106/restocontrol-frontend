import api from '@/services/api'

export default {
  async getPendientes() {
    const response = await api.get('/cobros/pendientes')
    return response.data
  },

  async getPedido(idPedido) {
    const response = await api.get(`/cobros/pedidos/${idPedido}`)
    return response.data
  },

  async procesarCobro(idPedido, cobro) {
    const response = await api.post(`/cobros/pedidos/${idPedido}`, cobro)
    return response.data
  },

  async getCobro(idCobro) {
    const response = await api.get(`/cobros/${idCobro}`)
    return response.data
  },
}
