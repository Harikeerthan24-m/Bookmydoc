import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { DoctorModule } from '../doctor/doctor.module';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [DoctorModule, FirebaseModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
