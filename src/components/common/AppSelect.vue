<script setup lang="ts">
import { computed } from 'vue'

withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    options: { label: string; value: string }[]
    error?: string | null
    required?: boolean
  }>(),
  {
    error: null,
    required: false,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const onChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}

const selectId = computed(() => `select-${crypto.randomUUID()}`)
</script>

<template>
  <div class="select-group" :class="{ 'has-error': error }">
    <label v-if="label" :for="selectId" class="select-label">
      {{ label }} <span v-if="required" class="required-star">*</span>
    </label>
    <select
      :id="selectId"
      :value="modelValue"
      class="app-select"
      @change="onChange"
    >
      <option
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.label }}
      </option>
    </select>
    <span v-if="error" class="error-message">{{ error }}</span>
  </div>
</template>

<style scoped>
.select-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.select-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.required-star {
  color: var(--color-error);
}

.app-select {
  width: 100%;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  background-color: var(--color-bg-main);
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  color: var(--color-text-main);
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg fill='white' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1.25rem;
}

.app-select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.1);
}

.has-error .app-select {
  border-color: var(--color-error);
}

.has-error .app-select:focus {
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
}

.error-message {
  font-size: 0.75rem;
  color: var(--color-error);
}
</style>
