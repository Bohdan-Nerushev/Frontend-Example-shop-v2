<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import { useForm } from '../composables/useForm'
import { isValidEmail } from '../utils/validators'
import AppInput from '../components/common/AppInput.vue'
import AppButton from '../components/common/AppButton.vue'
import AppAlert from '../components/common/AppAlert.vue'

const router = useRouter()
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
        // Redirect to dashboard on successful login
        router.push({ name: 'dashboard' })
      }
    } catch (err: any) {
      loginError.value = err.message || 'Login failed. Please check your credentials.'
    }
  })
}

const goToRegister = () => {
  router.push({ name: 'register' })
}
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
