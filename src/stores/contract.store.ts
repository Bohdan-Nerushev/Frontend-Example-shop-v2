import { defineStore } from 'pinia'
import { ref } from 'vue'
import { contractApi } from '../api/contractApi'
import { billingApi } from '../api/billingApi'
import type { ContractResponse } from '../types/contract'
import type { InvoiceResponse } from '../types/invoice'
import { useCustomerStore } from './customer.store'
import { useNotificationStore } from './notification.store'

export const useContractStore = defineStore('contract', () => {
  const contracts = ref<ContractResponse[]>([])
  const invoices = ref<InvoiceResponse[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  // Separate loading/error state for PDF download to avoid UI conflict with main loading indicator
  const pdfLoading = ref<boolean>(false)
  const pdfError = ref<string | null>(null)

  const customerStore = useCustomerStore()
  const notificationStore = useNotificationStore()

  const ensureCustomerId = (): string => {
    if (!customerStore.customer?.id) {
      throw new Error('No customer profile loaded. Cannot perform action.')
    }
    return customerStore.customer.id
  }

  const fetchContracts = async () => {
    let customerId: string
    try {
      customerId = ensureCustomerId()
    } catch {
      // If profile is not loaded yet, do not trigger error, just return empty
      contracts.value = []
      return
    }

    loading.value = true
    error.value = null
    try {
      contracts.value = await contractApi.getContracts(customerId)
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      const errMsg = axiosError.response?.data?.message || 'Failed to fetch contracts'
      error.value = errMsg
      notificationStore.error(errMsg)
    } finally {
      loading.value = false
    }
  }

  const purchase = async (productId: string) => {
    const customerId = ensureCustomerId()
    loading.value = true
    error.value = null
    try {
      await contractApi.purchaseProduct(customerId, { productId })
      notificationStore.success('Product subscription purchased successfully! It requires activation.')
      await fetchContracts() // Reload contract list
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      const errMsg = axiosError.response?.data?.message || 'Purchase failed'
      error.value = errMsg
      notificationStore.error(errMsg)
      throw err
    } finally {
      loading.value = false
    }
  }

  const activate = async (contractId: string) => {
    const customerId = ensureCustomerId()
    loading.value = true
    error.value = null
    try {
      await contractApi.activateContract(contractId, customerId)
      notificationStore.success('Contract activated successfully!')
      await fetchContracts() // Reload contract list
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      const errMsg = axiosError.response?.data?.message || 'Contract activation failed'
      error.value = errMsg
      notificationStore.error(errMsg)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchInvoices = async () => {
    const customerId = ensureCustomerId()
    loading.value = true
    error.value = null
    try {
      const invoice = await billingApi.generateInvoice({ customerId })
      invoices.value = [invoice] // Store generated invoice
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      const errMsg = axiosError.response?.data?.message || 'Failed to generate billing details'
      error.value = errMsg
      notificationStore.error(errMsg)
    } finally {
      loading.value = false
    }
  }

  const downloadInvoicePdf = async () => {
    const customerId = ensureCustomerId()
    pdfLoading.value = true
    pdfError.value = null
    try {
      const { blob, filename } = await billingApi.downloadInvoicePdf(customerId)

      // Trigger browser download via a temporary anchor element (standard cross-browser approach)
      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = filename
      anchor.click()
      URL.revokeObjectURL(objectUrl)

      notificationStore.success('Invoice PDF downloaded successfully!')
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      const errMsg = axiosError.response?.data?.message || 'Failed to download invoice PDF'
      pdfError.value = errMsg
      notificationStore.error(errMsg)
    } finally {
      pdfLoading.value = false
    }
  }

  return {
    contracts,
    invoices,
    loading,
    error,
    pdfLoading,
    pdfError,
    fetchContracts,
    purchase,
    activate,
    fetchInvoices,
    downloadInvoicePdf,
  }
})
