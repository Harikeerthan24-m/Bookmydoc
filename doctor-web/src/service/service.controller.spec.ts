import { Test, TestingModule } from '@nestjs/testing';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';
import { FirebaseService } from '../firebase/firebase.service';

describe('ServiceController', () => {
  let controller: ServiceController;

  beforeEach(async () => {
    const mockServiceService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const mockFirebaseService = {
      getAuth: jest.fn(),
      getFireStore: jest.fn(),
      getFirestore: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceController],
      providers: [
        { provide: ServiceService, useValue: mockServiceService },
        { provide: FirebaseService, useValue: mockFirebaseService },
      ],
    }).compile();

    controller = module.get<ServiceController>(ServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
