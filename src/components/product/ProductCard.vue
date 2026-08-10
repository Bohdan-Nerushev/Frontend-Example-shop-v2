<script setup lang="ts">
import { computed } from 'vue'
import AppButton from '../common/AppButton.vue'
import { formatCurrency, formatStorageSize } from '../../utils/formatters'
import type { ProductResponse } from '../../types/product'

const props = withDefaults(
  defineProps<{
    product: ProductResponse
    loading?: boolean
    buttonText?: string
  }>(),
  {
    loading: false,
    buttonText: 'Purchase',
  }
)

defineEmits<{
  (e: 'purchase', product: ProductResponse): void
}>()

// Use central storage formatter
const formattedStorage = computed(() => {
  const formatted = formatStorageSize(props.product.storageSize)
  return formatted === '-' ? null : formatted
})
</script>

<template>
  <div class="product-card">
    <div class="card-header">
      <span class="brand-tag">{{ product.brand }}</span>
      <h3 class="product-name">{{ product.name }}</h3>
    </div>

    <div class="card-body">
      <!-- Storage size if available -->
      <div v-if="formattedStorage" class="storage-info">
        <span class="storage-icon">💾</span>
        <span class="storage-value">{{ formattedStorage }} Storage</span>
      </div>

      <!-- Fees details -->
      <div class="price-details">
        <div class="price-row">
          <span class="price-label">Monthly Fee:</span>
          <span class="price-value font-highlight">{{ formatCurrency(product.monthlyFee) }}</span>
        </div>
        <div class="price-row">
          <span class="price-label">Setup Fee:</span>
          <span class="price-value">{{ formatCurrency(product.setupFee) }}</span>
        </div>
      </div>
    </div>


    <div class="card-actions">
      <AppButton
        :loading="loading"
        variant="primary"
        style="width: 100%;"
        @click="$emit('purchase', product)"
      >
        {{ buttonText }}
      </AppButton>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  background-color: var(--color-bg-card, #1e1e1e);
  border: 1px solid var(--color-border, #333);
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.25rem;
  transition: transform 0.2s, border-color 0.2s;
  height: 100%;
}

.product-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary, #38bdf8);
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.brand-tag {
  align-self: flex-start;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  background-color: rgba(56, 189, 248, 0.1);
  color: var(--color-primary, #38bdf8);
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.product-name {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-main, #fff);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex-grow: 1;
}

.storage-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-muted, #aaa);
  background-color: rgba(255, 255, 255, 0.02);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
}

.price-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 0.75rem;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: var(--color-text-muted, #aaa);
}

.price-value {
  color: var(--color-text-main, #fff);
  font-weight: 500;
}

.font-highlight {
  font-size: 1.15rem;
  color: var(--color-primary, #38bdf8);
  font-weight: 700;
}

.card-actions {
  margin-top: auto;
}
</style>
