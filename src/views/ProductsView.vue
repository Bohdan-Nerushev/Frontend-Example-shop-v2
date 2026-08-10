<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductStore } from '../stores/product.store'
import { useAuthStore } from '../stores/auth.store'
import ProductCard from '../components/product/ProductCard.vue'
import AppSelect from '../components/common/AppSelect.vue'
import AppSpinner from '../components/common/AppSpinner.vue'
import AppEmptyState from '../components/common/AppEmptyState.vue'
import AppAlert from '../components/common/AppAlert.vue'
import { Brand } from '../types/api'
import type { ProductResponse } from '../types/product'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const authStore = useAuthStore()

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
  { label: 'WEB.DE', value: Brand.WEB_DE },
  { label: 'Mail.com', value: Brand.MAIL_COM },
]

// Load products when component mounts
const loadProducts = () => {
  productStore.fetchProducts(selectedBrand.value)
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

const handlePurchase = (product: ProductResponse) => {
  if (!authStore.isAuthenticated) {
    // Redirect to login flow if guest
    authStore.login()
  } else {
    // If authenticated, go to contracts and pass the product ID as query param
    router.push({
      name: 'contracts',
      query: { buy: product.id },
    })
  }
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
          @purchase="handlePurchase"
        />
      </div>
    </template>
  </div>
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
