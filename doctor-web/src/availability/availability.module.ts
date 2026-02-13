import { Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';

@Module({
  imports: [FirebaseModule],
  providers: [AvailabilityService],
  controllers: [AvailabilityController],
})
export class AvailabilityModule {}
