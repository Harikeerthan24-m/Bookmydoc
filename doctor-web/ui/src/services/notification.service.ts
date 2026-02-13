import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseApp } from '../firebaseConfig';

class NotificationService {
  private messaging;

  constructor() {
    this.messaging = getMessaging(firebaseApp);
  }

  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Get the token
        const token = await this.getToken();
        return token;
      }
      throw new Error('Notification permission denied');
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      throw error;
    }
  }

  async getToken() {
    try {
      const currentToken = await getToken(this.messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
      });

      if (currentToken) {
        // Send this token to your server
        await this.saveTokenToServer(currentToken);
        return currentToken;
      }

      console.log('No registration token available');
      return null;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  private async saveTokenToServer(token: string) {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          notification_tokens: token,
          notification_enabled: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save notification token');
      }
    } catch (error) {
      console.error('Error saving token:', error);
      throw error;
    }
  }

  onMessage(callback: (payload: any) => void) {
    return onMessage(this.messaging, (payload) => {
      callback(payload);
    });
  }
}

export const notificationService = new NotificationService();
