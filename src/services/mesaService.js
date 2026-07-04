import api from './api';

// ================= SERVICIOS DE MESAS =================

export async function obtenerMesas() {
    const response = await api.get('/mesas/con-pedidos');
    return response.data;
}

export async function obtenerMesaPorId(id) {
    const response = await api.get(`/mesas/${id}`);
    return response.data;
}

export async function crearMesa(mesaData) {
    const response = await api.post('/mesas', mesaData);
    return response.data;
}

export async function actualizarMesa(id, mesaData) {
    const response = await api.put(`/mesas/${id}`, mesaData);
    return response.data;
}

export async function eliminarMesa(id) {
    const response = await api.delete(`/mesas/${id}`);
    return response.data;
}

export async function resumenMesas() {
    const response = await api.get('/mesas/resumen');
    return response.data;
}
