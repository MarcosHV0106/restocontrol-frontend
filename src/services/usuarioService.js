import api from './api'

// ================= SERVICIOS DE USUARIOS =================

export async function obtenerUsuarios() {
    const response = await api.get('/usuarios')
    return response.data
}

export async function crearUsuario(usuarioData) {
    const response = await api.post('/usuarios', usuarioData)
    return response.data
}

export async function actualizarUsuario(id, usuarioData) {
    const response = await api.put(`/usuarios/${id}`, usuarioData)
    return response.data
}

export async function eliminarUsuario(id) {
    const response = await api.delete(`/usuarios/${id}`)
    return response.data
}

export async function reenviarActivacionUsuario(id) {
    const response = await api.post(`/usuarios/${id}/reenviar-activacion`)
    return response.data
}

// ================= SERVICIOS DE ROLES =================

export async function obtenerRoles() {
    const response = await api.get('/roles')
    return response.data
}

export async function crearRol(rolData) {
    const response = await api.post('/roles', rolData)
    return response.data
}

export async function actualizarRol(id, rolData) {
    const response = await api.put(`/roles/${id}`, rolData)
    return response.data
}

export async function eliminarRol(id) {
    const response = await api.delete(`/roles/${id}`)
    return response.data
}
