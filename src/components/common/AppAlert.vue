<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    type?: 'success' | 'error' | 'warning' | 'info'
    message?: string
    closable?: boolean
  }>(),
  {
    type: 'info',
    closable: false,
  }
)

const emit = defineEmits<{
  (e: 'close'): void
}>()

const alertClass = computed(() => `alert-${props.type}`)
</script>

<template>
  <div class="app-alert" :class="alertClass">
    <div class="alert-content">
      <span class="alert-icon">
        <template v-if="type === 'success'">✅</template>
        <template v-else-if="type === 'error'">❌</template>
        <template v-else-if="type === 'warning'">⚠️</template>
        <template v-else>ℹ️</template>
      </span>
      <div class="alert-text">
        <slot>{{ message }}</slot>
      </div>
    </div>
    <button v-if="closable" type="button" class="close-btn" @click="emit('close')">
      ✕
    </button>
  </div>
</template>

<style scoped>
.app-alert {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  border-radius: 0.375rem;
  border: 1px solid transparent;
  width: 100%;
}

.alert-content {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.alert-icon {
  font-size: 1.125rem;
  flex-shrink: 0;
}

.alert-text {
  font-size: 0.875rem;
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  color: inherit;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.125rem 0.375rem;
  line-height: 1;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.close-btn:hover {
  opacity: 1;
}

.alert-success {
  background-color: var(--color-success-bg);
  border-color: var(--color-success-border);
  color: var(--color-success);
}

.alert-error {
  background-color: var(--color-error-bg);
  border-color: var(--color-error-border);
  color: var(--color-error);
}

.alert-warning {
  background-color: var(--color-warning-bg);
  border-color: var(--color-warning-border);
  color: var(--color-warning);
}

.alert-info {
  background-color: var(--color-info-bg);
  border-color: var(--color-info-border);
  color: var(--color-info);
}
</style>
