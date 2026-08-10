import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useAuthStore } from './stores/auth.store'

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)

  const authStore = useAuthStore()

  try {
    // Initialize authentication before mounting the app
    await authStore.initAuth()
  } catch (error) {
    console.error('Failed to initialize application auth', error)
  }

  app.mount('#app')
}

bootstrap()
