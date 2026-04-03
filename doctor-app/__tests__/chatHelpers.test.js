import { getDateLabel, buildListWithDateSections } from '../utils/chatHelpers';

describe('chatHelpers', () => {
  describe('getDateLabel', () => {
    it('returns null for empty input', () => {
      expect(getDateLabel(null)).toBeNull();
      expect(getDateLabel('')).toBeNull();
    });

    it('returns "Today" for current date', () => {
      const today = new Date().toISOString();
      expect(getDateLabel(today)).toBe('Today');
    });

    it('returns "Yesterday" for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(getDateLabel(yesterday.toISOString())).toBe('Yesterday');
    });

    it('returns formatted date for older dates', () => {
      const oldDate = new Date('2023-01-15T12:00:00Z').toISOString();
      // Depending on timezone, this might be 15/01/2023 or 1 selection
      // But the logic uses getFullYear/Month/Date which is consistent
      expect(getDateLabel(oldDate)).toBe('15/01/2023');
    });
  });

  describe('buildListWithDateSections', () => {
    it('returns an empty list for empty input', () => {
      expect(buildListWithDateSections([])).toEqual([]);
    });

    it('inserts date headers correctly', () => {
      const messages = [
        { id: '1', content: 'Message 1', createdAt: '2023-01-15T10:00:00Z' },
        { id: '2', content: 'Message 2', createdAt: '2023-01-15T11:00:00Z' },
        { id: '3', content: 'Message 3', createdAt: '2023-01-16T10:00:00Z' },
      ];

      const result = buildListWithDateSections(messages);

      // Should have 5 items: Date Header(15th), Msg 1, Msg 2, Date Header(16th), Msg 3
      expect(result).toHaveLength(5);
      expect(result[0].type).toBe('date');
      expect(result[0].label).toBe('15/01/2023');
      expect(result[1].id).toBe('1');
      expect(result[2].id).toBe('2');
      expect(result[3].type).toBe('date');
      expect(result[3].label).toBe('16/01/2023');
      expect(result[4].id).toBe('3');
    });

    it('handles messages without createdAt by using current date', () => {
      const messages = [{ id: '1', content: 'No date' }];
      const result = buildListWithDateSections(messages);
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('date');
      expect(result[0].label).toBe('Today');
    });
  });
});
