import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken } from 'livekit-server-sdk';
import { IEnv } from '@app/env.schema';

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  constructor(private readonly configService: ConfigService<IEnv>) {}

  async createRealtimeToken(userId: string, userName: string) {
    const apiKey = this.configService.get('LIVEKIT_API_KEY');
    const apiSecret = this.configService.get('LIVEKIT_API_SECRET');
    const wsUrl = this.configService.get('LIVEKIT_URL');

    if (!apiKey || !apiSecret || !wsUrl) {
      this.logger.error('LiveKit configuration is missing');
      throw new Error('LiveKit configuration is missing');
    }

    // Create a unique room for this user session or use a shared room
    // For personal assistants, a room per user session is typically best
    const roomName = `room-${userId}`;

    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: userName,
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return {
      token,
      url: wsUrl,
      roomName,
    };
  }
}
