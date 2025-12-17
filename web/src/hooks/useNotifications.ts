import { useState, useCallback } from 'react';
import { NotificationType } from '../components/Notification';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = useCallback(
    (type: NotificationType, message: string, duration?: number) => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const notification: NotificationItem = {
        id,
        type,
        message,
        duration,
      };

      setNotifications(prev => [...prev, notification]);
      return id;
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback(
    (message: string, duration?: number) => 
      addNotification(NotificationType.SUCCESS, message, duration),
    [addNotification]
  );

  const showError = useCallback(
    (message: string, duration?: number) => 
      addNotification(NotificationType.ERROR, message, duration),
    [addNotification]
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => 
      addNotification(NotificationType.WARNING, message, duration),
    [addNotification]
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => 
      addNotification(NotificationType.INFO, message, duration),
    [addNotification]
  );

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};