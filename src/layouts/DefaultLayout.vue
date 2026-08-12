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
            <router-link to="/dashboard" class="user-profile-widget" title="Go to Dashboard">
              <span class="user-avatar-link">
                <svg class="user-icon-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              <span class="user-greeting">Hello, {{ username || 'User' }}</span>
            </router-link>
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
