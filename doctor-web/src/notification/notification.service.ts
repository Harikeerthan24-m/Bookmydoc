import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { FirebaseService } from '@app/firebase/firebase.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async getNotifications(userId?: string) {
    try {
      this.logger.log(
        `Getting notifications for userId: ${userId}`,
        'NotificationService',
      );

      const firestore = this.firebaseService.getFireStore();
      let notificationsRef = firestore.collection('notifications');

      // Filter by user if userId is provided
      if (userId) {
        notificationsRef = notificationsRef.where(
          'receiver.uid',
          '==',
          userId,
        ) as any;
        this.logger.log(
          `Filtering notifications by receiver.uid: ${userId}`,
          'NotificationService',
        );
      } else {
        this.logger.warn(
          'No userId provided, returning all notifications',
          'NotificationService',
        );
      }

      // Get notifications, sorted by createdAt in descending order
      const notificationsSnapshot = await notificationsRef
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      if (notificationsSnapshot.empty) {
        return {
          data: [],
          message: 'No notifications found',
          statusCode: HttpStatus.OK,
        };
      }

      const notifications = notificationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Debug: Log the first few notifications to see their structure
      if (notifications.length > 0) {
        this.logger.log(
          `Sample notifications for user ${userId}:`,
          'Notification Debug',
        );
        notifications.slice(0, 3).forEach((notification: any, index) => {
          this.logger.log(
            `Notification ${index + 1}: receiver.uid=${notification.receiver?.uid}, sender.uid=${notification.sender?.uid}, body=${notification.notification?.body || notification.notification}`,
            'Notification Debug',
          );
        });
      }

      return {
        data: notifications,
        message: 'Notifications retrieved successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error('Error getting notifications:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to get notifications',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async markAsRead(notificationId: string) {
    try {
      const firestore = this.firebaseService.getFireStore();
      const notificationRef = firestore
        .collection('notifications')
        .doc(notificationId);

      const doc = await notificationRef.get();
      if (!doc.exists) {
        throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
      }

      await notificationRef.update({
        read: true,
        readAt: new Date().toISOString(),
      });

      return {
        message: 'Notification marked as read',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error('Error marking notification as read:', error);
      throw new HttpException(
        error instanceof Error
          ? error.message
          : 'Failed to mark notification as read',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async markAllAsRead(userId?: string) {
    try {
      const firestore = this.firebaseService.getFireStore();
      const batch = firestore.batch();

      let query: any = firestore
        .collection('notifications')
        .where('read', '==', false);

      // Filter by user if userId is provided
      if (userId) {
        query = query.where('receiver.uid', '==', userId);
      }

      const unreadNotifications = await query.get();

      unreadNotifications.docs.forEach((doc) => {
        batch.update(doc.ref, {
          read: true,
          readAt: new Date().toISOString(),
        });
      });

      await batch.commit();

      return {
        message: 'All notifications marked as read',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      this.logger.error('Error marking all notifications as read:', error);
      throw new HttpException(
        error instanceof Error
          ? error.message
          : 'Failed to mark all notifications as read',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
