import api from './api'

export async function obtenerProveedores() {
  const response = await api.get('/proveedores')
  return response.data
}

export async function crearProveedor(datos) {
  const response = await api.post('/proveedores', datos)
  return response.data
}

export async function actualizarProveedor(idProveedor, datos) {
  const response = await api.put(`/proveedores/${idProveedor}`, datos)
  return response.data
}

export async function obtenerCompras() {
  const response = await api.get('/compras-abastecimiento')
  return response.data
}

export async function registrarCompra(datos) {
  const response = await api.post('/compras-abastecimiento', datos)
  return response.data
}
