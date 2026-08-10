<script setup lang="ts">
import { computed } from 'vue'
import AppSpinner from './AppSpinner.vue'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger'
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'primary',
    loading: false,
    disabled: false,
    type: 'button',
  }
)

const buttonClass = computed(() => [
  `btn-${props.variant}`,
  { 'btn-loading': props.loading },
])
</script>

<template>
  <button
    :type="type"
    class="app-btn"
    :class="buttonClass"
    :disabled="disabled || loading"
  >
    <AppSpinner v-if="loading" size="sm" class="btn-spinner" />
    <span :class="{ 'text-hidden': loading }">
      <slot></slot>
    </span>
  </button>
</template>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 0.375rem;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.app-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-bg-main);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.btn-secondary {
  background-color: transparent;
  border-color: var(--color-border);
  color: var(--color-text-main);
}

.btn-secondary:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: var(--color-text-muted);
}

.btn-danger {
  background-color: var(--color-error);
  color: #ffffff;
}

.btn-danger:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-spinner {
  position: absolute;
}

.text-hidden {
  visibility: hidden;
}
</style>
