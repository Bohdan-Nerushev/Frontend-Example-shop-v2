import { useNotificationStore } from '../stores/notification.store'

/**
 * A composable helper to trigger application-wide toast notifications.
 */
export function useNotification() {
  const store = useNotificationStore()

  return {
    success: store.success,
    error: store.error,
    info: store.info,
    warning: store.warning,
    remove: store.removeNotification,
    notifications: store.notifications,
  }
}
