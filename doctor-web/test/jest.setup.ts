// Mock FirebaseService
jest.mock('../src/firebase/firebase.service', () => ({
  FirebaseService: jest.fn().mockImplementation(() => ({
    auth: {
      verifyIdToken: jest.fn(),
      getUser: jest.fn(),
      createUser: jest.fn(),
    },
    firestore: {
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn(),
          set: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        })),
        add: jest.fn(),
        where: jest.fn(),
        get: jest.fn(),
      })),
    },
  })),
}));

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
    getUser: jest.fn(),
    createUser: jest.fn(),
  })),
  firestore: jest.fn(() => ({
    collection: jest.fn(),
  })),
}));
