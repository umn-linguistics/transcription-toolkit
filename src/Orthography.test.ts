import { Orthography } from './Orthography';
import { GraphemeColumns } from './types';
import { Profile } from './segments/profile';

describe('Orthography', () => {
  describe('constructor', () => {
    test('initializes with valid headers', () => {
      const headers = [GraphemeColumns.grapheme];
      const orthography = new Orthography(headers);

      expect(orthography.headers).toEqual(headers);
      expect(orthography.graphemes).toEqual([]);
      expect(orthography.profile).toBeInstanceOf(Profile);
    });

    test('validates headers against GraphemeColumns', () => {
      const headers = ['character'];
      const orthography = new Orthography(headers);

      expect(orthography.headers).toEqual([GraphemeColumns.grapheme]);
    });

    test('handles multiple header columns', () => {
      const headers = ['character', 'extra_column'];
      const orthography = new Orthography(headers);

      // validHeaders should filter to only supported columns
      expect(orthography.headers).toContain('character');
    });
  });

  describe('load', () => {
    test('loads grapheme data from array', () => {
      const headers = ['character'];
      const orthography = new Orthography(headers);

      const data = [
        ['a'],
        ['b'],
        ['c']
      ];

      orthography.load(data);

      expect(orthography.graphemes).toHaveLength(3);
      expect(orthography.graphemes[0].grapheme).toBe('a');
      expect(orthography.graphemes[1].grapheme).toBe('b');
      expect(orthography.graphemes[2].grapheme).toBe('c');
    });

    test('loads IPA characters', () => {
      const headers = ['character'];
      const orthography = new Orthography(headers);

      const data = [
        ['ʧʰ'],
        ['á'],
        ['ɣ'],
        ['ĩ́'],
        ['t͡ʃʰ']
      ];

      orthography.load(data);

      expect(orthography.graphemes).toHaveLength(5);
      expect(orthography.graphemes[0].grapheme).toBe('ʧʰ');
      expect(orthography.graphemes[1].grapheme).toBe('á');
      expect(orthography.graphemes[2].grapheme).toBe('ɣ');
      expect(orthography.graphemes[3].grapheme).toBe('ĩ́');
      expect(orthography.graphemes[4].grapheme).toBe('t͡ʃʰ');
    });

    test('loads multi-character graphemes', () => {
      const headers = ['character'];
      const orthography = new Orthography(headers);

      const data = [
        ['tʃ'],
        ['dʒ'],
        ['ng'],
        ['ch']
      ];

      orthography.load(data);

      expect(orthography.graphemes).toHaveLength(4);
      expect(orthography.graphemes[0].grapheme).toBe('tʃ');
      expect(orthography.graphemes[1].grapheme).toBe('dʒ');
      expect(orthography.graphemes[2].grapheme).toBe('ng');
      expect(orthography.graphemes[3].grapheme).toBe('ch');
    });

    test('handles empty data array', () => {
      const headers = ['character'];
      const orthography = new Orthography(headers);

      orthography.load([]);

      expect(orthography.graphemes).toHaveLength(0);
      expect(orthography.profile).toBeInstanceOf(Profile);
    });

    test('overwrites existing graphemes when loading new data', () => {
      const headers = ['character'];
      const orthography = new Orthography(headers);

      orthography.load([['a'], ['b']]);
      expect(orthography.graphemes).toHaveLength(2);

      orthography.load([['x'], ['y'], ['z']]);
      expect(orthography.graphemes).toHaveLength(3);
      expect(orthography.graphemes[0].grapheme).toBe('x');
    });

    test('calls setProfile after loading data', () => {
      const headers = ['character'];
      const orthography = new Orthography(headers);

      const setProfileSpy = jest.spyOn(orthography, 'setProfile');

      orthography.load([['a'], ['b']]);

      expect(setProfileSpy).toHaveBeenCalled();
    });

    test('loads graphemes with diacritics and combining characters', () => {
      const headers = ['character'];
      const orthography = new Orthography(headers);

      const data = [
        ['á'],
        ['è'],
        ['ñ'],
        ['ç'],
        ['ø'],
        ['å']
      ];

      orthography.load(data);

      expect(orthography.graphemes).toHaveLength(6);
      expect(orthography.graphemes[0].grapheme).toBe('á');
      expect(orthography.graphemes[2].grapheme).toBe('ñ');
    });
  });

  describe('setProfile', () => {
    test('creates Profile from graphemes', () => {
      const headers = ['character'];
      const orthography = new Orthography(headers);

      orthography.load([['a'], ['b'], ['c']]);

      expect(orthography.profile).toBeInstanceOf(Profile);
    });

    test('profile contains all loaded graphemes', () => {
      const headers = ['character'];
      const orthography = new Orthography(headers);

      const data = [
        ['p'],
        ['t'],
        ['k']
      ];

      orthography.load(data);

      // The Profile should be created with the graphemes
      expect(orthography.profile).toBeDefined();
      expect(orthography.profile).toBeInstanceOf(Profile);
    });

    test('updates profile when graphemes change', () => {
      const headers = ['character'];
      const orthography = new Orthography(headers);

      orthography.load([['a'], ['b']]);
      const firstProfile = orthography.profile;

      orthography.load([['x'], ['y'], ['z']]);
      const secondProfile = orthography.profile;

      // Profile should be a new instance after reloading
      expect(secondProfile).not.toBe(firstProfile);
    });

    test('handles empty graphemes list', () => {
      const headers = ['character'];
      const orthography = new Orthography(headers);

      orthography.load([]);

      expect(orthography.profile).toBeInstanceOf(Profile);
    });

    test('creates profile with complex IPA graphemes', () => {
      const headers = ['character'];
      const orthography = new Orthography(headers);

      const data = [
        ['tʃ'],
        ['dʒ'],
        ['ŋ'],
        ['ʃ'],
        ['θ'],
        ['ð']
      ];

      orthography.load(data);

      expect(orthography.profile).toBeDefined();
      expect(orthography.graphemes).toHaveLength(6);
    });
  });

  describe('integration with Profile', () => {
    test('profile can be used for tokenization', () => {
      const headers = ['character'];
      const orthography = new Orthography(headers);

      const data = [
        ['a'],
        ['b'],
        ['c']
      ];

      orthography.load(data);

      // Profile should be usable by the Tokenizer
      expect(orthography.profile).toBeInstanceOf(Profile);
    });

    test('profile respects multi-character graphemes', () => {
      const headers = ['character'];
      const orthography = new Orthography(headers);

      // Load multi-character grapheme before single characters
      const data = [
        ['tʃ'],  // This should be treated as a single unit
        ['t'],
        ['ʃ']
      ];

      orthography.load(data);

      expect(orthography.graphemes).toHaveLength(3);
      expect(orthography.graphemes[0].grapheme).toBe('tʃ');
    });

    test('profile handles graphemes with special characters', () => {
      const headers = ['character'];
      const orthography = new Orthography(headers);

      const data = [
        ['-'],   // hyphen
        ['\''],  // apostrophe
        ['.']    // period
      ];

      orthography.load(data);

      expect(orthography.graphemes).toHaveLength(3);
    });
  });

  describe('edge cases', () => {
    test('handles graphemes with leading/trailing whitespace', () => {
      const headers = ['character'];
      const orthography = new Orthography(headers);

      const data = [
        [' a '],
        ['b'],
        [' c']
      ];

      orthography.load(data);

      expect(orthography.graphemes).toHaveLength(3);
      // Whitespace is trimmed from any characters
      expect(orthography.graphemes[0].grapheme).toBe('a');
      expect(orthography.graphemes[1].grapheme).toBe('b');
      expect(orthography.graphemes[2].grapheme).toBe('c');
    });

    test('handles empty string graphemes', () => {
      const headers = ['character'];
      const orthography = new Orthography(headers);

      const data = [
        [''],
        ['a'],
        ['']
      ];

      orthography.load(data);

      // empty string graphemes are filtered out
      expect(orthography.graphemes).toHaveLength(1);
      expect(orthography.graphemes[0].grapheme).toBe('a');
    });

    test('handles duplicate graphemes', () => {
      const headers = ['character'];

      const warningSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const orthography = new Orthography(headers);

      const data = [
        ['a'],
        ['b'],
        ['a'], // duplicate
        ['c']
      ];

      orthography.load(data);

      // Should result in duplicate grapheme warning
      expect(warningSpy).toHaveBeenCalledWith('line 4: duplicate grapheme in profile: a');
      expect(warningSpy).toHaveBeenCalledTimes(1);
      warningSpy.mockRestore()

      // All entries are loaded, including duplicates
      expect(orthography.graphemes).toHaveLength(4);
      expect(orthography.graphemes[0].grapheme).toBe('a');
      expect(orthography.graphemes[2].grapheme).toBe('a');
    });

    test('handles very long grapheme strings', () => {
      const headers = ['character'];
      const orthography = new Orthography(headers);

      const longGrapheme = 'a'.repeat(100);
      const data = [[longGrapheme]];

      orthography.load(data);

      expect(orthography.graphemes).toHaveLength(1);
      expect(orthography.graphemes[0].grapheme).toBe(longGrapheme);
    });

    test('handles unicode normalization differences', () => {
      const headers = ['character'];
      const orthography = new Orthography(headers);

      // é can be represented as:
      // - Single character: U+00E9 (NFC)
      // - Two characters: e + combining acute accent (NFD)
      const data = [
        ['é'],      // NFC form
        ['e\u0301'] // NFD form (e + combining acute)
      ];

      orthography.load(data);

      expect(orthography.graphemes).toHaveLength(2);
      // Both forms are preserved as loaded
    });

    test('handles graphemes with emoji', () => {
      const headers = ['character'];
      const orthography = new Orthography(headers);

      const data = [
        ['a'],
        ['😀'],
        ['b']
      ];

      orthography.load(data);

      expect(orthography.graphemes).toHaveLength(3);
      expect(orthography.graphemes[1].grapheme).toBe('😀');
    });

    test('maintains grapheme order from input data', () => {
      const headers = ['character'];
      const orthography = new Orthography(headers);

      const data = [
        ['z'],
        ['a'],
        ['m'],
        ['b']
      ];

      orthography.load(data);

      expect(orthography.graphemes[0].grapheme).toBe('z');
      expect(orthography.graphemes[1].grapheme).toBe('a');
      expect(orthography.graphemes[2].grapheme).toBe('m');
      expect(orthography.graphemes[3].grapheme).toBe('b');
    });
  });

  describe('real-world language examples', () => {
    test('loads orthography 1 characters', () => {
      const headers = ['character'];
      const orthography = new Orthography(headers);

      const data = [
        ['a'],
        ['á'],
        ['ȟ'],
        ['č'],
        ['ǧ'],
        ['ŋ'],
        ['š'],
        ['ž']
      ];

      orthography.load(data);

      expect(orthography.graphemes).toHaveLength(8);
      expect(orthography.graphemes[2].grapheme).toBe('ȟ');
      expect(orthography.graphemes[3].grapheme).toBe('č');
    });

    test('loads orthography 2 characters', () => {
      const headers = ['character'];
      const orthography = new Orthography(headers);

      const data = [
        ['a'],
        ['ñ'],
        ['á'],
        ['é'],
        ['í'],
        ['ó'],
        ['ú'],
        ['ü']
      ];

      orthography.load(data);

      expect(orthography.graphemes).toHaveLength(8);
      expect(orthography.graphemes[1].grapheme).toBe('ñ');
    });

    test('loads orthography 3 characters', () => {
      const headers = ['character'];
      const orthography = new Orthography(headers);

      const data = [
        ['a'],
        ['à'],
        ['á'],
        ['ả'],
        ['ã'],
        ['ạ'],
        ['ă'],
        ['â']
      ];

      orthography.load(data);

      expect(orthography.graphemes).toHaveLength(8);
    });
  });
});
