import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseService } from '@app/firebase/firebase.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const mockFirebaseService = {
      getFireStore: jest.fn(() => ({
        collection: jest.fn(() => ({
          where: jest.fn(() => ({
            get: jest.fn(() => ({ docs: [], empty: true })),
          })),
        })),
      })),
      collections: { health_tips: 'health_tips' },
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: FirebaseService, useValue: mockFirebaseService },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return facts', async () => {
      const result = await appController.getFacts({});
      expect(result).toBeDefined();
    });
  });
});
