import api from './api'

// ================= SERVICIOS DE ALIMENTOS =================

export async function obtenerAlimentos() {
    const response = await api.get('/alimentos')
    return response.data
}

export async function crearAlimento(alimentoData) {
    const response = await api.post('/alimentos', alimentoData)
    return response.data
}

export async function actualizarAlimento(id, alimentoData) {
    const response = await api.put(`/alimentos/${id}`, alimentoData)
    return response.data
}

export async function eliminarAlimento(id) {
    const response = await api.delete(`/alimentos/${id}`)
    return response.data
}

export async function obtenerReceta(idAlimento) {
    const response = await api.get(`/alimentos/${idAlimento}/receta`)
    return response.data
}

export async function reemplazarReceta(idAlimento, receta) {
    const response = await api.put(`/alimentos/${idAlimento}/receta`, receta)
    return response.data
}

export async function obtenerInsumos() {
    const response = await api.get('/insumos')
    return response.data
}

export async function crearInsumo(insumo) {
    const response = await api.post('/insumos', insumo)
    return response.data
}

export async function actualizarInsumo(id, insumo) {
    const response = await api.put(`/insumos/${id}`, insumo)
    return response.data
}


// ================= SERVICIOS DE CATEGORÍAS =================

export async function obtenerCategorias() {
    const response = await api.get('/categorias')
    return response.data
}

export async function crearCategoria(categoriaData) {
    const response = await api.post('/categorias', categoriaData)
    return response.data
}

export async function actualizarCategoria(id, categoriaData) {
    const response = await api.put(`/categorias/${id}`, categoriaData)
    return response.data
}

export async function eliminarCategoria(id) {
    const response = await api.delete(`/categorias/${id}`)
    return response.data
}

export async function obtenerEstimacionDiaria(fecha) {
    const response = await api.get(`/estimaciones-diarias/${fecha}`)
    return response.data
}

export async function validarEstimacionDiaria(fecha, estimacion) {
    const response = await api.post(`/estimaciones-diarias/${fecha}/validar`, estimacion)
    return response.data
}

export async function guardarEstimacionDiaria(fecha, estimacion) {
    const response = await api.put(`/estimaciones-diarias/${fecha}`, estimacion)
    return response.data
}
