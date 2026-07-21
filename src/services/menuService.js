import api from './api'

export async function obtenerAlimentos() {
  const response = await api.get('/alimentos')
  return response.data
}

export async function crearAlimento(alimento) {
  const response = await api.post('/alimentos', alimento)
  return response.data
}

export async function actualizarAlimento(id, alimento) {
  const response = await api.put(`/alimentos/${id}`, alimento)
  return response.data
}

export async function eliminarAlimento(id) {
  await api.delete(`/alimentos/${id}`)
}

export async function obtenerCategorias() {
  const response = await api.get('/categorias')
  return response.data
}

export async function crearCategoria(categoria) {
  const response = await api.post('/categorias', categoria)
  return response.data
}

export async function actualizarCategoria(id, categoria) {
  const response = await api.put(`/categorias/${id}`, categoria)
  return response.data
}

export async function eliminarCategoria(id) {
  await api.delete(`/categorias/${id}`)
}
