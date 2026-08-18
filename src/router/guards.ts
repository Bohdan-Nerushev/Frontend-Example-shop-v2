import type { Router } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import { useCustomerStore } from '../stores/customer.store'

export function setupGuards(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()
    const customerStore = useCustomerStore()

    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

    // 1. If user is authenticated, check if they have a customer profile
    if (authStore.isAuthenticated) {
      if (!customerStore.customer && !customerStore.loading) {
        try {
          await customerStore.fetchCustomerProfile()
        } catch (e) {
          console.error('Failed to fetch customer profile in guard', e)
        }
      }

      // If they don't have a profile, they are only allowed to be on the 'register' page
      if (!customerStore.customer) {
        if (to.name !== 'register') {
          next({ name: 'register' })
          return
        }
      } else {
        // If they have a profile, they shouldn't be allowed to visit the 'register' page
        if (to.name === 'register') {
          next({ name: 'dashboard' })
          return
        }
      }
    }

    // 2. Standard authentication guard
    if (requiresAuth && !authStore.isAuthenticated) {
      next({
        name: 'login',
        query: {
          redirect: to.name as string,
          ...to.query,
        },
      })
    } else {
      next()
    }
  })
}
