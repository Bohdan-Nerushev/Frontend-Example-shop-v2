<script setup lang="ts">
import AppInput from '../common/AppInput.vue'
import type { CommunicationDetails } from '../../types/customer'

const props = withDefaults(
  defineProps<{
    modelValue: CommunicationDetails
    errors?: Partial<Record<keyof CommunicationDetails, string>> | null
    required?: boolean
  }>(),
  {
    errors: null,
    required: false,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: CommunicationDetails): void
}>()

const updateField = (key: keyof CommunicationDetails, value: string) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  })
}
</script>

<template>
  <div class="communication-form">
    <AppInput
      :model-value="modelValue.email"
      :error="errors?.[ 'email' ]"
      :required="required"
      type="email"
      label="Email Address"
      @update:model-value="updateField('email', $event)"
    />

    <AppInput
      :model-value="modelValue.telephone"
      :error="errors?.[ 'telephone' ]"
      :required="required"
      type="tel"
      label="Telephone"
      @update:model-value="updateField('telephone', $event)"
    />
  </div>
</template>

<style scoped>
.communication-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}
</style>
