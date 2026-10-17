<script setup lang="ts">
import { computed } from 'vue'
import { CustomerStatus, ContractStatus } from '../../types/api'

const props = defineProps<{
  status: CustomerStatus | ContractStatus | string
}>()

const badgeClass = computed(() => {
  const normalized = String(props.status).toUpperCase()
  if (normalized === 'ACTIVE') {
    return 'badge-active'
  }
  return 'badge-inactive'
})
</script>

<template>
  <span class="app-badge" :class="badgeClass">
    {{ status }}
  </span>
</template>

<style scoped>
.app-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-width: 1px;
  border-style: solid;
}

.badge-active {
  background-color: var(--color-success-bg);
  border-color: var(--color-success-border);
  color: var(--color-success);
}

.badge-inactive {
  background-color: var(--color-error-bg);
  border-color: var(--color-error-border);
  color: var(--color-error);
}
</style>
