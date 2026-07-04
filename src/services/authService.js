import api from './api'

export async function login(correo, clave) {

    const response = await api.post(
        '/auth/login',
        {
            correo,
            clave
        }
    )

    return response.data

}

export async function validarActivacionCuenta(token) {

    const response = await api.get(
        `/auth/activaciones/${token}`
    )

    return response.data

}

export async function crearClaveActivacion(token, clave, confirmacionClave) {

    const response = await api.post(
        `/auth/activaciones/${token}/crear-clave`,
        {
            clave,
            confirmacionClave
        }
    )

    return response.data

}
