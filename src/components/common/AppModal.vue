<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  open: boolean
  title?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

// Prevent body scroll when modal is open
const handleBodyScroll = (isOpen: boolean) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

// Watch prop change on client
onMounted(() => {
  handleBodyScroll(props.open)
})

onUnmounted(() => {
  handleBodyScroll(false)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-container" role="dialog" aria-modal="true">
          <header class="modal-header">
            <h3 v-if="title" class="modal-title">{{ title }}</h3>
            <button type="button" class="close-btn" @click="emit('close')">
              ✕
            </button>
          </header>
          
          <div class="modal-content">
            <slot></slot>
          </div>
          
          <footer v-if="$slots.actions" class="modal-footer">
            <slot name="actions"></slot>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 1.5rem;
}

.modal-container {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 1rem;
  cursor: pointer;
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--color-text-main);
}

.modal-content {
  padding: 1.5rem;
  font-size: 0.925rem;
  line-height: 1.5;
  color: var(--color-text-main);
  overflow-y: auto;
  max-height: 70vh;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  background-color: rgba(255, 255, 255, 0.01);
}

/* Modal transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .modal-container {
  animation: slide-up 0.25s ease;
}

.fade-leave-active .modal-container {
  animation: slide-up 0.2s ease reverse;
}

@keyframes slide-up {
  from {
    transform: translateY(20px) scale(0.95);
  }
  to {
    transform: translateY(0) scale(1);
  }
}
</style>
