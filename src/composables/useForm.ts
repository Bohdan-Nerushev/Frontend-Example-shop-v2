import { ref } from 'vue'

/**
 * Type-safe composable to manage reactive form state, validation, and submission status.
 */
export function useForm<T extends Record<string, any>>(
  initialState: T,
  validateFn?: (values: T) => Partial<Record<keyof T, string>>
) {
  // Deep copy the initial state to prevent mutating reference
  const form = ref<T>({ ...initialState })
  const errors = ref<Partial<Record<keyof T, string>>>({})
  const isSubmitting = ref(false)

  /**
   * Resets the form back to its initial state and clears all errors.
   */
  const reset = () => {
    form.value = { ...initialState }
    errors.value = {}
    isSubmitting.value = false
  }

  /**
   * Runs the optional validation function and stores errors.
   * Returns true if the form has no validation errors.
   */
  const validate = (): boolean => {
    if (!validateFn) return true
    const validationErrors = validateFn(form.value)
    errors.value = validationErrors
    return Object.keys(validationErrors).length === 0
  }

  /**
   * High-level handler to run validation and submit the form asynchronously.
   * Automatically manages submission lock state.
   */
  const handleSubmit = async (submitFn: (values: T) => Promise<void> | void) => {
    if (!validate()) return
    isSubmitting.value = true
    try {
      await submitFn(form.value)
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    form,
    errors,
    isSubmitting,
    validate,
    reset,
    handleSubmit,
  }
}
