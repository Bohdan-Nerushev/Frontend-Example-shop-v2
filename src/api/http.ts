import axios from 'axios'
import { useAuthStore } from '../stores/auth.store'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: add Authorization header and refresh token if needed
http.interceptors.request.use(
  async (config) => {
    const authStore = useAuthStore()

    if (authStore.isAuthenticated) {
      try {
        // Refresh token if it expires in less than 10 seconds
        await authStore.updateToken(10)

        if (authStore.token) {
          config.headers.Authorization = `Bearer ${authStore.token}`
        }
      } catch (error) {
        console.error('Failed to refresh token before request, logging out', error)
        authStore.logout()
        return Promise.reject(error)
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default http
