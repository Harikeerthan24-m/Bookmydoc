import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getReady() {
    return { ready: true };
  }

  getLiveness() {
    return { live: true };
  }
}
