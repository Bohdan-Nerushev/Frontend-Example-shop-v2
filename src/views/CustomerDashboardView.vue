<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCustomerStore } from '../stores/customer.store'
import { useAuthStore } from '../stores/auth.store'
import { useContractStore } from '../stores/contract.store'
import { useConfirmDialog } from '../composables/useConfirmDialog'
import { useNotification } from '../composables/useNotification'
import CustomerCard from '../components/customer/CustomerCard.vue'
import ContractCard from '../components/contract/ContractCard.vue'
import AppSpinner from '../components/common/AppSpinner.vue'
import AppAlert from '../components/common/AppAlert.vue'
import AppButton from '../components/common/AppButton.vue'
import AppModal from '../components/common/AppModal.vue'

const router = useRouter()
const customerStore = useCustomerStore()
const authStore = useAuthStore()
const contractStore = useContractStore()
const confirmDialog = useConfirmDialog()
const notification = useNotification()

const activeContractLoadingId = ref<string | null>(null)

onMounted(async () => {
  // Load profile upon entering dashboard
  await customerStore.fetchCustomerProfile()
  if (customerStore.customer) {
    await contractStore.fetchContracts()
  }
})

const handleEdit = () => {
  router.push({ name: 'profile-edit' })
}

const handleActivate = async () => {
  try {
    await customerStore.activate()
  } catch (e) {
    console.error('Failed to activate customer profile', e)
  }
}

const handleDeactivate = async () => {
  const confirmed = await confirmDialog.confirm({
    title: 'Deactivate Profile',
    message: 'Are you sure you want to deactivate your profile? Active subscriptions will remain, but you cannot buy new ones.',
    confirmText: 'Deactivate',
    cancelText: 'Keep Active',
  })

  if (confirmed) {
    try {
      await customerStore.deactivate()
    } catch (e) {
      console.error('Failed to deactivate profile', e)
    }
  }
}

const handleDelete = async () => {
  const confirmed = await confirmDialog.confirm({
    title: 'Delete Account Permanently',
    message: 'WARNING: This will permanently delete your customer profile and all related data. This action cannot be undone.',
    confirmText: 'Delete Permanently',
    cancelText: 'Cancel',
  })

  if (confirmed) {
    try {
      await customerStore.deleteProfile()
      // Log out Keycloak session after profile deletion
      authStore.logout()
    } catch (e) {
      console.error('Failed to delete profile', e)
    }
  }
}

const goToRegister = () => {
  router.push({ name: 'register' })
}

const handleActivateContract = async (contractId: string) => {
  activeContractLoadingId.value = contractId
  try {
    await contractStore.activate(contractId)
    notification.success('Contract activated successfully!')
  } catch (e) {
    console.error('Contract activation failed', e)
    notification.error('Failed to activate contract')
  } finally {
    activeContractLoadingId.value = null
  }
}

const goToProducts = () => {
  if (customerStore.customer) {
    router.push({ name: 'products', query: { brand: customerStore.customer.brand } })
  } else {
    router.push({ name: 'products' })
  }
}

const handleLogout = () => {
  authStore.logout()
}
</script>

<template>
  <div class="dashboard-view">
    
    <!-- LOADING STATE -->
    <div v-if="customerStore.loading" class="spinner-container">
      <AppSpinner size="lg" />
      <span class="loading-text">Fetching your profile details...</span>
    </div>

    <template v-else>
      <!-- ERROR STATE -->
      <AppAlert v-if="customerStore.error" type="error" :message="customerStore.error" style="margin-bottom: 2rem;" />

      <!-- NO PROFILE DETECTED STATE -->
      <div v-if="!customerStore.customer" class="no-profile-card">
        <div class="no-profile-icon">👤</div>
        <h2 class="no-profile-title">No Customer Profile Found</h2>
        <p class="no-profile-desc">
          You have successfully logged in via Keycloak, but you don't have a registered shop profile yet. 
          Please create a customer profile to order mail subscriptions.
        </p>
        <AppButton variant="primary" @click="goToRegister">
          Register Customer Profile
        </AppButton>
      </div>

      <!-- PROFILE CARD DISPLAY -->
      <div v-else class="profile-container">
        <header class="dashboard-header">
          <div class="header-main-info">
            <h1 class="dashboard-title">Customer Dashboard</h1>
            <p class="dashboard-subtitle">Manage your personal settings and security status.</p>
          </div>
          <AppButton variant="secondary" @click="handleLogout">
            Logout
          </AppButton>
        </header>

        <CustomerCard
          :customer="customerStore.customer"
          @edit="handleEdit"
          @activate="handleActivate"
          @deactivate="handleDeactivate"
          @delete="handleDelete"
        />

        <!-- Section: Contracts -->
        <div class="contracts-section">
          <div class="section-header">
            <h2 class="contracts-section-title">My Contracts & Subscriptions</h2>
            <AppButton variant="secondary" size="sm" @click="goToProducts">
              Buy New Subscription
            </AppButton>
          </div>

          <div v-if="contractStore.loading && contractStore.contracts.length === 0" class="contracts-spinner-container">
            <AppSpinner size="md" />
            <span class="loading-text">Fetching your contracts list...</span>
          </div>

          <template v-else>
            <div v-if="contractStore.contracts.length === 0" class="no-contracts-box">
              <p class="no-contracts-text">You don't have any subscriptions or contracts yet.</p>
              <AppButton variant="primary" @click="goToProducts">
                Explore Subscriptions
              </AppButton>
            </div>

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
        </div>
      </div>
    </template>

    <!-- Global Confirm Dialog Modal Bound to Composable State -->
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
  </div>
</template>

<style scoped>
.dashboard-view {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1.5rem;
  width: 100%;
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

.dashboard-header {
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.header-main-info {
  display: flex;
  flex-direction: column;
}

.dashboard-title {
  font-size: 2.25rem;
  font-weight: 800;
  color: var(--color-text-main, #fff);
  margin: 0 0 0.5rem 0;
}

.dashboard-subtitle {
  font-size: 0.95rem;
  color: var(--color-text-muted, #94a3b8);
  margin: 0;
}

/* No Profile Card Styles */
.no-profile-card {
  background-color: var(--color-bg-card, #1e1e1e);
  border: 1px solid var(--color-border, #333);
  border-radius: 1rem;
  padding: 3rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
}

.no-profile-icon {
  font-size: 3.5rem;
  line-height: 1;
}

.no-profile-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 750;
  color: var(--color-text-main, #fff);
}

.no-profile-desc {
  font-size: 0.925rem;
  line-height: 1.6;
  color: var(--color-text-muted, #94a3b8);
  max-width: 500px;
  margin: 0;
}

.contracts-section {
  margin-top: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.contracts-section-title {
  font-size: 1.5rem;
  font-weight: 750;
  color: var(--color-text-main, #fff);
  margin: 0;
}

.contracts-spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 0;
}

.no-contracts-box {
  background-color: var(--color-bg-card, #1e1e1e);
  border: 1px dashed var(--color-border, #333);
  border-radius: 0.5rem;
  padding: 3rem 2rem;
  text-align: center;
}

.no-contracts-text {
  color: var(--color-text-muted, #94a3b8);
  font-size: 0.95rem;
  margin: 0 0 1.25rem 0;
}

.contracts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}
</style>
