import axios from 'axios'

// 1. Crear la instancia base de Axios
const api = axios.create({
    baseURL: 'http://localhost:8080/api', // Asegúrate de que coincida con el puerto de tu backend
    headers: {
        'Content-Type': 'application/json'
    }
})

// 2. Interceptor de Peticiones (Request)
api.interceptors.request.use(
    (config) => {
        // Buscamos el token en el almacenamiento local
        const token = localStorage.getItem('token')

        // Si existe, lo inyectamos en la cabecera de autorización
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// 3. Interceptor de Respuestas (Response)
api.interceptors.response.use(
    (response) => {
        // Si la respuesta es exitosa, simplemente la devolvemos
        return response
    },
    (error) => {
        // Si el backend responde con un 401 (No Autorizado)
        if (error.response && error.response.status === 401) {
            console.warn('Sesión expirada o token inválido')

            // Limpiamos los datos locales para forzar un nuevo inicio de sesión
            localStorage.removeItem('token')
            localStorage.removeItem('usuario')

            // Redirigimos al usuario a la vista de login
            // Usamos window.location.href para asegurar una recarga limpia del estado
            if (window.location.pathname !== '/login') {
                window.location.href = '/login'
            }
        }

        return Promise.reject(error)
    }
)

export default api
