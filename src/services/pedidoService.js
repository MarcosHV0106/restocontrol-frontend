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
  }
};
