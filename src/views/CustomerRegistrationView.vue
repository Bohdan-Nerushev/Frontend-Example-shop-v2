<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCustomerStore } from '../stores/customer.store'
import { useAuthStore } from '../stores/auth.store'
import { useForm } from '../composables/useForm'
import { isValidEmail, isValidPhone, isValidBirthDate } from '../utils/validators'
import AddressForm from '../components/customer/AddressForm.vue'
import CommunicationDetailsForm from '../components/customer/CommunicationDetailsForm.vue'
import AppInput from '../components/common/AppInput.vue'
import AppSelect from '../components/common/AppSelect.vue'
import AppButton from '../components/common/AppButton.vue'
import AppAlert from '../components/common/AppAlert.vue'
import { Brand } from '../types/api'
import type { CustomerRequest, AddressRequest } from '../types/customer'

const router = useRouter()
const customerStore = useCustomerStore()
const authStore = useAuthStore()

onMounted(() => {
  // Clear any stale tokens/session from memory before registration
  authStore.clearAuth()
  customerStore.customer = null
})

const brandOptions = [
  { label: 'GMX Mail', value: Brand.GMX },
  { label: 'WEB.DE', value: Brand.WEB_DE },
  { label: 'Mail.com', value: Brand.MAIL_COM },
]

const useSameAddress = ref(true)
const isRegistered = ref(false)
const registeredId = ref('')

// Initialize blank address state helper
const createBlankAddress = (): AddressRequest => ({
  street: '',
  number: '',
  postcode: '',
  city: '',
  country: '',
})

const confirmPassword = ref('')
const confirmPasswordError = ref('')

// Setup reactive form state using useForm composable
const {
  form: customerForm,
  errors: formErrors,
  isSubmitting,
  handleSubmit,
} = useForm<CustomerRequest>(
  {
    firstName: '',
    lastName: '',
    birthDate: '',
    brand: Brand.GMX,
    address: createBlankAddress(),
    invoiceAddress: null,
    communicationDetails: {
      email: '',
      telephone: '',
    },
    password: '',
  },
  (values) => {
    const errs: Record<string, any> = {}

    // 1. General validations
    if (!values.firstName.trim()) errs.firstName = 'First name is required'
    if (!values.lastName.trim()) errs.lastName = 'Last name is required'
    if (!values.birthDate) {
      errs.birthDate = 'Birth date is required'
    } else if (!isValidBirthDate(values.birthDate)) {
      errs.birthDate = 'Please select a valid birth date in the past'
    }

    // 2. Main Address validations
    const addrErrs: Record<string, string> = {}
    if (!values.address.street.trim()) addrErrs.street = 'Street is required'
    if (!values.address.number.trim()) addrErrs.number = 'Number is required'
    if (!values.address.postcode.trim()) {
      addrErrs.postcode = 'Postcode is required'
    } else if (!/^\d+$/.test(values.address.postcode)) {
      addrErrs.postcode = 'Must contain only digits'
    }
    if (!values.address.city.trim()) addrErrs.city = 'City is required'
    if (!values.address.country.trim()) addrErrs.country = 'Country is required'
    if (Object.keys(addrErrs).length > 0) {
      errs.address = addrErrs
    }

    // 3. Billing Address validations (if separate)
    if (!useSameAddress.value && values.invoiceAddress) {
      const invAddrErrs: Record<string, string> = {}
      if (!values.invoiceAddress.street.trim()) invAddrErrs.street = 'Street is required'
      if (!values.invoiceAddress.number.trim()) invAddrErrs.number = 'Number is required'
      if (!values.invoiceAddress.postcode.trim()) {
        invAddrErrs.postcode = 'Postcode is required'
      } else if (!/^\d+$/.test(values.invoiceAddress.postcode)) {
        invAddrErrs.postcode = 'Must contain only digits'
      }
      if (!values.invoiceAddress.city.trim()) invAddrErrs.city = 'City is required'
      if (!values.invoiceAddress.country.trim()) invAddrErrs.country = 'Country is required'
      if (Object.keys(invAddrErrs).length > 0) {
        errs.invoiceAddress = invAddrErrs
      }
    }

    // 4. Communication Details validations
    const commErrs: Record<string, string> = {}
    if (!values.communicationDetails.email.trim()) {
      commErrs.email = 'Email is required'
    } else if (!isValidEmail(values.communicationDetails.email)) {
      commErrs.email = 'Provide a valid email address'
    }

    if (!values.communicationDetails.telephone.trim()) {
      commErrs.telephone = 'Phone number is required'
    } else if (!isValidPhone(values.communicationDetails.telephone)) {
      commErrs.telephone = 'Length 5-30, digits, spaces or hyphens only'
    }
    if (Object.keys(commErrs).length > 0) {
      errs.communicationDetails = commErrs
    }

    // 5. Password validations
    let hasPasswordError = false
    if (!values.password) {
      errs.password = 'Password is required'
      hasPasswordError = true
    } else if (values.password.length < 6) {
      errs.password = 'Password must be at least 6 characters'
      hasPasswordError = true
    }

    if (!confirmPassword.value) {
      confirmPasswordError.value = 'Please confirm your password'
      hasPasswordError = true
    } else if (values.password !== confirmPassword.value) {
      confirmPasswordError.value = 'Passwords do not match'
      hasPasswordError = true
    } else {
      confirmPasswordError.value = ''
    }

    if (hasPasswordError && !errs.password) {
      errs.password = 'Invalid password confirmation'
    }

    return errs
  }
)

// Handle changes to the "use same address" checkbox
const handleInvoiceAddressToggle = () => {
  if (useSameAddress.value) {
    customerForm.value.invoiceAddress = null
  } else {
    customerForm.value.invoiceAddress = createBlankAddress()
  }
}

const onRegisterSubmit = () => {
  handleSubmit(async (values) => {
    try {
      await customerStore.register(values)
      if (customerStore.customer) {
        registeredId.value = customerStore.customer.id
        isRegistered.value = true
      }
    } catch (e) {
      console.error('Registration failed', e)
    }
  })
}

const goToLogin = () => {
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="registration-container">
    <div class="registration-card">
      
      <!-- SUCCESS STATE -->
      <div v-if="isRegistered" class="success-state">
        <div class="success-icon">🎉</div>
        <h2 class="success-title">Profile Created!</h2>
        <p class="success-desc">
          Your profile has been created successfully. To complete registration and buy packages, please log in and activate your account.
        </p>
        <div class="customer-id-box">
          <span class="id-label">Your Customer ID:</span>
          <code class="id-value">{{ registeredId }}</code>
        </div>
        <AppButton variant="primary" style="width: 100%; margin-top: 1rem;" @click="goToLogin">
          Proceed to Login & Activation
        </AppButton>
      </div>

      <!-- FORM STATE -->
      <template v-else>
        <header class="form-header">
          <h2 class="form-title">Customer Registration</h2>
          <p class="form-subtitle">Create your account to start managing subscriptions.</p>
        </header>

        <!-- API Error Alert -->
        <AppAlert v-if="customerStore.error" type="error" :message="customerStore.error" style="margin-bottom: 1.5rem;" />

        <form @submit.prevent="onRegisterSubmit" class="registration-form">
          
          <!-- Section 1: General Info -->
          <div class="form-section">
            <h3 class="section-title">1. General Information</h3>
            <div class="form-row">
              <AppInput
                v-model="customerForm.firstName"
                :error="formErrors.firstName"
                label="First Name"
                autocomplete="given-name"
                required
              />
              <AppInput
                v-model="customerForm.lastName"
                :error="formErrors.lastName"
                label="Last Name"
                autocomplete="family-name"
                required
              />
            </div>
            <div class="form-row">
              <AppInput
                v-model="customerForm.birthDate"
                :error="formErrors.birthDate"
                type="date"
                label="Date of Birth"
                autocomplete="bday"
                required
              />
              <AppSelect
                v-model="customerForm.brand"
                :options="brandOptions"
                label="Provider Brand"
              />
            </div>
          </div>

          <!-- Section 1.5: Security / Password -->
          <div class="form-section">
            <h3 class="section-title">Password Creation</h3>
            <div class="form-row">
              <AppInput
                v-model="customerForm.password"
                :error="formErrors.password"
                type="password"
                label="Password"
                autocomplete="new-password"
                required
              />
              <AppInput
                v-model="confirmPassword"
                :error="confirmPasswordError"
                type="password"
                label="Confirm Password"
                autocomplete="new-password"
                required
              />
            </div>
          </div>

          <!-- Section 2: Contacts -->
          <div class="form-section">
            <h3 class="section-title">2. Communication Details</h3>
            <CommunicationDetailsForm
              v-model="customerForm.communicationDetails"
              :errors="formErrors.communicationDetails"
              required
            />
          </div>

          <!-- Section 3: Main Address -->
          <div class="form-section">
            <h3 class="section-title">3. Registered Address</h3>
            <AddressForm
              v-model="customerForm.address"
              :errors="formErrors.address"
              required
            />
          </div>

          <!-- Section 4: Billing Address Selection -->
          <div class="form-section">
            <h3 class="section-title">4. Billing Address</h3>
            <div class="checkbox-row">
              <input
                id="same-address-checkbox"
                type="checkbox"
                v-model="useSameAddress"
                @change="handleInvoiceAddressToggle"
                class="app-checkbox"
              />
              <label for="same-address-checkbox" class="checkbox-label">
                My billing address is the same as my registered address
              </label>
            </div>

            <!-- Separate Billing Address Form -->
            <div v-if="!useSameAddress && customerForm.invoiceAddress" class="billing-address-wrapper">
              <AddressForm
                v-model="customerForm.invoiceAddress"
                :errors="formErrors.invoiceAddress"
                required
              />
            </div>
          </div>

          <div class="form-actions" style="display: flex; gap: 1rem;">
            <AppButton
              type="button"
              variant="secondary"
              style="flex: 1; padding: 0.75rem;"
              @click="router.push('/')"
            >
              Cancel
            </AppButton>
            <AppButton
              :loading="isSubmitting"
              type="submit"
              variant="primary"
              style="flex: 1; padding: 0.75rem;"
            >
              Submit Registration
            </AppButton>
          </div>
        </form>
      </template>

    </div>
  </div>
</template>

<style scoped>
.registration-container {
  max-width: 720px;
  margin: 1rem auto;
  padding: 0 1.5rem;
}

.registration-card {
  background-color: var(--color-bg-card, #1e1e1e);
  border: 1px solid var(--color-border, #333);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.25);
}

.form-header {
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 0.5rem;
}

.form-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-text-main, #fff);
}

.form-subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-muted, #94a3b8);
}

.registration-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.section-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-primary, #38bdf8);
  border-left: 3px solid var(--color-primary);
  padding-left: 0.5rem;
}

.form-row {
  display: flex;
  gap: 1.5rem;
  width: 100%;
}

.form-row > * {
  flex: 1;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.app-checkbox {
  width: 1.15rem;
  height: 1.15rem;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.checkbox-label {
  font-size: 0.875rem;
  color: var(--color-text-main);
  cursor: pointer;
}

.billing-address-wrapper {
  background-color: rgba(255, 255, 255, 0.01);
  border: 1px solid rgba(255, 255, 255, 0.03);
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 0.5rem;
}

.form-actions {
  margin-top: 1rem;
}

/* Success State Styles */
.success-state {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem 0;
}

.success-icon {
  font-size: 4rem;
  line-height: 1;
}

.success-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-success, #10b981);
}

.success-desc {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--color-text-muted, #94a3b8);
  margin: 0;
}

.customer-id-box {
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--color-border);
  padding: 1rem;
  border-radius: 6px;
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.id-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.id-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-main);
  word-break: break-all;
}

@media (max-width: 640px) {
  .registration-card {
    padding: 1.5rem;
  }
  .form-row {
    flex-direction: column;
    gap: 1.25rem;
  }
}
</style>
