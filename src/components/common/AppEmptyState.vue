<script setup lang="ts">
withDefaults(
  defineProps<{
    message: string
    icon?: string
  }>(),
  {
    icon: '📦',
  }
)
</script>

<template>
  <div class="empty-state">
    <span class="empty-icon">{{ icon }}</span>
    <p class="empty-message">{{ message }}</p>
    <div v-if="$slots.default" class="empty-action">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 1.5rem;
  border: 1px dashed var(--color-border);
  border-radius: 0.5rem;
  background-color: rgba(255, 255, 255, 0.01);
  width: 100%;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-message {
  font-size: 0.95rem;
  color: var(--color-text-muted);
  max-width: 300px;
  line-height: 1.5;
}

.empty-action {
  margin-top: 1.5rem;
}
</style>
