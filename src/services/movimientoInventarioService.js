import api from '@/services/api'

export async function obtenerMovimientosInventario() {
  const response = await api.get('/movimientosinventarios')
  return response.data
}
