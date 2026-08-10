<script setup lang="ts">
import { computed } from 'vue'
import ContractStatusBadge from './ContractStatusBadge.vue'
import AppButton from '../common/AppButton.vue'
import { ContractStatus } from '../../types/api'
import type { ContractResponse } from '../../types/contract'

const props = withDefaults(
  defineProps<{
    contract: ContractResponse
    isActivating?: boolean
  }>(),
  {
    isActivating: false,
  }
)

defineEmits<{
  (e: 'activate', contractId: string): void
}>()

// Substring UUID to 8 characters for clean UI
const shortId = computed(() => {
  return props.contract.id.substring(0, 8) + '...'
})

const shortProductId = computed(() => {
  return props.contract.productId.substring(0, 8) + '...'
})
</script>

<template>
  <div class="contract-card">
    <div class="card-top">
      <div class="contract-meta">
        <span class="meta-label">Contract ID</span>
        <span class="meta-value font-mono" :title="contract.id">{{ shortId }}</span>
      </div>
      <ContractStatusBadge :status="contract.status" />
    </div>

    <div class="card-details">
      <div class="detail-row">
        <span class="detail-label">Product ID:</span>
        <span class="detail-value font-mono" :title="contract.productId">{{ shortProductId }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Created on:</span>
        <span class="detail-value">{{ contract.creationDate }}</span>
      </div>
    </div>

    <div class="card-actions">
      <!-- Show activation button only if contract is inactive -->
      <AppButton
        v-if="contract.status === ContractStatus.INACTIVE"
        :loading="isActivating"
        variant="primary"
        style="width: 100%;"
        @click="$emit('activate', contract.id)"
      >
        Activate Contract
      </AppButton>
      <div v-else class="status-active-msg">
        ✓ This contract is fully active
      </div>
    </div>
  </div>
</template>

<style scoped>
.contract-card {
  background-color: var(--color-bg-card, #1e1e1e);
  border: 1px solid var(--color-border, #333);
  border-radius: 0.5rem;
  padding: 1.25rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 0.75rem;
}

.contract-meta {
  display: flex;
  flex-direction: column;
}

.meta-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-text-muted, #888);
}

.meta-value {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text-main, #fff);
}

.card-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--color-text-muted, #aaa);
}

.detail-value {
  color: var(--color-text-main, #eee);
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.card-actions {
  margin-top: 0.5rem;
}

.status-active-msg {
  text-align: center;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-success, #10b981);
  padding: 0.5rem 0;
  background-color: rgba(16, 185, 129, 0.05);
  border-radius: 4px;
}
</style>
