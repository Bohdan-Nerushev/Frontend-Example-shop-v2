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
      customer.value = await customerApi.updateAddress(customer.value.id, data)
      notificationStore.success('Address updated successfully!')
    } catch (err: unknown) {
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
      customer.value = await customerApi.updateInvoiceAddress(customer.value.id, data)
      notificationStore.success('Billing address updated successfully!')
    } catch (err: unknown) {
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
      customer.value = await customerApi.updateCommunicationDetails(customer.value.id, data)
      notificationStore.success('Contact details updated successfully!')
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      const errMsg = axiosError.response?.data?.message || 'Failed to update contact details'
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
  }
})
