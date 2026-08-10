<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    size: 'md',
  }
)

const spinnerClass = computed(() => `spinner-${props.size}`)
</script>

<template>
  <div class="spinner-container" :class="spinnerClass">
    <svg class="spinner-svg" viewBox="0 0 50 50" aria-label="Loading">
      <circle
        class="spinner-path"
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke-width="5"
      ></circle>
    </svg>
  </div>
</template>

<style scoped>
.spinner-container {
  display: inline-flex;
  justify-content: center;
  align-items: center;
}

.spinner-sm {
  width: 1.25rem;
  height: 1.25rem;
}

.spinner-md {
  width: 2.5rem;
  height: 2.5rem;
}

.spinner-lg {
  width: 4rem;
  height: 4rem;
}

.spinner-svg {
  animation: rotate 2s linear infinite;
  width: 100%;
  height: 100%;
}

.spinner-path {
  stroke: var(--color-primary);
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}
</style>
