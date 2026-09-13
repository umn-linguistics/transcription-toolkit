/**
 * Tests for Profile class
 */

import { Profile } from './profile';

describe('Profile', () => {
  describe('constructor', () => {
    it('should create a profile from specs', () => {
      const profile = new Profile([
        { Grapheme: 'a', mapping: 'x' },
        { Grapheme: 'b', mapping: 'y' }
      ]);

      expect(profile.graphemes.size).toBe(2);
      expect(profile.graphemes.get('a')).toEqual({ mapping: 'x' });
      expect(profile.columnLabels.has('mapping')).toBe(true);
    });

    it('should throw error for empty grapheme', () => {
      expect(() => {
        new Profile([{ Grapheme: '' }]);
      }).toThrow('Grapheme must not be empty');
    });

    it('should throw error for missing Grapheme column', () => {
      expect(() => {
        new Profile([{ mapping: 'x' } as any]);
      }).toThrow('invalid grapheme specification');
    });
  });
});
