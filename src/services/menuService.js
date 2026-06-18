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
