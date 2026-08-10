<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCustomerStore } from '../stores/customer.store'
import { useAuthStore } from '../stores/auth.store'
import { useConfirmDialog } from '../composables/useConfirmDialog'
import { useNotification } from '../composables/useNotification'
import CustomerCard from '../components/customer/CustomerCard.vue'
import AppSpinner from '../components/common/AppSpinner.vue'
import AppAlert from '../components/common/AppAlert.vue'
import AppButton from '../components/common/AppButton.vue'
import AppModal from '../components/common/AppModal.vue'

const router = useRouter()
const customerStore = useCustomerStore()
const authStore = useAuthStore()
const confirmDialog = useConfirmDialog()
const notification = useNotification()

onMounted(async () => {
  // Load profile upon entering dashboard
  await customerStore.fetchCustomerProfile()
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
          <h1 class="dashboard-title">Customer Dashboard</h1>
          <p class="dashboard-subtitle">Manage your personal settings and security status.</p>
        </header>

        <CustomerCard
          :customer="customerStore.customer"
          @edit="handleEdit"
          @activate="handleActivate"
          @deactivate="handleDeactivate"
          @delete="handleDelete"
        />
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
</style>
