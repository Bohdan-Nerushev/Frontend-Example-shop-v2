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

// Response Interceptor: handle 401 Unauthorized errors and log detailed errors
http.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log detailed error information for diagnostics
    const requestUrl = error.config?.url || 'unknown'
    const requestMethod = error.config?.method?.toUpperCase() || 'unknown'
    const responseStatus = error.response?.status
    const errorData = error.response?.data

    console.error(`[API Error] ${requestMethod} ${requestUrl} failed with status ${responseStatus || 'network error'}`, {
      correlationId: errorData?.correlationId,
      errorCode: errorData?.errorCode,
      message: errorData?.message || error.message,
      timestamp: errorData?.timestamp,
      fullError: error
    })

    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
      // Redirect to login page, avoiding router circular dependencies
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default http
