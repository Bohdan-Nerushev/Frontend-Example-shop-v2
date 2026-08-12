<script setup lang="ts">
import { onMounted, ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCustomerStore } from '../stores/customer.store'
import { useAuthStore } from '../stores/auth.store'
import { useContractStore } from '../stores/contract.store'
import { useNotificationStore } from '../stores/notification.store'
import { useConfirmDialog } from '../composables/useConfirmDialog'
import { useNotification } from '../composables/useNotification'
import { formatDate, formatCurrency } from '../utils/formatters'
import { isValidEmail, isValidPhone } from '../utils/validators'
import AppSpinner from '../components/common/AppSpinner.vue'
import AppAlert from '../components/common/AppAlert.vue'
import AppButton from '../components/common/AppButton.vue'
import AppModal from '../components/common/AppModal.vue'
import AppInput from '../components/common/AppInput.vue'
import ContractStatusBadge from '../components/contract/ContractStatusBadge.vue'
import CustomerStatusBadge from '../components/customer/CustomerStatusBadge.vue'
import type { AddressRequest, CommunicationDetails } from '../types/customer'
import type { InvoiceResponse } from '../types/invoice'
import { billingApi } from '../api/billingApi'

type TabId = 'profile' | 'billing'

const router = useRouter()
const customerStore = useCustomerStore()
const authStore = useAuthStore()
const contractStore = useContractStore()
const confirmDialog = useConfirmDialog()
const notification = useNotification()

// ── Tab state ─────────────────────────────────────────────────────────────────
const activeTab = ref<TabId>('profile')

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'profile',   label: 'Profile',             icon: '👤' },
  { id: 'billing',   label: 'Contracts & Billing', icon: '📄' },
]

// ── Save confirmation modal state ─────────────────────────────────────────────
const isSaveConfirmModalOpen = ref(false)
const saveConfirmData = ref<{
  title: string
  changes: { field: string; oldVal: string; newVal: string }[]
  onConfirm: () => Promise<void> | void
} | null>(null)

const executeSaveWithConfirmation = async () => {
  if (!saveConfirmData.value) return
  isSaveConfirmModalOpen.value = false
  await saveConfirmData.value.onConfirm()
}

// ── Loading flags ──────────────────────────────────────────────────────────────
const activeContractLoadingId = ref<string | null>(null)
const addressSaving = ref(false)
const invoiceAddressSaving = ref(false)
const contactSaving = ref(false)
const invoiceLoading = ref(false)
const invoice = ref<InvoiceResponse | null>(null)
const invoiceError = ref<string | null>(null)

// ── Address form state ─────────────────────────────────────────────────────────
const addressForm = reactive<AddressRequest>({
  street: '', number: '', postcode: '', city: '', country: '',
})
const invoiceAddressForm = reactive<AddressRequest>({
  street: '', number: '', postcode: '', city: '', country: '',
})
const contactForm = reactive<CommunicationDetails>({
  email: '', telephone: '',
})

const addressErrors = ref<Partial<Record<keyof AddressRequest, string>>>({})
const invoiceAddressErrors = ref<Partial<Record<keyof AddressRequest, string>>>({})
const contactErrors = ref<Partial<Record<keyof CommunicationDetails, string>>>({})
const useSameInvoiceAddress = ref(true)

const populateForms = () => {
  const c = customerStore.customer
  if (!c) return

  // Main address
  addressForm.street   = c.address?.street   ?? ''
  addressForm.number   = c.address?.number   ?? ''
  addressForm.postcode = c.address?.postcode ?? ''
  addressForm.city     = c.address?.city     ?? ''
  addressForm.country  = c.address?.country  ?? ''

  // Determine if Billing Address is identical to Main Address
  const inv = c.invoiceAddress
  const hasInvoice = inv && (
    (inv.street ?? '').trim() !== (c.address?.street ?? '').trim() ||
    (inv.number ?? '').trim() !== (c.address?.number ?? '').trim() ||
    (inv.postcode ?? '').trim() !== (c.address?.postcode ?? '').trim() ||
    (inv.city ?? '').trim() !== (c.address?.city ?? '').trim() ||
    (inv.country ?? '').trim() !== (c.address?.country ?? '').trim()
  )
  useSameInvoiceAddress.value = !hasInvoice

  // Invoice address (fallback to main if null)
  const invToShow = inv ?? c.address
  invoiceAddressForm.street   = invToShow?.street   ?? ''
  invoiceAddressForm.number   = invToShow?.number   ?? ''
  invoiceAddressForm.postcode = invToShow?.postcode ?? ''
  invoiceAddressForm.city     = invToShow?.city     ?? ''
  invoiceAddressForm.country  = invToShow?.country  ?? ''

  // Contact
  contactForm.email     = c.communicationDetails?.email     ?? ''
  contactForm.telephone = c.communicationDetails?.telephone ?? ''
}

// ── Lifecycle ──────────────────────────────────────────────────────────────────
onMounted(async () => {
  await customerStore.fetchCustomerProfile()
  if (customerStore.customer) {
    populateForms()
    await contractStore.fetchContracts()
  }
})

watch(() => customerStore.customer, (newVal) => {
  if (newVal) {
    populateForms()
  }
}, { deep: true })

const isAddressChanged = computed(() => {
  const c = customerStore.customer
  if (!c || !c.address) return false
  return (
    addressForm.street.trim() !== (c.address.street ?? '').trim() ||
    addressForm.number.trim() !== (c.address.number ?? '').trim() ||
    addressForm.postcode.trim() !== (c.address.postcode ?? '').trim() ||
    addressForm.city.trim() !== (c.address.city ?? '').trim() ||
    addressForm.country.trim() !== (c.address.country ?? '').trim()
  )
})

const isInvoiceAddressChanged = computed(() => {
  const c = customerStore.customer
  if (!c) return false
  const inv = c.invoiceAddress ?? c.address ?? {}
  return (
    invoiceAddressForm.street.trim() !== (inv.street ?? '').trim() ||
    invoiceAddressForm.number.trim() !== (inv.number ?? '').trim() ||
    invoiceAddressForm.postcode.trim() !== (inv.postcode ?? '').trim() ||
    invoiceAddressForm.city.trim() !== (inv.city ?? '').trim() ||
    invoiceAddressForm.country.trim() !== (inv.country ?? '').trim()
  )
})

const isContactChanged = computed(() => {
  const c = customerStore.customer
  if (!c || !c.communicationDetails) return false
  return (
    contactForm.email.trim().toLowerCase() !== (c.communicationDetails.email ?? '').trim().toLowerCase() ||
    contactForm.telephone.trim() !== (c.communicationDetails.telephone ?? '').trim()
  )
})

const copiedField = ref<string | null>(null)
const notificationStore = useNotificationStore()

const copyText = async (text: string | null | undefined, fieldId: string, fieldLabel: string) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(String(text).trim())
    copiedField.value = fieldId
    notificationStore.success(`Field "${fieldLabel}" copied successfully!`)
    setTimeout(() => {
      if (copiedField.value === fieldId) {
        copiedField.value = null
      }
    }, 2000)
  } catch (err) {
    console.error('Failed to copy text: ', err)
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const validateAddress = (form: AddressRequest) => {
  const errs: Partial<Record<keyof AddressRequest, string>> = {}
  
  if (!form.street.trim()) {
    errs.street = 'Street is required'
  } else if (form.street.length > 250) {
    errs.street = 'Street must not exceed 250 characters'
  }

  if (!form.number.trim()) {
    errs.number = 'Number is required'
  } else if (form.number.length > 100) {
    errs.number = 'Number must not exceed 100 characters'
  }

  if (!form.postcode.trim()) {
    errs.postcode = 'Postcode is required'
  } else if (form.postcode.length > 100) {
    errs.postcode = 'Postcode must not exceed 100 characters'
  } else if (!/^\d+$/.test(form.postcode)) {
    errs.postcode = 'Must contain only digits'
  }

  if (!form.city.trim()) {
    errs.city = 'City is required'
  } else if (form.city.length > 100) {
    errs.city = 'City must not exceed 100 characters'
  }

  if (!form.country.trim()) {
    errs.country = 'Country is required'
  } else if (form.country.length < 2 || form.country.length > 100) {
    errs.country = 'Country must be between 2 and 100 characters'
  }

  return errs
}

const validateContact = (form: CommunicationDetails) => {
  const errs: Partial<Record<keyof CommunicationDetails, string>> = {}
  
  if (!form.email.trim()) {
    errs.email = 'Email is required'
  } else if (!isValidEmail(form.email)) {
    errs.email = 'Provide a valid email address'
  } else if (form.email.length > 255) {
    errs.email = 'Email must not exceed 255 characters'
  }

  if (!form.telephone.trim()) {
    errs.telephone = 'Phone number is required'
  } else if (!isValidPhone(form.telephone)) {
    errs.telephone = 'Length 5-30, digits, spaces or hyphens only'
  }

  return errs
}

// ── Address handlers ───────────────────────────────────────────────────────────
const handleInvoiceAddressToggle = async () => {
  if (useSameInvoiceAddress.value) {
    invoiceAddressForm.street = addressForm.street
    invoiceAddressForm.number = addressForm.number
    invoiceAddressForm.postcode = addressForm.postcode
    invoiceAddressForm.city = addressForm.city
    invoiceAddressForm.country = addressForm.country

    invoiceAddressSaving.value = true
    try {
      await customerStore.updateInvoiceAddress({ ...addressForm })
      notification.success('Billing Address synchronized with Main Address successfully!')
    } catch (e) {
      console.error('Failed to sync invoice address', e)
    } finally {
      invoiceAddressSaving.value = false
    }
  }
}

const handleSaveAddress = () => {
  addressErrors.value = validateAddress(addressForm)
  if (Object.keys(addressErrors.value).length > 0) return

  const c = customerStore.customer
  if (!c) return

  const oldAddr = c.address || {}
  const changes: { field: string; oldVal: string; newVal: string }[] = []
  const fields: { key: keyof AddressRequest; label: string }[] = [
    { key: 'street', label: 'Street' },
    { key: 'number', label: 'Number' },
    { key: 'postcode', label: 'Postcode' },
    { key: 'city', label: 'City' },
    { key: 'country', label: 'Country' }
  ]

  fields.forEach(({ key, label }) => {
    const oldVal = oldAddr[key] ?? ''
    const newVal = addressForm[key] ?? ''
    if (oldVal !== newVal) {
      changes.push({ field: `Main Address -> ${label}`, oldVal, newVal })
    }
  })

  if (changes.length === 0) {
    notification.info('No changes detected.')
    return
  }

  saveConfirmData.value = {
    title: 'Confirm Main Address Changes',
    changes,
    onConfirm: async () => {
      addressSaving.value = true
      try {
        await customerStore.updateAddress({ ...addressForm })
        if (useSameInvoiceAddress.value) {
          await customerStore.updateInvoiceAddress({ ...addressForm })
        }
      } catch {
        // handled in store
      } finally {
        addressSaving.value = false
      }
    }
  }
  isSaveConfirmModalOpen.value = true
}

const handleSaveInvoiceAddress = () => {
  invoiceAddressErrors.value = validateAddress(invoiceAddressForm)
  if (Object.keys(invoiceAddressErrors.value).length > 0) return

  const c = customerStore.customer
  if (!c) return

  const oldAddr = c.invoiceAddress || c.address || {}
  const changes: { field: string; oldVal: string; newVal: string }[] = []
  const fields: { key: keyof AddressRequest; label: string }[] = [
    { key: 'street', label: 'Street' },
    { key: 'number', label: 'Number' },
    { key: 'postcode', label: 'Postcode' },
    { key: 'city', label: 'City' },
    { key: 'country', label: 'Country' }
  ]

  fields.forEach(({ key, label }) => {
    const oldVal = oldAddr[key] ?? ''
    const newVal = invoiceAddressForm[key] ?? ''
    if (oldVal !== newVal) {
      changes.push({ field: `Billing Address -> ${label}`, oldVal, newVal })
    }
  })

  if (changes.length === 0) {
    notification.info('No changes detected.')
    return
  }

  saveConfirmData.value = {
    title: 'Confirm Billing Address Changes',
    changes,
    onConfirm: async () => {
      invoiceAddressSaving.value = true
      try {
        await customerStore.updateInvoiceAddress({ ...invoiceAddressForm })
      } catch {
        // handled in store
      } finally {
        invoiceAddressSaving.value = false
      }
    }
  }
  isSaveConfirmModalOpen.value = true
}

// ── Contact handler ────────────────────────────────────────────────────────────
const handleSaveContact = () => {
  contactErrors.value = validateContact(contactForm)
  if (Object.keys(contactErrors.value).length > 0) return

  const c = customerStore.customer
  if (!c) return

  const oldEmail = c.communicationDetails?.email ?? ''
  const oldPhone = c.communicationDetails?.telephone ?? ''

  const changes: { field: string; oldVal: string; newVal: string }[] = []
  if (oldEmail !== contactForm.email) {
    changes.push({ field: 'Email Address', oldVal: oldEmail, newVal: contactForm.email })
  }
  if (oldPhone !== contactForm.telephone) {
    changes.push({ field: 'Telephone', oldVal: oldPhone, newVal: contactForm.telephone })
  }

  if (changes.length === 0) {
    notification.info('No changes detected.')
    return
  }

  saveConfirmData.value = {
    title: 'Confirm Contact Details Changes',
    changes,
    onConfirm: async () => {
      contactSaving.value = true
      try {
        await customerStore.updateCommunication({ ...contactForm })
      } catch {
        // handled in store
      } finally {
        contactSaving.value = false
      }
    }
  }
  isSaveConfirmModalOpen.value = true
}

// ── Contract handlers ──────────────────────────────────────────────────────────
const handleActivateContract = async (contractId: string) => {
  activeContractLoadingId.value = contractId
  try {
    await contractStore.activate(contractId)
    notification.success('Contract activated!')
  } catch {
    notification.error('Failed to activate contract.')
  } finally {
    activeContractLoadingId.value = null
  }
}

// ── Invoice handler ────────────────────────────────────────────────────────────
const handleGenerateInvoice = async () => {
  if (!customerStore.customer) return
  invoiceLoading.value = true
  invoiceError.value = null
  invoice.value = null
  try {
    invoice.value = await billingApi.generateInvoice({ customerId: customerStore.customer.id })
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    invoiceError.value = e.response?.data?.message ?? 'Failed to generate invoice.'
  } finally {
    invoiceLoading.value = false
  }
}

// ── Profile activation / deactivation / delete ────────────────────────────────
const deleteConfirmText = ref('')
const isProfileActive = computed(() => customerStore.customer?.status === 'ACTIVE')

const handleActivateProfile = async () => {
  try {
    await customerStore.activate()
  } catch {
    // handled in store
  }
}

const handleToggleProfileStatus = async (event: Event) => {
  const checkbox = event.target as HTMLInputElement
  const shouldBeActive = checkbox.checked

  if (shouldBeActive) {
    await handleActivateProfile()
  } else {
    const confirmed = await confirmDialog.confirm({
      title: 'Deactivate Profile',
      message: 'Are you sure you want to deactivate your profile? You cannot purchase new subscriptions while deactivated.',
      confirmText: 'Deactivate',
      cancelText: 'Keep Active',
    })
    if (confirmed) {
      try {
        await customerStore.deactivate()
      } catch {
        checkbox.checked = true
      }
    } else {
      checkbox.checked = true
    }
  }
}

const isDeleteModalOpen = ref(false)

const handleDeleteProfile = () => {
  deleteConfirmText.value = ''
  isDeleteModalOpen.value = true
}

const executeDeleteProfile = async () => {
  if (deleteConfirmText.value !== 'delete') return
  try {
    await customerStore.deleteProfile()
    isDeleteModalOpen.value = false
    authStore.logout()
  } catch {
    // handled in store
  }
}

const goToProducts = () => {
  router.push({ name: 'products', query: customerStore.customer ? { brand: customerStore.customer.brand } : {} })
}

const goToRegister = () => router.push({ name: 'register' })
</script>

<template>
  <div class="dashboard-view">

    <!-- LOADING -->
    <div v-if="customerStore.loading && !customerStore.customer" class="center-state">
      <AppSpinner size="lg" />
      <span class="muted">Loading your profile…</span>
    </div>

    <!-- NO PROFILE -->
    <div v-else-if="!customerStore.customer" class="no-profile-card">
      <div class="no-profile-icon">👤</div>
      <h2 class="no-profile-title">No Customer Profile Found</h2>
      <p class="no-profile-desc">
        You are logged in, but you don't have a registered shop profile yet.
        Create one to start purchasing subscriptions.
      </p>
      <AppButton variant="primary" @click="goToRegister">
        Register Customer Profile
      </AppButton>
    </div>

    <!-- MAIN DASHBOARD -->
    <template v-else>

      <!-- Header -->
      <header class="dash-header">
        <div class="dash-header-info">
          <div class="avatar">{{ (customerStore.customer.firstName?.[0] ?? '?').toUpperCase() }}</div>
          <div>
            <h1 class="dash-title">
              {{ customerStore.customer.firstName }} {{ customerStore.customer.lastName }}
            </h1>
            <div class="dash-meta">
              <CustomerStatusBadge :status="customerStore.customer.status" />
              <span class="meta-sep">·</span>
              <span class="meta-text">{{ customerStore.customer.brand }}</span>
              <span class="meta-sep">·</span>
              <span class="meta-text">ID: {{ customerStore.customer.id }}</span>
            </div>
          </div>
        </div>
        <AppButton variant="secondary" size="sm" @click="goToProducts">
          Browse Plans
        </AppButton>
      </header>

      <!-- Tab Navigation -->
      <nav class="tab-nav">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </nav>

      <!-- ── Tab: Profile ─────────────────────────────────────────────────── -->
      <section v-if="activeTab === 'profile'" class="tab-content">
        <!-- Personal Information -->
        <div class="profile-section">
          <h2 class="section-title">Personal Information</h2>
          <div class="info-grid" style="margin-bottom: 1.5rem;">
            <div class="info-item">
              <span class="info-label">First Name</span>
              <span class="info-value">{{ customerStore.customer.firstName }}</span>
              <button
                type="button"
                class="info-copy-btn"
                :class="{ 'copied': copiedField === 'firstName' }"
                @click="copyText(customerStore.customer.firstName, 'firstName', 'First Name')"
                :title="copiedField === 'firstName' ? 'Copied!' : 'Copy First Name'"
              >
                <svg v-if="copiedField === 'firstName'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="info-copy-icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="info-copy-icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376A8.965 8.965 0 0 0 12 12.75c-.197 0-.39.024-.577.07m.577 4.43a8.98 8.98 0 0 0 3-1.832m0 0a8.967 8.967 0 0 1-3.375-3.375m3.375 3.375V10.5m-3.375 3.375H9" />
                </svg>
              </button>
            </div>
            <div class="info-item">
              <span class="info-label">Last Name</span>
              <span class="info-value">{{ customerStore.customer.lastName }}</span>
              <button
                type="button"
                class="info-copy-btn"
                :class="{ 'copied': copiedField === 'lastName' }"
                @click="copyText(customerStore.customer.lastName, 'lastName', 'Last Name')"
                :title="copiedField === 'lastName' ? 'Copied!' : 'Copy Last Name'"
              >
                <svg v-if="copiedField === 'lastName'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="info-copy-icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="info-copy-icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376A8.965 8.965 0 0 0 12 12.75c-.197 0-.39.024-.577.07m.577 4.43a8.98 8.98 0 0 0 3-1.832m0 0a8.967 8.967 0 0 1-3.375-3.375m3.375 3.375V10.5m-3.375 3.375H9" />
                </svg>
              </button>
            </div>
            <div class="info-item">
              <span class="info-label">Date of Birth</span>
              <span class="info-value">{{ formatDate(customerStore.customer.birthDate) }}</span>
              <button
                type="button"
                class="info-copy-btn"
                :class="{ 'copied': copiedField === 'birthDate' }"
                @click="copyText(formatDate(customerStore.customer.birthDate), 'birthDate', 'Date of Birth')"
                :title="copiedField === 'birthDate' ? 'Copied!' : 'Copy Date of Birth'"
              >
                <svg v-if="copiedField === 'birthDate'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="info-copy-icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="info-copy-icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376A8.965 8.965 0 0 0 12 12.75c-.197 0-.39.024-.577.07m.577 4.43a8.98 8.98 0 0 0 3-1.832m0 0a8.967 8.967 0 0 1-3.375-3.375m3.375 3.375V10.5m-3.375 3.375H9" />
                </svg>
              </button>
            </div>
            <div class="info-item">
              <span class="info-label">Brand</span>
              <span class="info-value">{{ customerStore.customer.brand }}</span>
              <button
                type="button"
                class="info-copy-btn"
                :class="{ 'copied': copiedField === 'brand' }"
                @click="copyText(customerStore.customer.brand, 'brand', 'Brand')"
                :title="copiedField === 'brand' ? 'Copied!' : 'Copy Brand'"
              >
                <svg v-if="copiedField === 'brand'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="info-copy-icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="info-copy-icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376A8.965 8.965 0 0 0 12 12.75c-.197 0-.39.024-.577.07m.577 4.43a8.98 8.98 0 0 0 3-1.832m0 0a8.967 8.967 0 0 1-3.375-3.375m3.375 3.375V10.5m-3.375 3.375H9" />
                </svg>
              </button>
            </div>
            <div class="info-item">
              <span class="info-label">Status</span>
              <CustomerStatusBadge :status="customerStore.customer.status" />
              <button
                type="button"
                class="info-copy-btn"
                :class="{ 'copied': copiedField === 'status' }"
                @click="copyText(customerStore.customer.status, 'status', 'Status')"
                :title="copiedField === 'status' ? 'Copied!' : 'Copy Status'"
              >
                <svg v-if="copiedField === 'status'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="info-copy-icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="info-copy-icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376A8.965 8.965 0 0 0 12 12.75c-.197 0-.39.024-.577.07m.577 4.43a8.98 8.98 0 0 0 3-1.832m0 0a8.967 8.967 0 0 1-3.375-3.375m3.375 3.375V10.5m-3.375 3.375H9" />
                </svg>
              </button>
            </div>
            <div class="info-item">
              <span class="info-label">Customer ID</span>
              <span class="info-value info-value--mono">{{ customerStore.customer.id }}</span>
              <button
                type="button"
                class="info-copy-btn"
                :class="{ 'copied': copiedField === 'id' }"
                @click="copyText(customerStore.customer.id, 'id', 'Customer ID')"
                :title="copiedField === 'id' ? 'Copied!' : 'Copy Customer ID'"
              >
                <svg v-if="copiedField === 'id'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="info-copy-icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="info-copy-icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376A8.965 8.965 0 0 0 12 12.75c-.197 0-.39.024-.577.07m.577 4.43a8.98 8.98 0 0 0 3-1.832m0 0a8.967 8.967 0 0 1-3.375-3.375m3.375 3.375V10.5m-3.375 3.375H9" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="divider" style="margin: 2rem 0; opacity: 0.2;"></div>

        <!-- Contact Details -->
        <div class="profile-section">
          <h2 class="section-title">Contact Details</h2>
          <div class="form-grid" style="max-width: 520px; margin-bottom: 1.25rem;">
            <AppInput
              v-model="contactForm.email"
              label="Email Address"
              type="email"
              :error="contactErrors.email"
              placeholder="your.email@gmx.de"
              class="full-width"
              copyable
            />
            <AppInput
              v-model="contactForm.telephone"
              label="Telephone"
              type="tel"
              :error="contactErrors.telephone"
              placeholder="+4915123456789"
              class="full-width"
              copyable
            />
          </div>
          <AppButton variant="primary" :loading="contactSaving" :disabled="!isContactChanged" @click="handleSaveContact" style="margin-bottom: 0.5rem;">
            Save Contact Details
          </AppButton>
        </div>

        <div class="divider" style="margin: 2rem 0; opacity: 0.2;"></div>

        <!-- Addresses -->
        <div class="profile-section">
          <!-- Main Address -->
          <div class="address-block" style="margin-bottom: 2rem;">
            <h2 class="section-title">Main Address</h2>
            <div class="form-grid" style="margin-bottom: 1.25rem;">
              <AppInput v-model="addressForm.street"   label="Street"   :error="addressErrors.street"   placeholder="Main Street" copyable />
              <AppInput v-model="addressForm.number"   label="Number"   :error="addressErrors.number"   placeholder="12a" copyable />
              <AppInput v-model="addressForm.postcode" label="Postcode" :error="addressErrors.postcode" placeholder="10115" copyable />
              <AppInput v-model="addressForm.city"     label="City"     :error="addressErrors.city"     placeholder="Berlin" copyable />
              <AppInput v-model="addressForm.country"  label="Country"  :error="addressErrors.country"  placeholder="Germany" class="full-width" copyable />
            </div>
            <AppButton variant="primary" :loading="addressSaving" :disabled="!isAddressChanged" @click="handleSaveAddress">
              Save Main Address
            </AppButton>
          </div>

          <div class="divider" style="margin: 1.5rem 0; opacity: 0.1;"></div>

          <!-- Billing / Invoice Address -->
          <div class="address-block">
            <h2 class="section-title">Billing Address</h2>
            
            <div class="checkbox-row" style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
              <input
                id="dashboard-same-address-checkbox"
                type="checkbox"
                v-model="useSameInvoiceAddress"
                @change="handleInvoiceAddressToggle"
                class="app-checkbox"
              />
              <label for="dashboard-same-address-checkbox" class="checkbox-label" style="font-size: 0.9rem; color: var(--color-text-main); cursor: pointer; user-select: none;">
                Billing Address такаж як Main Address
              </label>
            </div>

            <div v-if="!useSameInvoiceAddress">
              <div class="form-grid" style="margin-bottom: 1.25rem;">
                <AppInput v-model="invoiceAddressForm.street"   label="Street"   :error="invoiceAddressErrors.street"   placeholder="Main Street" copyable />
                <AppInput v-model="invoiceAddressForm.number"   label="Number"   :error="invoiceAddressErrors.number"   placeholder="12a" copyable />
                <AppInput v-model="invoiceAddressForm.postcode" label="Postcode" :error="invoiceAddressErrors.postcode" placeholder="10115" copyable />
                <AppInput v-model="invoiceAddressForm.city"     label="City"     :error="invoiceAddressErrors.city"     placeholder="Berlin" copyable />
                <AppInput v-model="invoiceAddressForm.country"  label="Country"  :error="invoiceAddressErrors.country"  placeholder="Germany" class="full-width" copyable />
              </div>
              <AppButton variant="primary" :loading="invoiceAddressSaving" :disabled="!isInvoiceAddressChanged" @click="handleSaveInvoiceAddress">
                Save Billing Address
              </AppButton>
            </div>
          </div>
        </div>

        <div class="divider" style="margin: 2rem 0; opacity: 0.2;"></div>

        <!-- Security & Account -->
        <div class="profile-section">
          <h2 class="section-title">Security & Account</h2>
          <div class="danger-grid" style="margin-top: 1.25rem;">
            <!-- Account Status Toggle -->
            <div class="danger-card danger-card--info">
              <div class="danger-card-text">
                <h3 class="danger-card-title">Account Status</h3>
                <p class="danger-card-desc">
                  Toggle your account status. While inactive, you cannot make purchases, but your existing contracts remain active.
                </p>
                <div :class="['status-badge', isProfileActive ? 'status-badge--active' : 'status-badge--inactive']">
                  {{ customerStore.customer?.status || 'UNKNOWN' }}
                </div>
              </div>
              <label class="switch" title="Toggle Account Status">
                <input 
                  type="checkbox" 
                  :checked="isProfileActive" 
                  :disabled="customerStore.loading"
                  @change="handleToggleProfileStatus"
                />
                <span class="slider round"></span>
              </label>
            </div>

            <!-- Delete -->
            <div class="danger-card danger-card--danger">
              <div class="danger-card-text">
                <h3 class="danger-card-title">Delete Account</h3>
                <p class="danger-card-desc">
                  Permanently delete your profile and all related data. This action cannot be undone.
                </p>
              </div>
              <AppButton 
                variant="danger" 
                :disabled="customerStore.loading" 
                @click="handleDeleteProfile"
              >
                Delete Account
              </AppButton>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Tab: Contracts & Billing ─────────────────────────────────────── -->
      <section v-else-if="activeTab === 'billing'" class="tab-content">
        <!-- Contracts list section -->
        <div class="contracts-section" style="margin-bottom: 3rem;">
          <div class="section-header">
            <h2 class="section-title">My Contracts</h2>
            <AppButton variant="secondary" size="sm" @click="goToProducts">
              Buy New Plan
            </AppButton>
          </div>

          <div v-if="contractStore.loading && contractStore.contracts.length === 0" class="center-state">
            <AppSpinner size="md" />
          </div>

          <div v-else-if="contractStore.contracts.length === 0" class="empty-box">
            <p class="muted">You have no contracts yet.</p>
            <AppButton variant="primary" size="sm" @click="goToProducts" style="margin-top: 0.75rem;">
              Explore Plans
            </AppButton>
          </div>

          <div v-else class="contracts-list">
            <div
              v-for="contract in contractStore.contracts"
              :key="contract.id"
              class="contract-row"
            >
              <div class="contract-row-info">
                <ContractStatusBadge :status="contract.status" />
                <div>
                  <p class="contract-id">Contract <span class="mono">{{ contract.id }}</span></p>
                  <p class="contract-meta">
                    Product: <span class="mono">{{ contract.productId }}</span>
                    · Created: {{ formatDate(contract.creationDate) }}
                  </p>
                </div>
              </div>
              <AppButton
                v-if="contract.status === 'INACTIVE'"
                variant="primary"
                size="sm"
                :loading="activeContractLoadingId === contract.id"
                @click="handleActivateContract(contract.id)"
              >
                Activate
              </AppButton>
              <span v-else class="active-label">Active ✓</span>
            </div>
          </div>
        </div>

        <div class="divider" style="margin: 2.5rem 0; opacity: 0.2;"></div>

        <!-- Invoice section -->
        <div class="invoice-section">
          <div class="section-header">
            <h2 class="section-title">Invoice</h2>
            <AppButton variant="primary" :loading="invoiceLoading" @click="handleGenerateInvoice">
              Generate Invoice
            </AppButton>
          </div>

          <AppAlert v-if="invoiceError" type="error" :message="invoiceError" style="margin-bottom: 1rem;" />

          <div v-if="invoice" class="invoice-card">
            <div class="invoice-header">
              <div>
                <p class="invoice-label">Invoice Date</p>
                <p class="invoice-value">{{ formatDate(invoice.invoiceDate) }}</p>
              </div>
              <div>
                <p class="invoice-label">Brand</p>
                <p class="invoice-value">{{ invoice.brand }}</p>
              </div>
              <div>
                <p class="invoice-label">Customer ID</p>
                <p class="invoice-value mono">{{ invoice.customerId }}</p>
              </div>
            </div>

            <div class="invoice-items">
              <h3 class="invoice-subtitle">Line Items</h3>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Contract Date</th>
                    <th>Setup Fee</th>
                    <th>Monthly Fee</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in invoice.items" :key="item.contractId">
                    <td>{{ item.productName }}</td>
                    <td>{{ formatDate(item.contractCreationDate) }}</td>
                    <td>{{ formatCurrency(item.setupFee) }}</td>
                    <td>{{ formatCurrency(item.monthlyFee) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="invoice-totals">
              <div class="total-row">
                <span>Total Setup Fee</span>
                <span>{{ formatCurrency(invoice.totalSetupFee) }}</span>
              </div>
              <div class="total-row">
                <span>Total Monthly Fee</span>
                <span>{{ formatCurrency(invoice.totalMonthlyFee) }}</span>
              </div>
              <div v-if="invoice.discount > 0" class="total-row total-row--discount">
                <span>Discount</span>
                <span>– {{ formatCurrency(invoice.discount) }}</span>
              </div>
              <div class="total-row total-row--grand">
                <span>Total Amount</span>
                <span>{{ formatCurrency(invoice.totalAmount) }}</span>
              </div>
            </div>
          </div>

          <div v-else-if="!invoiceLoading" class="empty-box">
            <p class="muted">Click "Generate Invoice" to see your billing summary.</p>
          </div>
        </div>
      </section>

    </template>

    <!-- Confirm dialog modal -->
    <AppModal
      :open="confirmDialog.isOpen.value"
      :title="confirmDialog.title.value"
      @close="confirmDialog.handleCancel"
    >
      <p style="margin: 0;">{{ confirmDialog.message.value }}</p>
      <template #actions>
        <AppButton variant="secondary" @click="confirmDialog.handleCancel">
          {{ confirmDialog.cancelText.value }}
        </AppButton>
        <AppButton variant="danger" @click="confirmDialog.handleConfirm">
          {{ confirmDialog.confirmText.value }}
        </AppButton>
      </template>
    </AppModal>

    <!-- Custom Delete Profile Confirmation Modal -->
    <AppModal
      :open="isDeleteModalOpen"
      title="Delete Account Permanently"
      @close="isDeleteModalOpen = false"
    >
      <div class="delete-modal-content">
        <p class="delete-warning-text" style="margin: 0 0 1rem; color: var(--color-error); font-weight: 600;">
          WARNING: This permanently deletes your customer profile and all related data. This cannot be undone.
        </p>
        <div class="delete-confirmation-field">
          <label for="delete-confirm-modal-input" class="delete-confirm-label">
            To confirm, type <strong class="delete-keyword">delete</strong> below:
          </label>
          <input
            id="delete-confirm-modal-input"
            v-model="deleteConfirmText"
            type="text"
            placeholder="Type delete to confirm"
            class="delete-confirm-input"
            style="width: 100%; margin-top: 0.5rem;"
          />
        </div>
      </div>
      <template #actions>
        <AppButton variant="secondary" @click="isDeleteModalOpen = false">
          Cancel
        </AppButton>
        <AppButton
          variant="danger"
          :disabled="deleteConfirmText !== 'delete' || customerStore.loading"
          @click="executeDeleteProfile"
        >
          Delete Permanently
        </AppButton>
      </template>
    </AppModal>

    <!-- Save Confirmation Modal -->
    <AppModal
      :open="isSaveConfirmModalOpen"
      :title="saveConfirmData?.title || 'Confirm Changes'"
      @close="isSaveConfirmModalOpen = false"
    >
      <div class="save-confirm-modal-content">
        <p style="margin: 0 0 1rem; font-weight: 500;">
          Are you sure you want to change your details? Below is a summary of the detected changes:
        </p>
        
        <div class="changes-list-wrapper" style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1rem; max-height: 350px; overflow-y: auto;">
          <div 
            v-for="(change, idx) in saveConfirmData?.changes" 
            :key="idx"
            style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--color-border); border-radius: 0.5rem; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem;"
          >
            <div>
              <span style="font-size: 0.75rem; color: var(--color-text-muted); font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 0.15rem;">Field Name</span>
              <span style="font-size: 0.95rem; font-weight: bold; color: var(--color-primary);">{{ change.field }}</span>
            </div>
            
            <div style="border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 0.5rem; display: flex; flex-direction: column; gap: 0.4rem;">
              <div>
                <span style="font-size: 0.75rem; color: var(--color-text-muted); font-weight: 600; text-transform: uppercase; display: inline-block; width: 85px;">Old Value:</span>
                <span style="font-size: 0.95rem; color: var(--color-text-muted); text-decoration: line-through; word-break: break-all;">
                  {{ change.oldVal || '(empty)' }}
                </span>
              </div>
              <div>
                <span style="font-size: 0.75rem; color: var(--color-text-muted); font-weight: 600; text-transform: uppercase; display: inline-block; width: 85px;">New Value:</span>
                <span style="font-size: 0.95rem; color: var(--color-success); font-weight: bold; word-break: break-all;">
                  {{ change.newVal || '(empty)' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #actions>
        <AppButton variant="secondary" @click="isSaveConfirmModalOpen = false">
          Cancel
        </AppButton>
        <AppButton
          variant="primary"
          @click="executeSaveWithConfirmation"
        >
          Confirm & Save
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────────────── */
.dashboard-view {
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1.5rem 4rem;
  width: 100%;
}

.center-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 6rem 0;
}

.muted {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

/* ── No profile card ──────────────────────────────────────────────────────── */
.no-profile-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 3rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}

.no-profile-icon { font-size: 3.5rem; }
.no-profile-title { margin: 0; font-size: 1.5rem; font-weight: 750; }
.no-profile-desc  { color: var(--color-text-muted); font-size: 0.9rem; line-height: 1.6; max-width: 480px; margin: 0; }

/* ── Header ───────────────────────────────────────────────────────────────── */
.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.dash-header-info {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.avatar {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
  color: #fff;
  font-size: 1.5rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dash-title {
  margin: 0 0 0.3rem;
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--color-text-main);
}

.dash-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.meta-sep { color: var(--color-border); }
.meta-text { font-size: 0.8rem; color: var(--color-text-muted); }

/* ── Tab navigation ───────────────────────────────────────────────────────── */
.tab-nav {
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 2rem;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 0;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.625rem 1rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.2s, border-color 0.2s;
  margin-bottom: -1px;
}

.tab-btn:hover { color: var(--color-text-main); }

.tab-btn--active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.tab-icon { font-size: 1rem; }

/* ── Tab content ──────────────────────────────────────────────────────────── */
.tab-content { animation: fadeIn 0.2s ease; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.section-title {
  font-size: 1.25rem;
  font-weight: 750;
  color: var(--color-text-main);
  margin: 0 0 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

/* ── Info grid (Profile tab) ──────────────────────────────────────────────── */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

.info-item {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 0.5rem;
  padding: 0.875rem 2.5rem 0.875rem 1rem;
}

.info-copy-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s, transform 0.1s;
  user-select: none;
  outline: none;
}

.info-copy-btn:hover {
  color: var(--color-text-main);
  transform: scale(1.15);
}

.info-copy-btn:active {
  transform: scale(0.95);
}

.info-copy-btn.copied {
  color: var(--color-success);
}

.info-copy-icon {
  width: 1.25rem;
  height: 1.25rem;
  stroke: currentColor;
}

.info-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}

.info-value {
  font-size: 0.95rem;
  color: var(--color-text-main);
  font-weight: 500;
}

.info-value--mono { font-family: monospace; font-size: 0.8rem; word-break: break-all; }

/* ── Contracts list ───────────────────────────────────────────────────────── */
.contracts-list { display: flex; flex-direction: column; gap: 0.75rem; }

.contract-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  padding: 1rem 1.25rem;
}

.contract-row-info { display: flex; align-items: center; gap: 1rem; }
.contract-id  { margin: 0; font-size: 0.875rem; color: var(--color-text-main); font-weight: 600; }
.contract-meta { margin: 0.2rem 0 0; font-size: 0.78rem; color: var(--color-text-muted); }
.mono { font-family: monospace; }
.active-label { font-size: 0.8rem; color: var(--color-success); font-weight: 600; white-space: nowrap; }

/* ── Empty box ────────────────────────────────────────────────────────────── */
.empty-box {
  background: var(--color-bg-card);
  border: 1px dashed var(--color-border);
  border-radius: 0.5rem;
  padding: 3rem 2rem;
  text-align: center;
}

/* ── Address / Form grid ──────────────────────────────────────────────────── */
.address-block { margin-bottom: 1.5rem; }

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.full-width { grid-column: 1 / -1; }

.divider {
  height: 1px;
  background: var(--color-border);
  margin: 2rem 0;
}

/* ── Invoice ──────────────────────────────────────────────────────────────── */
.invoice-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  overflow: hidden;
}

.invoice-header {
  display: flex;
  gap: 2rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}

.invoice-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-muted); margin: 0 0 0.25rem; }
.invoice-value { font-size: 0.9rem; color: var(--color-text-main); font-weight: 600; margin: 0; }

.invoice-items { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--color-border); }
.invoice-subtitle { font-size: 1rem; font-weight: 700; margin: 0 0 1rem; color: var(--color-text-main); }

.items-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.items-table th { text-align: left; padding: 0.5rem 0.75rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); }
.items-table td { padding: 0.625rem 0.75rem; color: var(--color-text-main); }
.items-table tr:hover td { background: rgba(255,255,255,0.02); }

.invoice-totals { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
.total-row { display: flex; justify-content: space-between; font-size: 0.875rem; color: var(--color-text-muted); }
.total-row--discount { color: var(--color-success); }
.total-row--grand { font-size: 1.05rem; font-weight: 800; color: var(--color-text-main); border-top: 1px solid var(--color-border); padding-top: 0.75rem; margin-top: 0.25rem; }

/* ── Danger zone ──────────────────────────────────────────────────────────── */
.danger-grid { display: flex; flex-direction: column; gap: 1rem; }

.danger-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  padding: 1.25rem 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid;
}

.danger-card--info    { background: rgba(56, 189, 248, 0.05); border-color: rgba(56, 189, 248, 0.15); }
.danger-card--warning { background: rgba(245, 158, 11, 0.05); border-color: rgba(245, 158, 11, 0.15); }
.danger-card--danger  { background: rgba(239, 68, 68, 0.05);  border-color: rgba(239, 68, 68, 0.15); }

.danger-card-title { margin: 0 0 0.3rem; font-size: 1rem; font-weight: 700; color: var(--color-text-main); }
.danger-card-desc  { margin: 0; font-size: 0.85rem; color: var(--color-text-muted); line-height: 1.5; }

/* Toggle Switch styling */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #334155;
  transition: .4s;
  border: 1px solid var(--color-border);
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: #f8fafc;
  transition: .4s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

input:checked + .slider {
  background-color: var(--color-success);
  border-color: rgba(16, 185, 129, 0.3);
}

input:focus + .slider {
  box-shadow: 0 0 1px var(--color-success);
}

input:checked + .slider:before {
  transform: translateX(24px);
}

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  margin-top: 0.5rem;
}

.status-badge--active {
  background-color: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-badge--inactive {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.delete-confirmation-field {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.delete-confirm-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.delete-keyword {
  color: var(--color-error);
  background: rgba(239, 68, 68, 0.1);
  padding: 0.1rem 0.3rem;
  border-radius: 0.25rem;
  font-family: monospace;
}

.delete-confirm-input {
  max-width: 320px;
  padding: 0.5rem 0.75rem;
  background: var(--color-bg-main);
  border: 1px solid var(--color-border);
  color: var(--color-text-main);
  border-radius: 0.375rem;
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.delete-confirm-input:focus {
  outline: none;
  border-color: var(--color-error);
}

@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
  .danger-card { flex-direction: column; align-items: flex-start; }
  .dash-header { flex-direction: column; align-items: flex-start; }
  .tab-nav { gap: 0; }
  .tab-btn { padding: 0.5rem 0.75rem; font-size: 0.8rem; }
  .contract-row { flex-direction: column; align-items: flex-start; }
}
</style>
