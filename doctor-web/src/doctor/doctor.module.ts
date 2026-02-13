import { Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';

@Module({
  imports: [FirebaseModule],
  providers: [DoctorService],
  controllers: [DoctorController],
})
export class DoctorModule {}
