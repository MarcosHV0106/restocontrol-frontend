const HOME_ROUTE_BY_ROLE = Object.freeze({
  ADMIN: '/dashboard',
  GERENTE: '/dashboard',
  MESERO: '/mesas',
  CAJERO: '/pedidos',
  COCINERO: '/cocina',
})

export function normalizeRole(role) {
  return String(role || '').trim().toUpperCase()
}

export function getHomeRouteForRole(role) {
  return HOME_ROUTE_BY_ROLE[normalizeRole(role)] || '/configuracion'
}
