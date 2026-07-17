import api from './api'

// ================= RELACIÓN ALIMENTO - INSUMO =================

export async function obtenerAsociaciones() {
    const response = await api.get('/alimento-insumo')
    return response.data
}

export async function obtenerAsociacionesPorAlimento(idAlimento) {
    const response = await api.get(`/alimento-insumo/alimento/${idAlimento}`)
    return response.data
}

export async function obtenerAsociacionesPorInsumo(idInsumo) {
    const response = await api.get(`/alimento-insumo/insumo/${idInsumo}`)
    return response.data
}

export async function crearAsociacion(data) {
    const response = await api.post('/alimento-insumo', data)
    return response.data
}

export async function eliminarAsociacion(id) {
    const response = await api.delete(`/alimento-insumo/${id}`)
    return response.data
}