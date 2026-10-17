<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCustomerStore } from '../stores/customer.store'
import { useForm } from '../composables/useForm'
import { isValidEmail, isValidPhone } from '../utils/validators'
import AddressForm from '../components/customer/AddressForm.vue'
import CommunicationDetailsForm from '../components/customer/CommunicationDetailsForm.vue'
import AppButton from '../components/common/AppButton.vue'
import AppAlert from '../components/common/AppAlert.vue'
import AppSpinner from '../components/common/AppSpinner.vue'
import type { AddressRequest, CommunicationDetails } from '../types/customer'

const router = useRouter()
const customerStore = useCustomerStore()
const isPageReady = ref(false)

// Address Form setup
const {
  form: addressForm,
  errors: addressErrors,
  isSubmitting: isSubmittingAddress,
  handleSubmit: submitAddressForm,
} = useForm<AddressRequest>(
  {
    street: '',
    number: '',
    postcode: '',
    city: '',
    country: '',
  },
  (values) => {
    const errs: Record<string, string> = {}
    if (!values.street.trim()) errs.street = 'Street is required'
    if (!values.number.trim()) errs.number = 'Number is required'
    if (!values.postcode.trim()) {
      errs.postcode = 'Postcode is required'
    } else if (!/^\d+$/.test(values.postcode)) {
      errs.postcode = 'Postcode must be numeric'
    }
    if (!values.city.trim()) errs.city = 'City is required'
    if (!values.country.trim()) errs.country = 'Country is required'
    return errs
  }
)

// Billing Address Form setup
const {
  form: invoiceAddressForm,
  errors: invoiceAddressErrors,
  isSubmitting: isSubmittingInvoiceAddress,
  handleSubmit: submitInvoiceAddressForm,
} = useForm<AddressRequest>(
  {
    street: '',
    number: '',
    postcode: '',
    city: '',
    country: '',
  },
  (values) => {
    const errs: Record<string, string> = {}
    if (!values.street.trim()) errs.street = 'Street is required'
    if (!values.number.trim()) errs.number = 'Number is required'
    if (!values.postcode.trim()) {
      errs.postcode = 'Postcode is required'
    } else if (!/^\d+$/.test(values.postcode)) {
      errs.postcode = 'Postcode must be numeric'
    }
    if (!values.city.trim()) errs.city = 'City is required'
    if (!values.country.trim()) errs.country = 'Country is required'
    return errs
  }
)

// Contacts Form setup
const {
  form: communicationForm,
  errors: communicationErrors,
  isSubmitting: isSubmittingComm,
  handleSubmit: submitCommunicationForm,
} = useForm<CommunicationDetails>(
  {
    email: '',
    telephone: '',
  },
  (values) => {
    const errs: Record<string, string> = {}
    if (!values.email.trim()) {
      errs.email = 'Email is required'
    } else if (!isValidEmail(values.email)) {
      errs.email = 'Provide a valid email address'
    }

    if (!values.telephone.trim()) {
      errs.telephone = 'Phone is required'
    } else if (!isValidPhone(values.telephone)) {
      errs.telephone = 'Length 5-30, digits, spaces, hyphens only'
    }
    return errs
  }
)

// Initialize form values from Pinia Store
const initializeForms = () => {
  const profile = customerStore.customer
  if (profile) {
    addressForm.value = { ...profile.address }
    communicationForm.value = { ...profile.communicationDetails }
    
    if (profile.invoiceAddress) {
      invoiceAddressForm.value = { ...profile.invoiceAddress }
    } else {
      // Setup blank default
      invoiceAddressForm.value = {
        street: '',
        number: '',
        postcode: '',
        city: '',
        country: '',
      }
    }
    isPageReady.value = true
  }
}

onMounted(async () => {
  if (!customerStore.customer) {
    await customerStore.fetchCustomerProfile()
  }
  
  if (!customerStore.customer) {
    // If profile still doesn't exist, redirect to dashboard
    router.push({ name: 'dashboard' })
  } else {
    initializeForms()
  }
})

// Submit Handlers
const onSaveAddress = () => {
  submitAddressForm(async (values) => {
    await customerStore.updateAddress(values)
  })
}

const onSaveInvoiceAddress = () => {
  submitInvoiceAddressForm(async (values) => {
    await customerStore.updateInvoiceAddress(values)
  })
}

const onSaveCommunication = () => {
  submitCommunicationForm(async (values) => {
    await customerStore.updateCommunication(values)
  })
}

const goBack = () => {
  router.push({ name: 'dashboard' })
}
</script>

<template>
  <div class="edit-profile-view">
    <header class="edit-header">
      <div>
        <AppButton variant="secondary" @click="goBack" style="margin-bottom: 1rem; padding: 0.4rem 0.8rem; font-size: 0.8rem;">
          ← Back to Dashboard
        </AppButton>
        <h1 class="view-title">Edit Profile Details</h1>
        <p class="view-subtitle">Modify your postal address, billing address, and contact information below.</p>
      </div>
    </header>

    <!-- LOADING SCREEN -->
    <div v-if="!isPageReady" class="spinner-container">
      <AppSpinner size="lg" />
      <span class="loading-text">Loading profile forms...</span>
    </div>

    <!-- FORMS VIEW -->
    <div v-else class="forms-wrapper">
      
      <!-- API Error Alert -->
      <AppAlert v-if="customerStore.error" type="error" :message="customerStore.error" style="margin-bottom: 1.5rem;" />

      <!-- Form 1: Registered Address -->
      <section class="edit-section">
        <h3 class="section-title">Registered Address</h3>
        <p class="section-desc">Your official home or company location.</p>
        <div class="section-body">
          <AddressForm v-model="addressForm" :errors="addressErrors" required />
          <AppButton
            :loading="isSubmittingAddress"
            variant="primary"
            style="align-self: flex-start; margin-top: 1.25rem;"
            @click="onSaveAddress"
          >
            Save Address
          </AppButton>
        </div>
      </section>

      <!-- Form 2: Billing Address -->
      <section class="edit-section">
        <h3 class="section-title">Billing Address</h3>
        <p class="section-desc">The address printed on your invoices.</p>
        <div class="section-body">
          <AddressForm v-model="invoiceAddressForm" :errors="invoiceAddressErrors" required />
          <AppButton
            :loading="isSubmittingInvoiceAddress"
            variant="primary"
            style="align-self: flex-start; margin-top: 1.25rem;"
            @click="onSaveInvoiceAddress"
          >
            Save Billing Address
          </AppButton>
        </div>
      </section>

      <!-- Form 3: Communication Details -->
      <section class="edit-section">
        <h3 class="section-title">Communication Details</h3>
        <p class="section-desc">Your telephone number and primary email for correspondence.</p>
        <div class="section-body">
          <CommunicationDetailsForm v-model="communicationForm" :errors="communicationErrors" required />
          <AppButton
            :loading="isSubmittingComm"
            variant="primary"
            style="align-self: flex-start; margin-top: 1.25rem;"
            @click="onSaveCommunication"
          >
            Save Contact Details
          </AppButton>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
.edit-profile-view {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1.5rem;
  width: 100%;
}

.edit-header {
  border-bottom: 1px solid var(--color-border, #333);
  padding-bottom: 1.5rem;
  margin-bottom: 2rem;
}

.view-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-text-main, #fff);
  margin: 0 0 0.5rem 0;
}

.view-subtitle {
  font-size: 0.95rem;
  color: var(--color-text-muted, #94a3b8);
  margin: 0;
}

.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 6rem 0;
}

.loading-text {
  font-size: 0.9rem;
  color: var(--color-text-muted, #94a3b8);
}

.forms-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.edit-section {
  background-color: var(--color-bg-card, #1e1e1e);
  border: 1px solid var(--color-border, #333);
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.section-title {
  margin: 0 0 0.25rem 0;
  font-size: 1.2rem;
  font-weight: 750;
  color: var(--color-text-main, #fff);
}

.section-desc {
  margin: 0 0 1.5rem 0;
  font-size: 0.85rem;
  color: var(--color-text-muted, #94a3b8);
}

.section-body {
  display: flex;
  flex-direction: column;
}
</style>
