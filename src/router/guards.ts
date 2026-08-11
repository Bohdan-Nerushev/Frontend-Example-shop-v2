import type { Router } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

export function setupGuards(router: Router) {
  router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()

    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

    if (requiresAuth) {
      if (authStore.isAuthenticated) {
        next()
      } else {
        next({ name: 'login' })
      }
    } else {
      next()
    }
  })
}
