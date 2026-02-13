import { Test, TestingModule } from '@nestjs/testing';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('AppController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService],
    }).compile();

    controller = app.get<HealthController>(HealthController);
  });

  describe('Health controller', () => {
    it('Ready should return true', () => {
      expect(controller.getReady()?.ready).toBe(true);
    });

    it('Live should return true', () => {
      expect(controller.getLiveness()?.live).toBe(true);
    });
  });
});
