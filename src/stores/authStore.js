import { defineStore } from 'pinia'
import { login as loginService } from '@/services/authService'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        // Inicializamos el estado leyendo directamente de localStorage
        token: localStorage.getItem('token') || null,
        usuario: JSON.parse(localStorage.getItem('usuario')) || null
    }),

    getters: {
        // Un getter para saber rápidamente si hay una sesión activa
        isAuthenticated: (state) => !!state.token
    },

    actions: {
        async login(correo, clave) {
            try {
                // Usamos tu servicio existente
                const data = await loginService(correo, clave)

                if (data.token) {
                    // 1. Actualizamos el estado de Pinia
                    this.token = data.token
                    this.usuario = data.usuario

                    // 2. Persistimos en localStorage
                    localStorage.setItem('token', data.token)
                    localStorage.setItem('usuario', JSON.stringify(data.usuario))
                    localStorage.setItem('loginDateTime', new Date().toISOString())
                }

                return data
            // oxlint-disable-next-line no-useless-catch
            } catch (error) {
                // Lanzamos el error para que el componente LoginView lo maneje (mostrar mensaje, etc)
                throw error
            }
        },

        logout() {
            // Limpiamos el estado
            this.token = null
            this.usuario = null

            // Limpiamos el almacenamiento
            localStorage.removeItem('token')
            localStorage.removeItem('usuario')
            localStorage.removeItem('loginDateTime')
        }
    }
})
