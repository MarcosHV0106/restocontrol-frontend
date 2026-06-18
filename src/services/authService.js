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
