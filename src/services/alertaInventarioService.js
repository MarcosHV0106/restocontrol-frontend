import api from './api'

export async function obtenerAlertas(params = {}) {
  const response = await api.get('/alertas', { params })
  return response.data
}

export async function obtenerResumenAlertas() {
  const response = await api.get('/alertas/resumen')
  return response.data
}

export async function sincronizarAlertas() {
  await api.post('/alertas/sincronizar')
}

export async function atenderAlerta(idAlerta, datos) {
  const response = await api.post(`/alertas/${idAlerta}/atenciones`, datos)
  return response.data
}
