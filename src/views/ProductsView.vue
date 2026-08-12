<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductStore } from '../stores/product.store'
import { useAuthStore } from '../stores/auth.store'
import { useCustomerStore } from '../stores/customer.store'
import { useContractStore } from '../stores/contract.store'
import ProductCard from '../components/product/ProductCard.vue'
import PurchaseModal from '../components/product/PurchaseModal.vue'
import AppSelect from '../components/common/AppSelect.vue'
import AppSpinner from '../components/common/AppSpinner.vue'
import AppEmptyState from '../components/common/AppEmptyState.vue'
import AppAlert from '../components/common/AppAlert.vue'
import { Brand } from '../types/api'
import type { ProductResponse } from '../types/product'

import { useNotification } from '../composables/useNotification'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const authStore = useAuthStore()
const customerStore = useCustomerStore()
const contractStore = useContractStore()
const notification = useNotification()

const selectedProduct = ref<ProductResponse | null>(null)
const isPurchaseModalOpen = ref(false)

// Read initial brand from URL query or fallback to GMX
const getBrandFromQuery = (): Brand => {
  const queryBrand = route.query.brand as string
  if (Object.values(Brand).includes(queryBrand as Brand)) {
    return queryBrand as Brand
  }
  return Brand.GMX
}

const selectedBrand = ref<Brand>(getBrandFromQuery())

const brandOptions = [
  { label: 'GMX Mail', value: Brand.GMX },
  { label: 'WEB DE', value: Brand.WEB_DE },
  { label: 'Mail Com', value: Brand.MAIL_COM },
]

// Load products and contracts when component mounts
const loadProducts = async () => {
  productStore.fetchProducts(selectedBrand.value)
  if (authStore.isAuthenticated) {
    if (!customerStore.customer) {
      await customerStore.fetchCustomerProfile()
    }
    contractStore.fetchContracts()
  }
}

onMounted(() => {
  loadProducts()
})

// Refetch products and update URL query when brand changes
watch(selectedBrand, (newBrand) => {
  router.replace({ query: { brand: newBrand } })
  loadProducts()
})

// Sync state if URL changes externally (e.g., back navigation)
watch(
  () => route.query.brand,
  () => {
    selectedBrand.value = getBrandFromQuery()
  }
)

const isProductPurchased = (productId: string): boolean => {
  return contractStore.contracts.some(c => c.productId === productId && c.status === 'ACTIVE')
}

const handlePurchase = async (product: ProductResponse) => {
  // If not authenticated, redirect to login with return destination
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: 'products', brand: selectedBrand.value } })
    return
  }
  // Ensure customer profile is loaded before opening modal
  if (!customerStore.customer) {
    await customerStore.fetchCustomerProfile()
  }

  // Check if there is an existing inactive contract we can just activate
  const inactiveContract = contractStore.contracts.find(c => c.productId === product.id && c.status === 'INACTIVE')
  if (inactiveContract) {
    productStore.loading = true
    try {
      await contractStore.activate(inactiveContract.id)
      notification.success('Product subscription activated successfully!')
      await contractStore.fetchContracts()
    } catch {
      notification.error('Failed to activate subscription.')
    } finally {
      productStore.loading = false
    }
    return
  }

  selectedProduct.value = product
  isPurchaseModalOpen.value = true
}

const handleUnsubscribe = async (productId: string) => {
  const activeContracts = contractStore.contracts.filter(c => c.productId === productId && c.status === 'ACTIVE')
  if (activeContracts.length === 0) return
  
  productStore.loading = true
  try {
    for (const contract of activeContracts) {
      await contractStore.terminate(contract.id)
    }
    notification.success('Unsubscribed successfully!')
    await contractStore.fetchContracts()
  } catch {
    notification.error('Failed to unsubscribe.')
  } finally {
    productStore.loading = false
  }
}

const closePurchaseModal = () => {
  isPurchaseModalOpen.value = false
  selectedProduct.value = null
}
</script>

<template>
  <div class="products-view">
    <header class="products-header">
      <div class="header-content">
        <h1 class="view-title">Subscription Plans</h1>
        <p class="view-subtitle">Select your preferred provider and find the perfect package.</p>
      </div>

      <!-- Filter Controls -->
      <div class="filter-controls">
        <label class="filter-label">Filter by Brand:</label>
        <AppSelect v-model="selectedBrand" :options="brandOptions" class="brand-select" />
      </div>
    </header>

    <!-- Error state -->
    <AppAlert v-if="productStore.error" type="error" :message="productStore.error" style="margin-bottom: 2rem;" />

    <!-- Loading state -->
    <div v-if="productStore.loading" class="loading-container">
      <AppSpinner size="lg" />
      <span class="loading-text">Loading available packages...</span>
    </div>

    <!-- Empty state -->
    <template v-else>
      <AppEmptyState
        v-if="productStore.products.length === 0"
        message="No subscription plans available for this brand."
      />

      <!-- Products Grid -->
      <div v-else class="products-grid">
        <ProductCard
          v-for="product in productStore.products"
          :key="product.id"
          :product="product"
          :button-text="isProductPurchased(product.id) ? 'Unsubscribe from next month' : 'Purchase'"
          :variant="isProductPurchased(product.id) ? 'secondary' : 'primary'"
          @purchase="isProductPurchased(product.id) ? handleUnsubscribe(product.id) : handlePurchase(product)"
        />
      </div>
    </template>
  </div>

  <!-- Purchase confirmation modal -->
  <PurchaseModal
    :open="isPurchaseModalOpen"
    :product="selectedProduct"
    @close="closePurchaseModal"
  />
</template>

<style scoped>
.products-view {
  padding: 2rem 0;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.products-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 1px solid var(--color-border, #333);
  padding-bottom: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.view-title {
  font-size: 2.25rem;
  font-weight: 800;
  margin: 0 0 0.5rem 0;
  color: var(--color-text-main, #fff);
  letter-spacing: -0.02em;
}

.view-subtitle {
  font-size: 0.975rem;
  color: var(--color-text-muted, #94a3b8);
  margin: 0;
}

.filter-controls {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  min-width: 200px;
}

.filter-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted, #64748b);
}

.brand-select {
  width: 100%;
}

.loading-container {
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

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
}

@media (max-width: 768px) {
  .products-header {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-controls {
    width: 100%;
  }
}
</style>
