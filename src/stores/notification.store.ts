import { defineStore } from 'pinia'
import { ref } from 'vue'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface AppNotification {
  id: string
  message: string
  type: NotificationType
  timeoutId?: number
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<AppNotification[]>([])

  const addNotification = (message: string, type: NotificationType = 'info', duration = 5000) => {
    const id = crypto.randomUUID()
    
    const timeoutId = window.setTimeout(() => {
      removeNotification(id)
    }, duration)

    notifications.value.push({
      id,
      message,
      type,
      timeoutId,
    })
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index !== -1) {
      const notification = notifications.value[index]
      if (notification && notification.timeoutId) {
        clearTimeout(notification.timeoutId)
      }
      notifications.value.splice(index, 1)
    }
  }

  const success = (message: string, duration?: number) => addNotification(message, 'success', duration)
  const error = (message: string, duration?: number) => addNotification(message, 'error', duration)
  const info = (message: string, duration?: number) => addNotification(message, 'info', duration)
  const warning = (message: string, duration?: number) => addNotification(message, 'warning', duration)

  return {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    info,
    warning,
  }
})
