import api from './api'

// ================= SERVICIOS DE INSUMOS =================

export async function obtenerInsumos() {
    const response = await api.get('/insumos')
    return response.data
}

export async function obtenerInsumo(id) {
    const response = await api.get(`/insumos/${id}`)
    return response.data
}

export async function crearInsumo(insumoData) {
    const response = await api.post('/insumos', insumoData)
    return response.data
}

export async function actualizarInsumo(id, insumoData) {
    const response = await api.put(`/insumos/${id}`, insumoData)
    return response.data
}

export async function eliminarInsumo(id) {
    const response = await api.delete(`/insumos/${id}`)
    return response.data
}