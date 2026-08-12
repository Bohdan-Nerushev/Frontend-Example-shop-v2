import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { customerApi } from '../api/customerApi'
import type { CustomerRequest, CustomerResponse, AddressRequest, CommunicationDetails } from '../types/customer'
import { useNotificationStore } from './notification.store'

export const useCustomerStore = defineStore('customer', () => {
  const customer = ref<CustomerResponse | null>(null)
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  const notificationStore = useNotificationStore()

  const hasProfile = computed(() => customer.value !== null)

  const logDetailedError = (context: string, err: unknown) => {
    const axiosError = err as {
      message?: string
      response?: {
        status?: number
        data?: any
        headers?: any
      }
      request?: any
    }
    console.error(`[CustomerStore] Detailed error during ${context}:`, {
      message: axiosError.message,
      status: axiosError.response?.status,
      data: axiosError.response?.data,
      headers: axiosError.response?.headers,
      hasRequest: !!axiosError.request,
    })
  }

  const fetchCustomerProfile = async () => {
    loading.value = true
    error.value = null
    try {
      customer.value = await customerApi.getCustomer()
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number; data?: { message?: string } } }
      // 404 is a normal case meaning the user has authenticated via Keycloak 
      // but has not created a shop customer profile yet.
      if (axiosError.response?.status === 404) {
        customer.value = null
      } else {
        logDetailedError('fetchCustomerProfile', err)
        const errMsg = axiosError.response?.data?.message || 'Failed to fetch customer profile'
        error.value = errMsg
        notificationStore.error(errMsg)
      }
    } finally {
      loading.value = false
    }
  }

  const register = async (data: CustomerRequest) => {
    loading.value = true
    error.value = null
    try {
      customer.value = await customerApi.registerCustomer(data)
      notificationStore.success('Profile registered successfully!')
    } catch (err: unknown) {
      logDetailedError('register', err)
      const axiosError = err as { response?: { data?: { message?: string } } }
      const errMsg = axiosError.response?.data?.message || 'Registration failed'
      error.value = errMsg
      notificationStore.error(errMsg)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateAddress = async (data: AddressRequest) => {
    if (!customer.value) throw new Error('No active customer profile found')
    loading.value = true
    error.value = null
    try {
      await customerApi.updateAddress(customer.value.id, data)
      await fetchCustomerProfile()
      notificationStore.success('Address updated successfully!')
    } catch (err: unknown) {
      logDetailedError('updateAddress', err)
      const axiosError = err as { response?: { data?: { message?: string } } }
      const errMsg = axiosError.response?.data?.message || 'Failed to update address'
      error.value = errMsg
      notificationStore.error(errMsg)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateInvoiceAddress = async (data: AddressRequest) => {
    if (!customer.value) throw new Error('No active customer profile found')
    loading.value = true
    error.value = null
    try {
      await customerApi.updateInvoiceAddress(customer.value.id, data)
      await fetchCustomerProfile()
      notificationStore.success('Billing address updated successfully!')
    } catch (err: unknown) {
      logDetailedError('updateInvoiceAddress', err)
      const axiosError = err as { response?: { data?: { message?: string } } }
      const errMsg = axiosError.response?.data?.message || 'Failed to update billing address'
      error.value = errMsg
      notificationStore.error(errMsg)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateCommunication = async (data: CommunicationDetails) => {
    if (!customer.value) throw new Error('No active customer profile found')
    loading.value = true
    error.value = null
    try {
      await customerApi.updateCommunicationDetails(customer.value.id, data)
      await fetchCustomerProfile()
      notificationStore.success('Contact details updated successfully!')
    } catch (err: unknown) {
      logDetailedError('updateCommunication', err)
      const axiosError = err as { response?: { data?: { message?: string } } }
      const errMsg = axiosError.response?.data?.message || 'Failed to update contact details'
      error.value = errMsg
      notificationStore.error(errMsg)
      throw err
    } finally {
      loading.value = false
    }
  }

  const activate = async () => {
    if (!customer.value) return
    loading.value = true
    error.value = null
    try {
      await customerApi.activateCustomer(customer.value.id)
      await fetchCustomerProfile()
      notificationStore.success('Profile activated successfully!')
    } catch (err: unknown) {
      logDetailedError('activate', err)
      const axiosError = err as { response?: { data?: { message?: string } } }
      const errMsg = axiosError.response?.data?.message || 'Failed to activate profile'
      error.value = errMsg
      notificationStore.error(errMsg)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deactivate = async () => {
    if (!customer.value) return
    loading.value = true
    error.value = null
    try {
      await customerApi.deactivateCustomer(customer.value.id)
      await fetchCustomerProfile()
      notificationStore.success('Profile deactivated successfully!')
    } catch (err: unknown) {
      logDetailedError('deactivate', err)
      const axiosError = err as { response?: { data?: { message?: string } } }
      const errMsg = axiosError.response?.data?.message || 'Failed to deactivate profile'
      error.value = errMsg
      notificationStore.error(errMsg)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteProfile = async () => {
    if (!customer.value) return
    loading.value = true
    error.value = null
    try {
      await customerApi.deleteCustomer(customer.value.id)
      customer.value = null
      notificationStore.success('Profile deleted successfully!')
    } catch (err: unknown) {
      logDetailedError('deleteProfile', err)
      const axiosError = err as { response?: { data?: { message?: string } } }
      const errMsg = axiosError.response?.data?.message || 'Failed to delete profile'
      error.value = errMsg
      notificationStore.error(errMsg)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    customer,
    loading,
    error,
    hasProfile,
    fetchCustomerProfile,
    register,
    updateAddress,
    updateInvoiceAddress,
    updateCommunication,
    activate,
    deactivate,
    deleteProfile,
  }
})

