import api from './api'

export async function obtenerLotes(idInsumo) {
  const response = await api.get(`/insumos/${idInsumo}/lotes`)
  return response.data
}

export async function crearLote(idInsumo, datos) {
  const response = await api.post(`/insumos/${idInsumo}/lotes`, datos)
  return response.data
}

export async function actualizarLote(idLote, datos) {
  const response = await api.put(`/lotes/${idLote}`, datos)
  return response.data
}

export async function retirarLote(idLote, datos) {
  const response = await api.post(`/lotes/${idLote}/retirar`, datos)
  return response.data
}

export async function ajustarLote(idLote, datos) {
  const response = await api.post(`/lotes/${idLote}/ajustes`, datos)
  return response.data
}
