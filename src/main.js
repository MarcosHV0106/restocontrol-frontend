import { createApp } from 'vue'
import { createPinia } from 'pinia'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import App from './App.vue'
import router from './router'

import { inicializarTema } from '@/services/temaService'
import '@/assets/css/foundation.css'
import '@/assets/css/tema.css'

inicializarTema()


const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
