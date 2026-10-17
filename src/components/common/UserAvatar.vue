<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  imageUrl?: string | null
  displayName?: string | null
  size?: 'small' | 'medium' | 'medium-large' | 'large'
}>(), {
  imageUrl: null,
  displayName: null,
  size: 'medium',
})

const initial = computed(() => props.displayName?.trim().charAt(0).toUpperCase() || '?')
</script>

<template>
  <span :class="['user-avatar', `user-avatar--${size}`]">
    <img v-if="imageUrl" :src="imageUrl" alt="Your profile image" class="user-avatar__image" />
    <span v-else aria-hidden="true">{{ initial }}</span>
  </span>
</template>

<style scoped>
.user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 50%;
  flex: 0 0 auto;
  color: white;
  background: var(--color-primary);
  font-weight: 700;
}
.user-avatar--small { width: 2rem; height: 2rem; font-size: .8rem; }
.user-avatar--medium { width: 2.5rem; height: 2.5rem; font-size: 1rem; }
.user-avatar--medium-large { width: 3.5rem; height: 3.5rem; font-size: 1.5rem; }
.user-avatar--large { width: 5rem; height: 5rem; font-size: 2rem; }
.user-avatar__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: auto;
}
</style>
