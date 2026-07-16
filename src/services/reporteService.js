import api from '@/services/api'

export async function obtenerReporteRentabilidad(desde, hasta) {
    const response = await api.get('/reportes/rentabilidad', { params: { desde, hasta } })
    return response.data
}

export async function obtenerReporteVentas(desde, hasta) {
    const response = await api.get('/reportes/ventas', { params: { desde, hasta } })
    return response.data
}
