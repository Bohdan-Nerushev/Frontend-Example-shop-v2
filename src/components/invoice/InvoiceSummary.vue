<script setup lang="ts">
import { formatCurrency } from '../../utils/formatters'

defineProps<{
  totalSetupFee: number
  totalMonthlyFee: number
  discount: number
  totalAmount: number
}>()
</script>

<template>
  <div class="invoice-summary">
    <div class="summary-title">Invoice Summary</div>
    
    <div class="summary-rows">
      <div class="summary-row">
        <span class="label">Total Setup Fees:</span>
        <span class="value">{{ formatCurrency(totalSetupFee) }}</span>
      </div>
      
      <div class="summary-row">
        <span class="label">Total Monthly Fees:</span>
        <span class="value">{{ formatCurrency(totalMonthlyFee) }}</span>
      </div>
      
      <div v-if="discount > 0" class="summary-row discount-row">
        <span class="label">Discount Applied:</span>
        <span class="value">-{{ formatCurrency(discount) }}</span>
      </div>
      
      <div class="summary-row total-row">
        <span class="label">Total Amount:</span>
        <span class="value">{{ formatCurrency(totalAmount) }}</span>
      </div>
    </div>
  </div>
</template>


<style scoped>
.invoice-summary {
  background-color: var(--color-bg-card, #1e1e1e);
  border: 1px solid var(--color-border, #333);
  border-radius: 0.5rem;
  padding: 1.25rem;
  width: 100%;
  max-width: 320px;
  margin-left: auto;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.summary-title {
  font-size: 0.95rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-main, #fff);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 0.5rem;
  margin-bottom: 0.75rem;
}

.summary-rows {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--color-text-muted, #aaa);
}

.summary-row .value {
  color: var(--color-text-main, #fff);
  font-weight: 500;
}

.discount-row {
  color: var(--color-success, #10b981);
}

.discount-row .value {
  color: var(--color-success, #10b981);
}

.total-row {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 0.75rem;
  margin-top: 0.25rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-main, #fff);
}

.total-row .value {
  color: var(--color-primary, #38bdf8);
  font-size: 1.2rem;
  font-weight: 800;
}
</style>
