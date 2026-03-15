import { Test, TestingModule } from '@nestjs/testing';
import { ServiceService } from './service.service';
import { FirebaseService } from '../firebase/firebase.service';

describe('ServiceService', () => {
  let service: ServiceService;

  beforeEach(async () => {
    const mockFirebaseService = {
      getAuth: jest.fn(),
      getFireStore: jest.fn(),
      getFirestore: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceService,
        { provide: FirebaseService, useValue: mockFirebaseService },
      ],
    }).compile();

    service = module.get<ServiceService>(ServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
