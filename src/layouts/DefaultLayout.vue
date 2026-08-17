<script setup lang="ts">
import { useAuth } from '../auth/useAuth'
import { useRouter } from 'vue-router'
import UserAvatarMenu from '../components/common/UserAvatarMenu.vue'

const { logout, isAuthenticated, username } = useAuth()
const router = useRouter()

const goToLogin = () => {
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="layout-default">
    <header class="app-header">
      <div class="header-container">
        <div class="logo-area">
          <router-link to="/" class="logo-link">🛒 MediaShop</router-link>
        </div>
        
        <nav class="nav-links">
          <router-link to="/">Home</router-link>
          <router-link to="/products">Products</router-link>
          <template v-if="isAuthenticated">
            <router-link to="/dashboard">Account</router-link>
          </template>
          <template v-else>
            <router-link to="/register">Register</router-link>
          </template>
        </nav>
        
        <div class="auth-area">
          <template v-if="isAuthenticated">
            <div class="user-profile-widget">
              <UserAvatarMenu :display-name="username" />
              <router-link to="/dashboard" class="user-greeting" title="Go to Account">Hello, {{ username || 'User' }}</router-link>
            </div>
            <button class="btn btn-logout" @click="logout()">Logout</button>
          </template>
          <template v-else>
            <button class="btn btn-login" @click="goToLogin()">Login</button>
          </template>
        </div>
      </div>
    </header>

    <main class="app-main">
      <slot></slot>
    </main>
  </div>
</template>

<style scoped>
/* Scoped layout-specific tweaks (if any) */
.layout-default {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>
