<script setup lang="ts">
import AppBadge from '../common/AppBadge.vue'
import { CustomerStatus } from '../../types/api'

defineProps<{
  status: CustomerStatus
}>()
</script>

<template>
  <AppBadge :status="status" />
</template>
