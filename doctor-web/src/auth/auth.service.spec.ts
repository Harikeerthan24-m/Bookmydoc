import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { FirebaseService } from '../firebase/firebase.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const mockFirebaseService = {
      getAuth: jest.fn(),
      getFireStore: jest.fn(),
      getFirestore: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: FirebaseService, useValue: mockFirebaseService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
