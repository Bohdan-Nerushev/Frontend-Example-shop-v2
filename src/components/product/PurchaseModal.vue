<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useContractStore } from '../../stores/contract.store'
import { useCustomerStore } from '../../stores/customer.store'
import { formatCurrency, formatStorageSize } from '../../utils/formatters'
import AppModal from '../common/AppModal.vue'
import AppButton from '../common/AppButton.vue'
import AppAlert from '../common/AppAlert.vue'
import type { ProductResponse } from '../../types/product'

const props = defineProps<{
  open: boolean
  product: ProductResponse | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const router = useRouter()
const contractStore = useContractStore()
const customerStore = useCustomerStore()

const isConfirming = ref(false)
const purchaseError = ref<string | null>(null)
const isPurchased = ref(false)

const annualCost = computed(() => {
  if (!props.product) return 0
  return props.product.setupFee + props.product.monthlyFee * 12
})

const formattedStorage = computed(() => {
  if (!props.product?.storageSize) return null
  // ProductCard multiplies by GB — match same logic
  const bytes = props.product.storageSize * 1024 * 1024 * 1024
  const result = formatStorageSize(bytes)
  return result === '-' ? null : result
})

const handleClose = () => {
  purchaseError.value = null
  isPurchased.value = false
  emit('close')
}

const confirmPurchase = async () => {
  if (!props.product) return

  purchaseError.value = null
  isConfirming.value = true
  try {
    await contractStore.purchase(props.product.id)
    isPurchased.value = true
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string }; status?: number } }
    if (axiosError.response?.status === 403 || axiosError.response?.status === 401) {
      purchaseError.value =
        'Your account is not activated. Please activate your account in your profile before purchasing.'
    } else {
      purchaseError.value =
        axiosError.response?.data?.message || 'Purchase failed. Please try again.'
    }
  } finally {
    isConfirming.value = false
  }
}

const goToDashboard = () => {
  handleClose()
  router.push({ name: 'dashboard' })
}
</script>

<template>
  <AppModal :open="open" :title="isPurchased ? 'Order Confirmed!' : 'Confirm Purchase'" @close="handleClose">

    <!-- SUCCESS STATE -->
    <div v-if="isPurchased" class="success-state">
      <div class="success-icon">🎉</div>
      <p class="success-text">
        Your subscription to <strong>{{ product?.name }}</strong> has been purchased successfully.
        It is currently <span class="status-badge">INACTIVE</span> — activate it from your profile.
      </p>
    </div>

    <!-- PURCHASE FORM -->
    <div v-else-if="product" class="purchase-form">
      <div class="product-summary">
        <span class="brand-tag">{{ product.brand }}</span>
        <h3 class="product-name">{{ product.name }}</h3>
        <p v-if="formattedStorage" class="storage-info">
          <span>💾</span> {{ formattedStorage }} Storage
        </p>
      </div>

      <div class="price-breakdown">
        <div class="price-row">
          <span class="price-label">Setup fee <span class="price-note">(once)</span></span>
          <span class="price-value">{{ formatCurrency(product.setupFee) }}</span>
        </div>
        <div class="price-row">
          <span class="price-label">Monthly fee</span>
          <span class="price-value">{{ formatCurrency(product.monthlyFee) }}</span>
        </div>
        <div class="price-divider"></div>
        <div class="price-row price-row--total">
          <span class="price-label">First year total</span>
          <span class="price-value price-value--accent">{{ formatCurrency(annualCost) }}</span>
        </div>
      </div>

      <div v-if="customerStore.customer" class="account-row">
        <span class="account-label">Billing account</span>
        <span class="account-value">{{ customerStore.customer.communicationDetails?.email }}</span>
      </div>

      <AppAlert
        v-if="!customerStore.customer"
        type="warning"
        message="No customer profile found. Please register and log in to purchase."
        style="margin-top: 1rem;"
      />

      <AppAlert
        v-if="purchaseError"
        type="error"
        :message="purchaseError"
        style="margin-top: 1rem;"
      />

      <p class="terms-note">
        The contract will be created as <strong>INACTIVE</strong>. You must activate it manually in your profile.
      </p>
    </div>

    <!-- MODAL FOOTER ACTIONS -->
    <template #actions>
      <template v-if="isPurchased">
        <AppButton variant="secondary" @click="handleClose">
          Stay on Products
        </AppButton>
        <AppButton variant="primary" @click="goToDashboard">
          Go to My Profile
        </AppButton>
      </template>

      <template v-else>
        <AppButton variant="secondary" @click="handleClose">
          Cancel
        </AppButton>
        <AppButton
          variant="primary"
          :loading="isConfirming"
          :disabled="!customerStore.customer"
          @click="confirmPurchase"
        >
          Buy — {{ formatCurrency((product?.setupFee ?? 0) + (product?.monthlyFee ?? 0)) }}
        </AppButton>
      </template>
    </template>
  </AppModal>
</template>

<style scoped>
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  padding: 0.5rem 0 1rem;
}

.success-icon {
  font-size: 3rem;
}

.success-text {
  color: var(--color-text-muted);
  font-size: 0.95rem;
  line-height: 1.6;
}

.success-text strong {
  color: var(--color-text-main);
}

.status-badge {
  display: inline-block;
  background: rgba(245, 158, 11, 0.12);
  color: var(--color-warning);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  letter-spacing: 0.05em;
}

/* Product summary */
.product-summary {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  margin-bottom: 1.25rem;
}

.brand-tag {
  display: inline-block;
  background: rgba(56, 189, 248, 0.1);
  color: var(--color-primary);
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.15rem 0.45rem;
  width: fit-content;
}

.product-name {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--color-text-main);
}

.storage-info {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin: 0;
}

/* Pricing */
.price-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.price-note {
  font-size: 0.75rem;
  opacity: 0.7;
}

.price-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-main);
}

.price-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.07);
  margin: 0.2rem 0;
}

.price-row--total .price-label {
  font-weight: 700;
  color: var(--color-text-main);
  font-size: 0.95rem;
}

.price-value--accent {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--color-primary);
}

/* Account row */
.account-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 0.5rem;
  padding: 0.6rem 0.85rem;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.account-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.account-value {
  font-size: 0.875rem;
  color: var(--color-text-main);
  word-break: break-all;
  text-align: right;
}

/* Terms */
.terms-note {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin: 0.5rem 0 0;
}

.terms-note strong {
  color: var(--color-warning);
}
</style>
