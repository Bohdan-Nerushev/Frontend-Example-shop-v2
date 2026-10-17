<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductStore } from '../stores/product.store'
import { useCustomerStore } from '../stores/customer.store'
import { useContractStore } from '../stores/contract.store'
import AppButton from '../components/common/AppButton.vue'
import AppSpinner from '../components/common/AppSpinner.vue'
import AppAlert from '../components/common/AppAlert.vue'
import type { ProductResponse } from '../types/product'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const customerStore = useCustomerStore()
const contractStore = useContractStore()

const product = ref<ProductResponse | null>(null)
const isLoading = ref(true)
const isConfirming = ref(false)
const purchaseError = ref<string | null>(null)
const isPurchased = ref(false)

// Format bytes to human-readable storage size
const formatStorage = (bytes: number): string => {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(0)} GB`
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(0)} MB`
  return `${bytes} bytes`
}

// Format currency with German locale
const formatPrice = (value: number): string =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)

const annualCost = computed(() => {
  if (!product.value) return 0
  return product.value.setupFee + product.value.monthlyFee * 12
})

const loadProduct = async () => {
  const productId = route.query.productId as string
  if (!productId) {
    router.replace({ name: 'products' })
    return
  }

  // Try store cache first to avoid re-fetching
  let found = productStore.products.find((p) => p.id === productId) ?? null

  if (!found) {
    // Products not loaded yet: fetch all and filter
    await productStore.fetchProducts()
    found = productStore.products.find((p) => p.id === productId) ?? null
  }

  product.value = found
  isLoading.value = false
}

const loadCustomerProfile = async () => {
  if (!customerStore.customer) {
    await customerStore.fetchCustomerProfile()
  }
}

onMounted(async () => {
  await Promise.all([loadProduct(), loadCustomerProfile()])
})

const confirmPurchase = async () => {
  if (!product.value) return

  purchaseError.value = null
  isConfirming.value = true
  try {
    await contractStore.purchase(product.value.id)
    isPurchased.value = true
  } catch (err: unknown) {
    const axiosError = err as { response?: { data?: { message?: string }; status?: number } }
    if (axiosError.response?.status === 403 || axiosError.response?.status === 401) {
      purchaseError.value = 'Your account is not activated. Please activate your account before purchasing.'
    } else {
      purchaseError.value = axiosError.response?.data?.message || 'Purchase failed. Please try again.'
    }
  } finally {
    isConfirming.value = false
  }
}

const goToContracts = () => router.push({ name: 'contracts' })
const goBack = () => router.push({ name: 'products' })
</script>

<template>
  <div class="checkout-view">
    <!-- Loading state -->
    <div v-if="isLoading" class="checkout-loading">
      <AppSpinner size="lg" />
      <span class="loading-text">Loading order details…</span>
    </div>

    <!-- Product not found -->
    <div v-else-if="!product" class="checkout-not-found">
      <div class="not-found-icon">🔍</div>
      <h2>Product not found</h2>
      <p class="muted">The product you are trying to purchase could not be found.</p>
      <AppButton variant="primary" @click="goBack">Back to Products</AppButton>
    </div>

    <!-- Purchase success -->
    <div v-else-if="isPurchased" class="checkout-success">
      <div class="success-glow"></div>
      <div class="success-card">
        <div class="success-icon">🎉</div>
        <h2 class="success-title">Order Confirmed!</h2>
        <p class="success-desc">
          Your subscription to <strong>{{ product.name }}</strong> has been purchased successfully.
          To start using it, please activate your contract on the Contracts page.
        </p>
        <div class="success-actions">
          <AppButton variant="primary" style="flex: 1;" @click="goToContracts">
            Go to My Contracts
          </AppButton>
          <AppButton variant="secondary" style="flex: 1;" @click="goBack">
            Back to Products
          </AppButton>
        </div>
      </div>
    </div>

    <!-- Checkout layout -->
    <template v-else>
      <div class="checkout-glow-bg"></div>

      <div class="checkout-layout">
        <!-- Left: Order Summary -->
        <section class="order-summary-card">
          <header class="card-header">
            <span class="card-label">Order Summary</span>
          </header>

          <div class="product-highlight">
            <div class="product-brand-badge">{{ product.brand }}</div>
            <h2 class="product-name">{{ product.name }}</h2>
            <p class="product-storage">
              <span class="storage-icon">💾</span>
              {{ formatStorage(product.storageSize) }} Storage
            </p>
          </div>

          <div class="price-breakdown">
            <div class="price-row">
              <span class="price-label">Setup fee <span class="price-note">(one-time)</span></span>
              <span class="price-value">{{ formatPrice(product.setupFee) }}</span>
            </div>
            <div class="price-row">
              <span class="price-label">Monthly fee</span>
              <span class="price-value">{{ formatPrice(product.monthlyFee) }}</span>
            </div>
            <div class="price-divider"></div>
            <div class="price-row price-row--total">
              <span class="price-label">First year total</span>
              <span class="price-value price-value--total">{{ formatPrice(annualCost) }}</span>
            </div>
          </div>

          <div class="billing-note">
            <span>ℹ️</span>
            After the first year, you will be charged {{ formatPrice(product.monthlyFee) }}/month.
          </div>
        </section>

        <!-- Right: Confirm Panel -->
        <section class="confirm-panel">
          <header class="card-header">
            <span class="card-label">Confirm Your Order</span>
          </header>

          <AppAlert
            v-if="!customerStore.customer"
            type="warning"
            message="Your customer profile could not be loaded. Make sure you are logged in and your account is set up."
            style="margin-bottom: 1.5rem;"
          />

          <AppAlert
            v-if="purchaseError"
            type="error"
            :message="purchaseError"
            style="margin-bottom: 1.5rem;"
          />

          <div class="confirm-details">
            <div class="confirm-row">
              <span class="confirm-label">Plan</span>
              <span class="confirm-value">{{ product.name }}</span>
            </div>
            <div v-if="customerStore.customer" class="confirm-row">
              <span class="confirm-label">Account</span>
              <span class="confirm-value">{{ customerStore.customer.communicationDetails?.email }}</span>
            </div>
            <div class="confirm-row">
              <span class="confirm-label">Billing</span>
              <span class="confirm-value">Monthly — {{ formatPrice(product.monthlyFee) }}/mo</span>
            </div>
            <div class="confirm-row">
              <span class="confirm-label">Activation</span>
              <span class="confirm-value confirm-value--muted">Manual — from Contracts page</span>
            </div>
          </div>

          <div class="terms-notice">
            By confirming, you agree to the subscription terms. The contract starts as INACTIVE and
            must be activated manually.
          </div>

          <div class="confirm-actions">
            <AppButton
              variant="primary"
              style="width: 100%; padding: 0.9rem; font-size: 1rem; font-weight: 700;"
              :loading="isConfirming"
              :disabled="!customerStore.customer"
              @click="confirmPurchase"
            >
              Confirm Purchase — {{ formatPrice(product.setupFee + product.monthlyFee) }}
            </AppButton>
            <AppButton
              variant="secondary"
              style="width: 100%; margin-top: 0.75rem;"
              @click="goBack"
            >
              Cancel
            </AppButton>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.checkout-view {
  position: relative;
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5rem 1rem 4rem;
  min-height: 70vh;
}

.checkout-glow-bg {
  position: fixed;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 700px;
  height: 500px;
  background: radial-gradient(ellipse, rgba(56, 189, 248, 0.06) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.checkout-loading,
.checkout-not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  padding: 8rem 0;
  text-align: center;
}

.loading-text,
.muted {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.not-found-icon {
  font-size: 3.5rem;
}

.checkout-success {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
}

.success-glow {
  position: fixed;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 400px;
  background: radial-gradient(ellipse, rgba(16, 185, 129, 0.1) 0%, transparent 70%);
  pointer-events: none;
}

.success-card {
  position: relative;
  background: rgba(16, 185, 129, 0.05);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 1.25rem;
  padding: 3rem 2.5rem;
  max-width: 520px;
  width: 100%;
  text-align: center;
  backdrop-filter: blur(10px);
  animation: successReveal 0.4s ease-out;
}

@keyframes successReveal {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.success-icon { font-size: 4rem; margin-bottom: 1rem; }
.success-title { font-size: 1.75rem; font-weight: 800; color: var(--color-success); margin-bottom: 1rem; }
.success-desc  { color: var(--color-text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 2rem; }
.success-desc strong { color: var(--color-text-main); }
.success-actions { display: flex; gap: 0.75rem; }

.checkout-layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}

@media (max-width: 768px) {
  .checkout-layout { grid-template-columns: 1fr; }
}

.order-summary-card,
.confirm-panel {
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 1.25rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card-header {
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.card-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-primary);
}

.product-highlight { display: flex; flex-direction: column; gap: 0.5rem; }

.product-brand-badge {
  display: inline-block;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.2);
  color: var(--color-primary);
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0.25rem 0.75rem;
  width: fit-content;
}

.product-name {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-text-main);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.product-storage {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.price-breakdown { display: flex; flex-direction: column; gap: 0.75rem; }

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-label { color: var(--color-text-muted); font-size: 0.9rem; }
.price-note  { font-size: 0.75rem; opacity: 0.7; }
.price-value { color: var(--color-text-main); font-weight: 600; font-size: 0.95rem; }

.price-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 0.25rem 0;
}

.price-row--total .price-label { color: var(--color-text-main); font-weight: 700; font-size: 1rem; }
.price-value--total { font-size: 1.25rem; font-weight: 800; color: var(--color-primary); }

.billing-note {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  padding: 0.75rem;
  line-height: 1.5;
}

.confirm-details { display: flex; flex-direction: column; gap: 0.75rem; }

.confirm-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.confirm-row:last-child { border-bottom: none; padding-bottom: 0; }

.confirm-label {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.confirm-value {
  font-size: 0.9rem;
  color: var(--color-text-main);
  font-weight: 500;
  text-align: right;
  word-break: break-all;
}

.confirm-value--muted { color: var(--color-text-muted); }

.terms-notice {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  line-height: 1.6;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0.5rem;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.confirm-actions { display: flex; flex-direction: column; }
</style>
