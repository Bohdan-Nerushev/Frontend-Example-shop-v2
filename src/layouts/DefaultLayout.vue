<script setup lang="ts">
import { useAuth } from '../auth/useAuth'
import { useRouter } from 'vue-router'

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
            <router-link to="/dashboard">Dashboard</router-link>
            <router-link to="/contracts">Contracts</router-link>
            <router-link to="/invoices">Invoices</router-link>
          </template>
          <template v-else>
            <router-link to="/register">Register</router-link>
          </template>
        </nav>
        
        <div class="auth-area">
          <template v-if="isAuthenticated">
            <span class="user-greeting">Hello, {{ username || 'User' }}</span>
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
