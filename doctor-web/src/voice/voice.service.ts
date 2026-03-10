// src/voice/voice.service.ts
import axios from 'axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class VoiceService {
  async createRealtimeToken() {
    const apiKey = process.env.OPENAI_API_KEY;
    const resp = await axios.post(
      'https://api.openai.com/v1/realtime/client_secrets',
      {
        session: {
          type: 'realtime',
          model: 'gpt-realtime',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    // resp.data.value is the ek_... token
    return {
      token: resp.data.value,
      session: resp.data.session, // optional, if you want client to know config
    };
  }
}
