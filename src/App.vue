<script setup lang="ts">
import { useAuth } from './auth/useAuth'

const { login, logout, isAuthenticated, username } = useAuth()
</script>

<template>
  <header class="app-header">
    <div class="header-container">
      <div class="logo-area">
        <router-link to="/" class="logo-link">🛒 MediaShop</router-link>
      </div>

      <nav class="nav-links">
        <router-link to="/">Home</router-link>
        <router-link to="/products">Products</router-link>
        <router-link to="/register">Register</router-link>

        <!-- Protected Links -->
        <template v-if="isAuthenticated">
          <router-link to="/dashboard">Dashboard</router-link>
          <router-link to="/contracts">Contracts</router-link>
          <router-link to="/invoices">Invoices</router-link>
          <router-link to="/profile/edit">Edit Profile</router-link>
        </template>
      </nav>

      <div class="auth-area">
        <template v-if="isAuthenticated">
          <span class="user-greeting">Hello, {{ username || 'User' }}</span>
          <button @click="logout" class="btn btn-logout">Logout</button>
        </template>
        <template v-else>
          <button @click="login" class="btn btn-login">Login</button>
        </template>
      </div>
    </div>
  </header>

  <main class="app-main">
    <router-view />
  </main>
</template>


