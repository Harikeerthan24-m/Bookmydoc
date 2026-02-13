import { Test, TestingModule } from '@nestjs/testing';

import { HealthService } from './health.service';

describe('AppController', () => {
  let service: HealthService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [HealthService],
    }).compile();

    service = app.get<HealthService>(HealthService);
  });

  describe('Health service', () => {
    it('Ready should return true', () => {
      expect(service.getReady()?.ready).toBe(true);
    });

    it('Live should return true', () => {
      expect(service.getLiveness()?.live).toBe(true);
    });
  });
});
