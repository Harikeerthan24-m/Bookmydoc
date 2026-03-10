import { IRole } from '@app/common/types/type';
import { VoiceService } from './voice.service';
import { Controller, Post } from '@nestjs/common';
import { Roles } from '@app/auth/decorators/roles.decorator';

// src/voice/voice.controller.ts
@Controller('voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Post('realtime-token')
  @Roles(IRole.CUSTOMER, IRole.ADMIN)
  async getRealtimeToken() {
    const data = await this.voiceService.createRealtimeToken();
    return {
      statusCode: 200,
      data,
      message: 'Realtime token created',
    };
  }
}
