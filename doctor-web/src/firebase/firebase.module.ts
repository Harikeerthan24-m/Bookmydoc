import { Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { FirebaseNotificationService } from './firebase-notification.service';

@Module({
  providers: [FirebaseService, FirebaseNotificationService],
  exports: [FirebaseService, FirebaseNotificationService],
})
export class FirebaseModule {}
