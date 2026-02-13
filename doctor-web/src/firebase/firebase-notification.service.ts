import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { IUnsafeObject } from '@app/common/types';

@Injectable()
export class FirebaseNotificationService {
  logger: Logger;
  constructor(private readonly firebaseService: FirebaseService) {
    this.logger = new Logger(this.constructor.name);
  }

  async sendNotificationByTopic(
    receiverId: string,
    senderId: string,
    notificationFunc: (
      receiver: IUnsafeObject<any>,
      sender: IUnsafeObject<any>,
    ) => IUnsafeObject<any>,
  ) {
    try {
      // Get the owners details
      const fireStore = this.firebaseService.getFireStore();
      const receiver: any = (
        await fireStore
          .collection(this.firebaseService.collections.profiles)
          .doc(receiverId)
          .get()
      ).data();

      if (!receiver?.notification_enabled) {
        return;
      }

      const sender: any = (
        await fireStore
          .collection(this.firebaseService.collections.profiles)
          .doc(senderId)
          .get()
      ).data();

      const { notification, context } = notificationFunc(receiver, sender);
      // Firebase requires all data values to be strings
      const data = {
        receiver: JSON.stringify({
          uid: receiver?.uid,
          user_name: receiver?.user_name,
          role: receiver?.role,
        }),
        sender: JSON.stringify({
          uid: sender?.uid,
          user_name: sender?.user_name,
          role: sender?.role,
        }),
        context: JSON.stringify(context),
        notification_body: notification?.body || '',
        notification_title: notification?.title || '',
      };

      // console.log({
      //   data,
      //   notification,
      //   token: receiver?.notification_tokens,
      // });

      const result = await this.firebaseService.getMessage().send({
        topic: 'booking',
        data,
        notification,
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
              priority: 'high',
            },
          },
        },
        android: {
          priority: 'high',
        },
      });
      this.logger.log(JSON.stringify(result), 'Notification Send');
    } catch (error) {
      this.logger.error(error, 'notification error');
    }
  }

  async sendNotificationByToken(
    receiverId: string,
    senderId: string,
    notificationFunc: (
      receiver: IUnsafeObject<any>,
      sender: IUnsafeObject<any>,
    ) => IUnsafeObject<any>,
  ) {
    try {
      // Get the owners details
      const fireStore = this.firebaseService.getFireStore();
      const receiver: any = (
        await fireStore
          .collection(this.firebaseService.collections.profiles)
          .doc(receiverId)
          .get()
      ).data();

      if (!receiver?.notification_enabled) {
        return;
      }

      const sender: any = (
        await fireStore
          .collection(this.firebaseService.collections.profiles)
          .doc(senderId)
          .get()
      ).data();

      this.logger.log(
        `Receiver notification settings: enabled=${receiver?.notification_enabled}, tokens=${receiver?.notification_tokens?.length || 0}`,
        'FCM Check',
      );

      if (!receiver?.notification_enabled) {
        this.logger.log('Notifications disabled for receiver', 'FCM Skip');
        return;
      }

      if (
        !receiver?.notification_tokens ||
        receiver?.notification_tokens.length === 0
      ) {
        this.logger.log(
          'No notification tokens found for receiver',
          'FCM Skip',
        );
        return;
      }

      const { notification, context } = notificationFunc(receiver, sender);
      // Firebase requires all data values to be strings
      const data = {
        receiver: JSON.stringify({
          uid: receiver?.uid,
          user_name: receiver?.user_name,
          role: receiver?.role,
        }),
        sender: JSON.stringify({
          uid: sender?.uid,
          user_name: sender?.user_name,
          role: sender?.role,
        }),
        context: JSON.stringify(context),
        notification_body: notification?.body || '',
        notification_title: notification?.title || '',
      };

      this.logger.log(
        {
          data,
          notification,
          tokens: receiver?.notification_tokens,
          receiverUid: receiver?.uid,
          senderUid: sender?.uid,
        },
        'FCM Payload',
      );

      // Parse and clean notification tokens
      let tokens = receiver?.notification_tokens;

      this.logger.log(`Raw notification tokens: ${JSON.stringify(tokens)}`);

      // Helper function to extract FCM token from various formats
      const extractToken = (tokenString: string): string | null => {
        // FCM token pattern: more flexible to catch the actual token
        const fcmTokenPattern = /([a-zA-Z0-9_-]+:[a-zA-Z0-9_-]{100,})/g;
        const matches = tokenString.match(fcmTokenPattern);
        return matches ? matches[0] : null;
      };

      // Handle different token storage formats
      if (typeof tokens === 'string') {
        // Try to extract token directly first
        const directToken = extractToken(tokens);
        if (directToken) {
          tokens = [directToken];
        } else {
          try {
            // Try parsing as JSON multiple times for nested arrays
            let parsed = JSON.parse(tokens);
            // Handle multiple levels of nesting
            while (
              typeof parsed === 'string' &&
              (parsed.startsWith('[') || parsed.startsWith('{'))
            ) {
              try {
                parsed = JSON.parse(parsed);
              } catch {
                break;
              }
            }

            if (Array.isArray(parsed)) {
              tokens = parsed
                .map((t) => (typeof t === 'string' ? extractToken(t) : null))
                .filter(Boolean);
            } else if (typeof parsed === 'string') {
              const extractedToken = extractToken(parsed);
              tokens = extractedToken ? [extractedToken] : [];
            } else {
              tokens = [];
            }
          } catch (e) {
            // If parsing fails, try to extract token from the string
            const extractedToken = extractToken(tokens);
            tokens = extractedToken ? [extractedToken] : [];
          }
        }
      } else if (Array.isArray(tokens)) {
        // Clean array of tokens - handle nested stringified arrays
        tokens = tokens
          .map((token) => {
            if (typeof token === 'string') {
              // Try to parse if it looks like a stringified array
              if (token.startsWith('[') || token.startsWith('"[')) {
                try {
                  let parsed = JSON.parse(token);
                  // Handle multiple levels of nesting
                  while (
                    typeof parsed === 'string' &&
                    (parsed.startsWith('[') || parsed.startsWith('{'))
                  ) {
                    try {
                      parsed = JSON.parse(parsed);
                    } catch {
                      break;
                    }
                  }
                  if (Array.isArray(parsed)) {
                    return extractToken(parsed[0]);
                  } else {
                    return extractToken(parsed);
                  }
                } catch {
                  return extractToken(token);
                }
              } else {
                return extractToken(token);
              }
            }
            return null;
          })
          .filter(Boolean);
      } else {
        tokens = [];
      }

      this.logger.log(`Cleaned notification tokens: ${JSON.stringify(tokens)}`);

      // Basic token validation - just check format
      tokens = tokens.filter(
        (token) =>
          token &&
          typeof token === 'string' &&
          token.includes(':') &&
          token.length > 100, // FCM tokens are typically 152+ characters
      );

      if (tokens.length === 0) {
        this.logger.log('No valid notification tokens found', 'FCM Skip');
        return;
      }

      // Final deduplication
      tokens = [...new Set(tokens)];

      this.logger.log(
        `Sending notifications to tokens: ${JSON.stringify(tokens)}`,
        'FCM Tokens',
      );

      try {
        const result = await this.firebaseService
          .getMessage()
          .sendEachForMulticast({
            tokens,
            data,
            notification,
            apns: {
              payload: {
                aps: {
                  contentAvailable: true,
                  priority: 'high',
                },
              },
            },
            android: {
              priority: 'high',
            },
          });

        this.logger.log(JSON.stringify(result), 'Notification Send');

        // Handle failed notifications
        if (result.failureCount > 0) {
          const invalidTokens: string[] = [];
          result.responses.forEach((response, index) => {
            if (!response.success) {
              this.logger.error(
                `Failed to send to token ${tokens[index]}: ${response.error?.message}`,
              );
              // Check if token is invalid/unregistered
              if (
                response.error?.code ===
                  'messaging/registration-token-not-registered' ||
                response.error?.code === 'messaging/invalid-registration-token'
              ) {
                invalidTokens.push(tokens[index]);
              }
            }
          });

          // Remove invalid tokens from user profile
          if (invalidTokens.length > 0) {
            try {
              const validTokens = tokens.filter(
                (token) => !invalidTokens.includes(token),
              );
              await this.firebaseService
                .getFireStore()
                .collection('profiles')
                .doc(receiver.uid)
                .update({
                  notification_tokens: validTokens,
                });
              this.logger.log(
                `Removed ${invalidTokens.length} invalid tokens for user ${receiver.uid}`,
                'FCM Token Cleanup',
              );
            } catch (updateError) {
              this.logger.error('Failed to update user tokens', updateError);
            }
          }
        }

        if (result.successCount > 0) {
          this.logger.log(
            `Successfully sent ${result.successCount} notifications`,
            'FCM Success',
          );
        }
      } catch (sendError) {
        this.logger.error(
          `Failed to send FCM notifications: ${sendError}`,
          'FCM Error',
        );
        throw sendError;
      }
    } catch (error) {
      this.logger.error(error, 'notification error');
    }
  }
}
