import { Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';

@Module({
  imports: [FirebaseModule],
  providers: [BookingService],
  controllers: [BookingController],
})
export class BookingModule {}
