<script setup lang="ts">
import { useNotificationStore } from '../../stores/notification.store'

const notificationStore = useNotificationStore()
</script>

<template>
  <div class="notification-container" aria-live="assertive">
    <TransitionGroup name="toast">
      <div
        v-for="toast in notificationStore.notifications"
        :key="toast.id"
        class="toast-card"
        :class="`toast-${toast.type}`"
      >
        <span class="toast-icon">
          <template v-if="toast.type === 'success'">✅</template>
          <template v-else-if="toast.type === 'error'">❌</template>
          <template v-else-if="toast.type === 'warning'">⚠️</template>
          <template v-else>ℹ️</template>
        </span>
        <div class="toast-message">{{ toast.message }}</div>
        <button
          type="button"
          class="toast-close"
          @click="notificationStore.removeNotification(toast.id)"
        >
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.notification-container {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  z-index: 99999;
  width: 100%;
  max-width: 350px;
  pointer-events: none;
}

.toast-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 0.375rem;
  border: 1px solid var(--color-border);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
  background-color: var(--color-bg-card);
  color: var(--color-text-main);
  pointer-events: auto;
  min-height: 3rem;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.4;
}

.toast-icon {
  font-size: 1.125rem;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
}

.toast-close {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.125rem 0.25rem;
  line-height: 1;
  transition: color 0.2s;
  flex-shrink: 0;
}

.toast-close:hover {
  color: var(--color-text-main);
}

/* Toast types */
.toast-success {
  border-left: 4px solid var(--color-success);
}
.toast-error {
  border-left: 4px solid var(--color-error);
}
.toast-warning {
  border-left: 4px solid var(--color-warning);
}
.toast-info {
  border-left: 4px solid var(--color-info);
}

/* Toast animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
