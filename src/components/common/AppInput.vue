<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string | number
    label?: string
    error?: string | null
    type?: string
    maxlength?: number | string
    required?: boolean
    autocomplete?: string
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

const showPassword = ref(false)

const computedType = computed(() => {
  if (props.type === 'password') {
    return showPassword.value ? 'text' : 'password'
  }
  return props.type
})

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <div class="input-group" :class="{ 'has-error': error }">
    <label v-if="label" :for="inputId" class="input-label">
      {{ label }} <span v-if="required" class="required-star">*</span>
    </label>
    <div class="input-wrapper">
      <input
        :id="inputId"
        :type="computedType"
        :value="modelValue"
        :maxlength="maxlength"
        :autocomplete="autocomplete"
        class="app-input"
        :class="{ 'pr-10': type === 'password' }"
        @input="onInput"
      />
      <button
        v-if="type === 'password'"
        type="button"
        class="password-toggle-btn"
        @click="togglePasswordVisibility"
        aria-label="Toggle password visibility"
      >
        <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" class="eye-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" class="eye-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      </button>
    </div>
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

.input-wrapper {
  position: relative;
  width: 100%;
}

.password-toggle-btn {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  user-select: none;
  outline: none;
}

.password-toggle-btn:hover {
  color: var(--color-text-main);
}

.eye-icon {
  width: 1.25rem;
  height: 1.25rem;
  stroke: currentColor;
}

.app-input.pr-10 {
  padding-right: 2.5rem;
}
</style>
