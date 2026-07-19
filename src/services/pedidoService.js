import api from '@/services/api';

export default {
  async createPedido(pedidoData) {
    try {
      const response = await api.post('/pedidos/crear', pedidoData);
      return response.data;
    } catch (error) {
      console.error('Error creating pedido:', error);
      throw error;
    }
  },

  async getPedidos() {
    try {
      const response = await api.get('/pedidos');
      return response.data;
    } catch (error) {
      console.error('Error fetching pedidos:', error);
      throw error;
    }
  },

  async getPedidoPorId(idPedido) {
    try {
      const response = await api.get(`/pedidos/${idPedido}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pedido by id:', error);
      throw error;
    }
  },

  async updatePedido(id, updatedData) {
    try {
      const response = await api.put(`/pedidos/${id}`, updatedData);
      return response.data;
    } catch (error) {
      console.error('Error updating pedido:', error);
      throw error;
    }
  },

  async getPedidoPorMesa(idMesa) {
    try {
      const response = await api.get(`/pedidos/mesa/${idMesa}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pedido por mesa:', error);
      throw error;
    }
  },

  async getModalidades() {
    const response = await api.get('/modalidadespedidos');
    return response.data;
  },

  async getResponsables() {
    const response = await api.get('/pedidos/responsables');
    return response.data;
  },

  async enviarACocina(idPedido) {
    const response = await api.post(`/pedidos/${idPedido}/enviar-cocina`);
    return response.data;
  },

  async reabrir(idPedido) {
    const response = await api.post(`/pedidos/${idPedido}/reabrir`);
    return response.data;
  },

  async solicitarCuenta(idPedido) {
    const response = await api.post(`/pedidos/${idPedido}/solicitar-cuenta`);
    return response.data;
  },

  async anular(idPedido, motivo) {
    const response = await api.post(`/pedidos/${idPedido}/anular`, { motivo });
    return response.data;
  },

  async cambiarMesa(idPedido, idMesaDestino) {
    const response = await api.put(`/pedidos/${idPedido}/mesa`, { idMesaDestino });
    return response.data;
  },

  async transferirResponsable(idPedido, idUsuarioDestino) {
    const response = await api.put(`/pedidos/${idPedido}/responsable`, { idUsuarioDestino });
    return response.data;
  },

  async actualizarObservacion(idPedido, observacion) {
    const response = await api.put(`/pedidos/${idPedido}/observacion`, { observacion });
    return response.data;
  }
};
