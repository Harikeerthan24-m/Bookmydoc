import { useEffect, useState } from 'react';
import { notificationService } from '../services/notification.service';
import { toast } from 'react-toastify';

export const useNotifications = () => {
  const [permission, setPermission] =
    useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Check if notifications are supported
        if (!('Notification' in window)) {
          console.log('This browser does not support notifications');
          return;
        }

        // Get current permission status
        setPermission(Notification.permission);

        // If already granted, get token
        if (Notification.permission === 'granted') {
          const token = await notificationService.getToken();
          setToken(token);
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();
  }, []);

  useEffect(() => {
    // Listen for foreground messages
    const unsubscribe = notificationService.onMessage((payload) => {
      // Show toast notification
      toast.info(payload.notification?.body || 'New notification', {
        onClick: () => {
          // Handle notification click
          if (payload.notification?.click_action) {
            window.location.href = payload.notification.click_action;
          }
        },
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const requestPermission = async () => {
    try {
      const token = await notificationService.requestPermission();
      setToken(token);
      setPermission('granted');
      return token;
    } catch (error) {
      console.error('Error requesting permission:', error);
      setPermission('denied');
      throw error;
    }
  };

  return {
    permission,
    token,
    requestPermission,
  };
};
