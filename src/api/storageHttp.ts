import axios from 'axios'
import { useAuthStore } from '../stores/auth.store'

const storageHttp = axios.create({
  baseURL: import.meta.env.VITE_STORAGE_BASE_URL || '/storage-api',
})

storageHttp.interceptors.request.use(async (config) => {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) {
    return config
  }

  await authStore.updateToken(10)
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }
  return config
})

export default storageHttp
