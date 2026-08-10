<script setup lang="ts">
import { useAuth } from './auth/useAuth'

const { login, logout, isAuthenticated, token } = useAuth()

</script>

<template>
  <header>
    <nav v-if="isAuthenticated">
      <button @click="logout">Logout</button>
    </nav>
    <nav v-else>
      <button @click="login">Login</button>
    </nav>
  </header>

  <main>
    <div v-if="isAuthenticated">
      <pre>{{ token }}</pre>
    </div>
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
