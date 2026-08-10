<script setup lang="ts">
import AppInput from '../common/AppInput.vue'
import type { AddressRequest } from '../../types/customer'

const props = withDefaults(
  defineProps<{
    modelValue: AddressRequest
    errors?: Partial<Record<keyof AddressRequest, string>> | null
    required?: boolean
  }>(),
  {
    errors: null,
    required: false,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: AddressRequest): void
}>()

const updateField = (key: keyof AddressRequest, value: string) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  })
}
</script>

<template>
  <div class="address-form">
    <div class="form-row">
      <div class="col-8">
        <AppInput
          :model-value="modelValue.street"
          :error="errors?.[ 'street' ]"
          :required="required"
          label="Street"
          @update:model-value="updateField('street', $event)"
        />
      </div>
      <div class="col-4">
        <AppInput
          :model-value="modelValue.number"
          :error="errors?.[ 'number' ]"
          :required="required"
          label="Number"
          @update:model-value="updateField('number', $event)"
        />
      </div>
    </div>

    <div class="form-row">
      <div class="col-4">
        <AppInput
          :model-value="modelValue.postcode"
          :error="errors?.[ 'postcode' ]"
          :required="required"
          label="Postcode"
          @update:model-value="updateField('postcode', $event)"
        />
      </div>
      <div class="col-8">
        <AppInput
          :model-value="modelValue.city"
          :error="errors?.[ 'city' ]"
          :required="required"
          label="City"
          @update:model-value="updateField('city', $event)"
        />
      </div>
    </div>

    <AppInput
      :model-value="modelValue.country"
      :error="errors?.[ 'country' ]"
      :required="required"
      label="Country"
      @update:model-value="updateField('country', $event)"
    />
  </div>
</template>

<style scoped>
.address-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.form-row {
  display: flex;
  gap: 1rem;
  width: 100%;
}

.col-4 {
  flex: 0 0 calc(33.333% - 0.667rem);
}

.col-8 {
  flex: 0 0 calc(66.667% - 0.333rem);
}

@media (max-width: 640px) {
  .form-row {
    flex-direction: column;
    gap: 1rem;
  }
  .col-4, .col-8 {
    flex: 0 0 100%;
  }
}
</style>
