import { Controller, Get, Logger, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { HealthService } from './health.service';

@ApiTags('health')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('ready')
  getReady() {
    Logger.log('health ready');
    return this.healthService.getReady();
  }

  @Get('live')
  getLiveness() {
    Logger.log('health live');
    return this.healthService.getLiveness();
  }
}
