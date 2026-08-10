<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, formatDate } from '../../utils/formatters'
import type { InvoiceItemResponse } from '../../types/invoice'

const props = defineProps<{
  item: InvoiceItemResponse
}>()

// Shorten contract UUID
const shortContractId = computed(() => {
  return props.item.contractId.substring(0, 8) + '...'
})
</script>

<template>
  <tr class="invoice-item-row">
    <td>
      <div class="product-name">{{ item.productName }}</div>
      <div class="product-meta font-mono" :title="item.productId">Prod ID: {{ item.productId.substring(0, 8) }}...</div>
    </td>
    <td class="font-mono" :title="item.contractId">
      {{ shortContractId }}
    </td>
    <td>
      {{ formatDate(item.contractCreationDate) }}
    </td>
    <td class="text-right">
      {{ formatCurrency(item.setupFee) }}
    </td>
    <td class="text-right">
      {{ formatCurrency(item.monthlyFee) }}
    </td>
  </tr>
</template>


<style scoped>
.invoice-item-row td {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border, #333);
  font-size: 0.875rem;
  color: var(--color-text-main, #eee);
  vertical-align: middle;
}

.product-name {
  font-weight: 600;
  color: var(--color-text-main, #fff);
}

.product-meta {
  font-size: 0.7rem;
  color: var(--color-text-muted, #777);
  margin-top: 0.15rem;
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.text-right {
  text-align: right;
}
</style>
