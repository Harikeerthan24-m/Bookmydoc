import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RolesGuard } from '@app/auth/guard/roles.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { IRole } from '@app/common/types/type';
import { VoiceService } from './voice.service';

@Controller('voice')
@ApiBearerAuth()
@ApiTags('voice')
@UseGuards(RolesGuard)
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Post('realtime-token')
  @Roles(IRole.CUSTOMER, IRole.ADMIN)
  @ApiOperation({
    summary: 'Generate a LiveKit token for realtime AI voice session',
  })
  @ApiResponse({ status: 200, description: 'Token generated successfully' })
  async getRealtimeToken(@Req() req: any) {
    const userId = req?.user?.uid || req?.user?.userId;
    const userName = req?.user?.name || 'User';

    const result = await this.voiceService.createRealtimeToken(
      userId,
      userName,
    );
    return {
      statusCode: 200,
      data: result,
      message: 'Token generated successfully',
    };
  }
}
