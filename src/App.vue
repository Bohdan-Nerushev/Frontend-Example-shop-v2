<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from './layouts/DefaultLayout.vue'
import AuthLayout from './layouts/AuthLayout.vue'
import NotificationContainer from './components/common/NotificationContainer.vue'

const route = useRoute()

// Dynamically select layout based on route metadata
const layout = computed(() => {
  if (route.meta.layout === 'AuthLayout') {
    return AuthLayout
  }
  return DefaultLayout
})
</script>

<template>
  <component :is="layout">
    <router-view />
  </component>
  <NotificationContainer />
</template>
