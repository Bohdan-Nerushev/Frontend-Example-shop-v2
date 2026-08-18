<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import { useForm } from '../composables/useForm'
import { isValidEmail } from '../utils/validators'
import AppInput from '../components/common/AppInput.vue'
import AppButton from '../components/common/AppButton.vue'
import AppAlert from '../components/common/AppAlert.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const loginError = ref<string | null>(null)

const {
  form: loginForm,
  errors: formErrors,
  isSubmitting,
  handleSubmit,
} = useForm(
  {
    email: '',
    password: '',
  },
  (values) => {
    const errs: Record<string, string> = {}
    if (!values.email.trim()) {
      errs.email = 'Email is required'
    } else if (!isValidEmail(values.email)) {
      errs.email = 'Please provide a valid email address'
    }

    if (!values.password) {
      errs.password = 'Password is required'
    } else if (values.password.length < 6) {
      errs.password = 'Password must be at least 6 characters'
    }
    return errs
  }
)

const onLoginSubmit = () => {
  loginError.value = null
  handleSubmit(async (values) => {
    try {
      const success = await authStore.loginWithCredentials(values.email, values.password)
      if (success) {
        const redirect = route.query.redirect as string
        if (redirect) {
          // Destructure redirect from other query params so we don't pass it along to the next view
          const { redirect: _, ...query } = route.query
          router.push({
            name: redirect,
            query,
          })
        } else {
          router.push({ name: 'dashboard' })
        }
      }
    } catch (err: any) {
      loginError.value = err.message || 'Login failed. Please check your credentials.'
    }
  })
}

const goToRegister = () => {
  router.push({ name: 'register' })
}

const checkAuthAndRedirect = () => {
  if (authStore.isAuthenticated) {
    const redirect = route.query.redirect as string
    if (redirect) {
      const { redirect: _, ...query } = route.query
      router.push({
        name: redirect,
        query,
      })
    } else {
      router.push({ name: 'dashboard' })
    }
  }
}

onMounted(() => {
  checkAuthAndRedirect()
})

watch(() => authStore.isAuthenticated, (newVal) => {
  if (newVal) {
    checkAuthAndRedirect()
  }
})
</script>

<template>
  <div class="login-container">
    <div class="login-glow-bg"></div>
    <div class="login-card">
      <header class="login-header">
        <h2 class="login-title">Sign In</h2>
        <p class="login-subtitle">Access your personal mail shop account dashboard.</p>
      </header>

      <!-- Error Alert -->
      <AppAlert v-if="loginError" type="error" :message="loginError" style="margin-bottom: 1.5rem;" />

      <form @submit.prevent="onLoginSubmit" class="login-form">
        <AppInput
          v-model="loginForm.email"
          :error="formErrors.email"
          type="email"
          label="Email Address"
          placeholder="your.email@gmx.de"
          required
        />

        <AppInput
          v-model="loginForm.password"
          :error="formErrors.password"
          type="password"
          label="Password"
          placeholder="••••••••"
          required
        />

        <div class="form-actions" style="display: flex; gap: 1rem;">
          <AppButton
            type="button"
            variant="secondary"
            style="flex: 1; padding: 0.75rem;"
            @click="router.push('/')"
          >
            Cancel
          </AppButton>
          <AppButton
            :loading="isSubmitting"
            type="submit"
            variant="primary"
            style="flex: 1; padding: 0.75rem;"
          >
            Sign In
          </AppButton>
        </div>
      </form>

      <div class="login-divider">
        <span>or</span>
      </div>

      <button type="button" class="google-login-btn" @click="authStore.loginWithGoogle">
        <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        Sign in with Google
      </button>

      <footer class="login-footer">
        <span class="footer-text">Don't have an account?</span>
        <button class="register-link-btn" @click="goToRegister">Register here</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  position: relative;
  min-height: 70vh;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  padding: 2rem 1.5rem;
}

.login-glow-bg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 450px;
  height: 450px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, rgba(0, 0, 0, 0) 70%);
  z-index: 0;
  pointer-events: none;
}

.login-card {
  position: relative;
  z-index: 1;
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  padding: 3rem 2.5rem;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.login-header {
  text-align: center;
}

.login-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
  font-weight: 850;
  color: var(--color-text-main, #fff);
  letter-spacing: -0.02em;
}

.login-subtitle {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-text-muted, #94a3b8);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-actions {
  margin-top: 0.5rem;
}

.login-divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: var(--color-text-muted, #94a3b8);
  font-size: 0.875rem;
}

.login-divider::before,
.login-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.login-divider:not(:empty)::before {
  margin-right: 0.75em;
}

.login-divider:not(:empty)::after {
  margin-left: 0.75em;
}

.google-login-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.375rem;
  color: var(--color-text-main, #fff);
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
}

.google-login-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.google-login-btn:active {
  transform: translateY(0);
}

.google-icon {
  flex-shrink: 0;
}

.login-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 1.25rem;
  font-size: 0.875rem;
}

.footer-text {
  color: var(--color-text-muted, #94a3b8);
}

.register-link-btn {
  background: none;
  border: none;
  color: var(--color-primary, #38bdf8);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}

.register-link-btn:hover {
  color: #0284c7;
  text-decoration: underline;
}

@media (max-width: 480px) {
  .login-card {
    padding: 2rem 1.5rem;
  }
}
</style>
