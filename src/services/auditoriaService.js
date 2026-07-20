import api from './api'

export async function obtenerAuditoria(filtros) {
  const response = await api.get('/auditoria', { params: filtros })
  return response.data
}

export async function obtenerOpcionesAuditoria() {
  const response = await api.get('/auditoria/opciones')
  return response.data
}
