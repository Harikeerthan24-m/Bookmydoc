import {
  searchDoctorsInFirestore,
  persistVoiceChatHistory,
} from './agent.helpers';

jest.mock('firebase-admin', () => ({
  firestore: {
    Timestamp: {
      fromDate: jest.fn().mockImplementation((val) => val),
    },
    FieldValue: {
      serverTimestamp: jest.fn().mockReturnValue('mock-timestamp'),
    },
  },
}));

describe('agent.helpers', () => {
  describe('searchDoctorsInFirestore', () => {
    it('should query Firestore and return formatted results', async () => {
      // 1. Mock Firestore
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'doc1',
            data: () => ({
              display_name: 'Dr. Smith',
              location: { city: 'New York' },
              star_rating: 4.8,
            }),
          },
        ],
      } as any;

      const mockCollection = {
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue(mockQuerySnapshot),
      };

      const mockDb = {
        collection: jest.fn().mockReturnValue(mockCollection),
      } as any;

      // 2. Call the helper
      const specialty = 'Cardiologist';
      const results = await searchDoctorsInFirestore(mockDb, specialty);

      // 3. Assertions
      expect(mockDb.collection).toHaveBeenCalledWith('profiles');
      expect(mockCollection.where).toHaveBeenCalledWith('role', '==', 'doctor');
      expect(mockCollection.where).toHaveBeenCalledWith(
        'expertiseList',
        'array-contains',
        specialty,
      );
      expect(mockCollection.limit).toHaveBeenCalledWith(5);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        doctorId: 'doc1',
        name: 'Dr. Smith',
        specialization: 'Cardiologist',
        location: { city: 'New York', address: '', state: '' },
        rating: 4.8,
        experience: '',
        photoUrl: '',
        registrationNumber: '',
      });
    });

    it('should use default values when fields are missing', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'doc2',
            data: () => ({}), // missing all fields
          },
        ],
      } as any;

      const mockCollection = {
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue(mockQuerySnapshot),
      };

      const mockDb = {
        collection: jest.fn().mockReturnValue(mockCollection),
      } as any;

      const results = await searchDoctorsInFirestore(mockDb, 'General');

      expect(results[0].name).toBe('Doctor');
      expect(results[0].location).toEqual({
        city: 'Remote',
        address: '',
        state: '',
      });
      expect(results[0].rating).toBe(5);
    });
  });

  describe('persistVoiceChatHistory', () => {
    it('should skip non-message items to avoid undefined role errors', async () => {
      // 1. Mock DB Structure
      const mockSet = jest.fn();
      const mockAdd = jest.fn();
      const mockDocRef = {
        set: mockSet,
        collection: jest.fn().mockReturnValue({
          add: mockAdd,
          doc: jest.fn().mockReturnValue({ set: mockSet }),
        }),
      };

      const mockDb = {
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue(mockDocRef),
        }),
      } as any;

      // 2. Mock messages including a Tool Call (which has no role)
      const messages = [
        { type: 'message', role: 'user', textContent: 'hello', id: 'm1' },
        { type: 'function_call', id: 'fc1' }, // NO ROLE
        { type: 'message', role: 'assistant', textContent: 'hi', id: 'm2' },
      ];

      // 3. Call helper
      await persistVoiceChatHistory(
        mockDb,
        'user123',
        messages,
        'Cardiology',
        [],
      );

      // 4. Verify FC1 was skipped (only 2 calls to set for the messages loop)
      // Note: sequence also calls set on sessionRef (1 time) + loop (2 times) = 3 total sets
      expect(mockSet).toHaveBeenCalledTimes(3);
      expect(mockSet).not.toHaveBeenCalledWith(
        expect.objectContaining({ role: undefined }),
        expect.anything(),
      );
    });
  });
});
