import { defineStore } from 'pinia'
import { ref } from 'vue'
import { shopApi } from '../api/shopApi'
import type { ProductResponse } from '../types/product'
import type { Brand } from '../types/api'
import { useNotificationStore } from './notification.store'

export const useProductStore = defineStore('product', () => {
  const products = ref<ProductResponse[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  
  const notificationStore = useNotificationStore()

  const fetchProducts = async (brand?: Brand) => {
    loading.value = true
    error.value = null
    try {
      products.value = await shopApi.getProducts(brand)
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      const errMsg = axiosError.response?.data?.message || 'Failed to load products'
      error.value = errMsg
      notificationStore.error(errMsg)
    } finally {
      loading.value = false
    }
  }

  return {
    products,
    loading,
    error,
    fetchProducts,
  }
})
