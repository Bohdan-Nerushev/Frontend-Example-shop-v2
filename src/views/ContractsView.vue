<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContractStore } from '../stores/contract.store'
import { useCustomerStore } from '../stores/customer.store'
import { useProductStore } from '../stores/product.store'
import { useNotification } from '../composables/useNotification'
import ContractCard from '../components/contract/ContractCard.vue'
import ProductCard from '../components/product/ProductCard.vue'
import AppButton from '../components/common/AppButton.vue'
import AppSpinner from '../components/common/AppSpinner.vue'
import AppEmptyState from '../components/common/AppEmptyState.vue'
import AppAlert from '../components/common/AppAlert.vue'
import AppModal from '../components/common/AppModal.vue'

const route = useRoute()
const router = useRouter()
const contractStore = useContractStore()
const customerStore = useCustomerStore()
const productStore = useProductStore()
const notification = useNotification()

const isPurchaseModalOpen = ref(false)
const activeContractLoadingId = ref<string | null>(null)
const isBuyingFromUrl = ref(false)

const loadData = async () => {
  // Ensure profile is loaded first because contracts need customer ID
  if (!customerStore.customer) {
    await customerStore.fetchCustomerProfile()
  }

  if (customerStore.customer) {
    await contractStore.fetchContracts()
    
    // Check if redirect contains auto-buy request from ProductsView
    const buyProductId = route.query.buy as string
    if (buyProductId) {
      isBuyingFromUrl.value = true
      try {
        // Clear query parameters first so page refresh doesn't trigger repeat purchase
        router.replace({ query: {} })
        await contractStore.purchase(buyProductId)
      } catch (err) {
        console.error('Auto purchase failed', err)
      } finally {
        isBuyingFromUrl.value = false
      }
    }
  } else {
    // If no profile, redirect to dashboard which shows the "Register profile" callout
    router.push({ name: 'dashboard' })
  }
}

onMounted(() => {
  loadData()
})

const handleActivateContract = async (contractId: string) => {
  activeContractLoadingId.value = contractId
  try {
    await contractStore.activate(contractId)
  } catch (e) {
    console.error('Activation failed', e)
  } finally {
    activeContractLoadingId.value = null
  }
}

const openPurchaseModal = async () => {
  isPurchaseModalOpen.value = true
  if (customerStore.customer) {
    // Fetch products filtered by current customer's brand only
    await productStore.fetchProducts(customerStore.customer.brand)
  }
}

const handleBuyProduct = async (product: any) => {
  isPurchaseModalOpen.value = false
  try {
    await contractStore.purchase(product.id)
  } catch (e) {
    console.error('Purchase failed', e)
  }
}
</script>

<template>
  <div class="contracts-view">
    <header class="contracts-header">
      <div>
        <h1 class="view-title">My Contracts</h1>
        <p class="view-subtitle">View your subscription history, status, and purchase new plans.</p>
      </div>
      <AppButton
        v-if="customerStore.customer"
        variant="primary"
        @click="openPurchaseModal"
      >
        + Purchase Subscription
      </AppButton>
    </header>

    <!-- LOADING STATE (AUTO-BUY OR REGULAR LOAD) -->
    <div v-if="contractStore.loading || isBuyingFromUrl" class="spinner-container">
      <AppSpinner size="lg" />
      <span class="loading-text">
        {{ isBuyingFromUrl ? 'Processing your purchase...' : 'Loading contracts...' }}
      </span>
    </div>

    <template v-else>
      <!-- ERROR STATE -->
      <AppAlert v-if="contractStore.error" type="error" :message="contractStore.error" style="margin-bottom: 2rem;" />

      <!-- EMPTY STATE -->
      <AppEmptyState
        v-if="contractStore.contracts.length === 0"
        message="You do not have any active or inactive contracts yet."
      >
        <template #actions>
          <AppButton variant="secondary" @click="openPurchaseModal">
            Explore Packages
          </AppButton>
        </template>
      </AppEmptyState>

      <!-- CONTRACTS LIST -->
      <div v-else class="contracts-grid">
        <ContractCard
          v-for="contract in contractStore.contracts"
          :key="contract.id"
          :contract="contract"
          :is-activating="activeContractLoadingId === contract.id"
          @activate="handleActivateContract"
        />
      </div>
    </template>

    <!-- MODAL: PURCHASE NEW PRODUCT -->
    <AppModal
      :open="isPurchaseModalOpen"
      title="Purchase New Mail Subscription"
      @close="isPurchaseModalOpen = false"
    >
      <div class="modal-products-container">
        <div v-if="productStore.loading" class="modal-spinner">
          <AppSpinner />
          <p>Loading plans for your provider...</p>
        </div>
        <template v-else>
          <p class="modal-info-text">
            Below are the subscriptions available for your provider (<strong>{{ customerStore.customer?.brand }}</strong>).
          </p>
          <div class="modal-products-list">
            <ProductCard
              v-for="product in productStore.products"
              :key="product.id"
              :product="product"
              button-text="Order Now"
              @purchase="handleBuyProduct"
            />
          </div>
        </template>
      </div>
    </AppModal>
  </div>
</template>

<style scoped>
.contracts-view {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 0 1.5rem;
  width: 100%;
}

.contracts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border, #333);
  padding-bottom: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.view-title {
  font-size: 2.25rem;
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
  padding: 8rem 0;
}

.loading-text {
  font-size: 0.9rem;
  color: var(--color-text-muted, #94a3b8);
}

.contracts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.75rem;
}

/* Modal specific styles */
.modal-products-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-info-text {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin: 0;
}

.modal-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 0;
  gap: 0.75rem;
  color: var(--color-text-muted);
}

.modal-products-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  max-height: 50vh;
  overflow-y: auto;
  padding: 0.25rem;
}

@media (max-width: 640px) {
  .contracts-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
