<script setup lang="ts">
import { computed } from 'vue'

withDefaults(
  defineProps<{
    modelValue: string | number
    label?: string
    error?: string | null
    type?: string
    maxlength?: number | string
    required?: boolean
  }>(),
  {
    type: 'text',
    error: null,
    required: false,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const inputId = computed(() => `input-${crypto.randomUUID()}`)
</script>

<template>
  <div class="input-group" :class="{ 'has-error': error }">
    <label v-if="label" :for="inputId" class="input-label">
      {{ label }} <span v-if="required" class="required-star">*</span>
    </label>
    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :maxlength="maxlength"
      class="app-input"
      @input="onInput"
    />
    <span v-if="error" class="error-message">{{ error }}</span>
  </div>
</template>

<style scoped>
.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.input-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.required-star {
  color: var(--color-error);
}

.app-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  color: var(--color-text-main);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.app-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.1);
}

.has-error .app-input {
  border-color: var(--color-error);
}

.has-error .app-input:focus {
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
}

.error-message {
  font-size: 0.75rem;
  color: var(--color-error);
}
</style>
