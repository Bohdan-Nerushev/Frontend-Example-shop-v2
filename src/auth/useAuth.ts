import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth.store'

export function useAuth() {
  const authStore = useAuthStore()

  // Use storeToRefs to maintain reactivity when destructuring properties
  const { token, username, email, isAuthenticated } = storeToRefs(authStore)

  return {
    // Reactive State
    token,
    username,
    email,
    isAuthenticated,

    // Methods
    login: authStore.login,
    logout: authStore.logout,
  }
}
