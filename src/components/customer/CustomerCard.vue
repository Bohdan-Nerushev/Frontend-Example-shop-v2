<script setup lang="ts">
import CustomerStatusBadge from './CustomerStatusBadge.vue'
import AppButton from '../common/AppButton.vue'
import { formatDate } from '../../utils/formatters'
import { CustomerStatus } from '../../types/api'
import type { CustomerResponse } from '../../types/customer'

defineProps<{
  customer: CustomerResponse
  isActivating?: boolean
  isDeactivating?: boolean
  isDeleting?: boolean
}>()

defineEmits<{
  (e: 'edit'): void
  (e: 'activate'): void
  (e: 'deactivate'): void
  (e: 'delete'): void
}>()
</script>


<template>
  <div class="customer-card">
    <!-- Header: Name, Brand, Status -->
    <div class="card-header">
      <div>
        <h2 class="customer-name">{{ customer.firstName }} {{ customer.lastName }}</h2>
        <span class="customer-brand">Brand: <strong>{{ customer.brand }}</strong></span>
      </div>
      <CustomerStatusBadge :status="customer.status" />
    </div>

    <div class="card-content">
      <!-- Section: General info -->
      <div class="info-group">
        <div class="info-label">Customer ID</div>
        <div class="info-value font-mono">{{ customer.id }}</div>
      </div>

      <div class="info-group">
        <div class="info-label">Date of Birth</div>
        <div class="info-value">{{ formatDate(customer.birthDate) }}</div>
      </div>

      <div class="info-group">
        <div class="info-label">Email / Phone</div>
        <div class="info-value">
          <div>📧 {{ customer.communicationDetails.email }}</div>
          <div>📞 {{ customer.communicationDetails.telephone }}</div>
        </div>
      </div>

      <!-- Section: Addresses -->
      <div class="address-section">
        <div class="address-box">
          <div class="info-label">Registered Address</div>
          <div class="info-value address-text">
            {{ customer.address.street }} {{ customer.address.number }}<br />
            {{ customer.address.postcode }} {{ customer.address.city }}<br />
            {{ customer.address.country }}
          </div>
        </div>

        <div class="address-box">
          <div class="info-label">Billing Address</div>
          <div class="info-value address-text">
            <template v-if="customer.invoiceAddress">
              {{ customer.invoiceAddress.street }} {{ customer.invoiceAddress.number }}<br />
              {{ customer.invoiceAddress.postcode }} {{ customer.invoiceAddress.city }}<br />
              {{ customer.invoiceAddress.country }}
            </template>
            <template v-else>
              <span class="text-muted italic">Same as registered address</span>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions Footer -->
    <div class="card-footer">
      <div class="footer-left">
        <!-- Edit Profile always active -->
        <AppButton variant="secondary" @click="$emit('edit')">
          Edit Profile
        </AppButton>
      </div>

      <div class="footer-right">
        <!-- Status-dependent Action Buttons -->
        <AppButton
          v-if="customer.status === CustomerStatus.INACTIVE"
          :loading="isActivating"
          variant="primary"
          @click="$emit('activate')"
        >
          Activate Account
        </AppButton>

        <AppButton
          v-if="customer.status === CustomerStatus.ACTIVE"
          :loading="isDeactivating"
          variant="secondary"
          @click="$emit('deactivate')"
        >
          Deactivate Account
        </AppButton>

        <AppButton
          :loading="isDeleting"
          variant="danger"
          @click="$emit('delete')"
        >
          Delete Account
        </AppButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.customer-card {
  background-color: var(--color-bg-card, #1e1e1e);
  border: 1px solid var(--color-border, #333);
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid var(--color-border, #333);
  padding-bottom: 1rem;
}

.customer-name {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-main, #fff);
}

.customer-brand {
  font-size: 0.875rem;
  color: var(--color-text-muted, #aaa);
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.info-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted, #888);
}

.info-value {
  font-size: 0.95rem;
  color: var(--color-text-main, #eee);
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.address-section {
  display: flex;
  gap: 1.5rem;
  margin-top: 0.5rem;
}

.address-box {
  flex: 1;
  background-color: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  padding: 1rem;
}

.address-text {
  line-height: 1.5;
  margin-top: 0.25rem;
}

.text-muted {
  color: var(--color-text-muted, #666);
}

.italic {
  font-style: italic;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--color-border, #333);
  padding-top: 1rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.footer-right {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .address-section {
    flex-direction: column;
    gap: 1rem;
  }
  .card-footer {
    flex-direction: column;
    align-items: stretch;
  }
  .footer-right {
    flex-direction: column;
  }
}
</style>
