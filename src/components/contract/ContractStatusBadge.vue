<script setup lang="ts">
import AppBadge from '../common/AppBadge.vue'
import { ContractStatus } from '../../types/api'

defineProps<{
  status: ContractStatus
}>()
</script>

<template>
  <AppBadge :status="status" />
</template>
