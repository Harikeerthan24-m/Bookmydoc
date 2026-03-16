import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { FirebaseService } from '../firebase/firebase.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const mockFirebaseService = {
      getAuth: jest.fn(),
      getFireStore: jest.fn(),
      getFirestore: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: FirebaseService, useValue: mockFirebaseService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
