import { Gloss } from './Gloss';
import { MorphemeColumns } from './types';

describe('Gloss', () => {
  describe('constructor', () => {
    test('initializes with valid headers', () => {
      const headers = [MorphemeColumns.morpheme];
      const gloss = new Gloss(headers);

      expect(gloss.headers).toEqual(headers);
      expect(gloss.rows).toEqual([]);
      expect(gloss.validMorphemeLabels).toEqual([]);
    });

    test('validates headers against MorphemeColumns', () => {
      const headers = ['gloss_abbreviation'];
      const gloss = new Gloss(headers);

      expect(gloss.headers).toEqual([MorphemeColumns.morpheme]);
    });

    test('handles multiple header columns', () => {
      const headers = ['gloss_abbreviation', 'extra_column'];
      const gloss = new Gloss(headers);

      // validHeaders should filter to only supported columns
      expect(gloss.headers).toContain('gloss_abbreviation');
    });
  });

  describe('load', () => {
    test('loads morpheme tag data from array', () => {
      const headers = ['gloss_abbreviation'];
      const gloss = new Gloss(headers);

      const data = [
        ['PASS'],
        ['MID'],
        ['ACT']
      ];

      gloss.load(data);

      expect(gloss.rows).toHaveLength(3);
      expect(gloss.rows[0].morpheme_tag).toBe('PASS');
      expect(gloss.rows[1].morpheme_tag).toBe('MID');
      expect(gloss.rows[2].morpheme_tag).toBe('ACT');
    });

    test('populates validMorphemeLabels array', () => {
      const headers = ['gloss_abbreviation'];
      const gloss = new Gloss(headers);

      const data = [
        ['ANIM'],
        ['NFIN'],
        ['NEG'],
        ['PRS']
      ];

      gloss.load(data);

      expect(gloss.validMorphemeLabels).toHaveLength(4);
      expect(gloss.validMorphemeLabels).toEqual(['ANIM', 'NFIN', 'NEG', 'PRS']);
    });

    test('handles empty data array', () => {
      const headers = ['gloss_abbreviation'];
      const gloss = new Gloss(headers);

      gloss.load([]);

      expect(gloss.rows).toHaveLength(0);
      expect(gloss.validMorphemeLabels).toEqual([]);
    });

    test('overwrites existing data when loading new data', () => {
      const headers = ['gloss_abbreviation'];
      const gloss = new Gloss(headers);

      gloss.load([['ANIM'], ['PRS']]);
      expect(gloss.rows).toHaveLength(2);
      expect(gloss.validMorphemeLabels).toEqual(['ANIM', 'PRS']);

      gloss.load([['ACT'], ['PASS'], ['MID']]);
      expect(gloss.rows).toHaveLength(3);
      expect(gloss.validMorphemeLabels).toEqual(['ACT', 'PASS', 'MID']);
    });

    test('handles morpheme tags with special characters', () => {
      const headers = ['gloss_abbreviation'];
      const gloss = new Gloss(headers);

      const data = [
        ['1>2'],
        ['APPL>BEN'],
        ['NEG.PST'],
        ['3-PL']
      ];

      gloss.load(data);

      expect(gloss.rows).toHaveLength(4);
      expect(gloss.rows[0].morpheme_tag).toBe('1>2');
      expect(gloss.rows[2].morpheme_tag).toBe('NEG.PST');
    });

    test('handles duplicate morpheme tags', () => {
      const headers = ['gloss_abbreviation'];
      const gloss = new Gloss(headers);

      const data = [
        ['PASS'],
        ['MID'],
        ['PASS'], // duplicate
        ['ACT']
      ];

      gloss.load(data);

      // duplicate morpheme tags are removed
      expect(gloss.rows).toHaveLength(3);
      expect(gloss.validMorphemeLabels).toHaveLength(3);
      expect(gloss.validMorphemeLabels[0]).toBe('PASS');
      expect(gloss.validMorphemeLabels[2]).toBe('ACT');
    });

    test('handles empty string morpheme tags', () => {
      const headers = ['gloss_abbreviation'];
      const gloss = new Gloss(headers);

      const data = [
        [''],
        ['MID'],
        ['']
      ];

      gloss.load(data);

      expect(gloss.rows).toHaveLength(1);
      expect(gloss.validMorphemeLabels).toHaveLength(1);
      expect(gloss.validMorphemeLabels[0]).toBe('MID');
    });

    test('preserves morpheme tag case', () => {
      const headers = ['gloss_abbreviation'];
      const gloss = new Gloss(headers);

      const data = [
        ['DET'],
        ['Det'],
        ['det']
      ];

      gloss.load(data);

      expect(gloss.rows[0].morpheme_tag).toBe('DET');
      expect(gloss.rows[1].morpheme_tag).toBe('Det');
      expect(gloss.rows[2].morpheme_tag).toBe('det');
    });

    test('handles morpheme tags with whitespace', () => {
      const headers = ['gloss_abbreviation'];
      const gloss = new Gloss(headers);

      const data = [
        [' DET '],
        ['N'],
        [' V']
      ];

      gloss.load(data);

      expect(gloss.rows[0].morpheme_tag).toBe('DET');
      expect(gloss.rows[2].morpheme_tag).toBe('V');
    });
  });

  describe('validMorphemeLabels', () => {
    test('provides list for validation purposes', () => {
      const headers = ['gloss_abbreviation'];
      const gloss = new Gloss(headers);

      const data = [
        ['ACT'],
        ['MID'],
        ['PASS'],
        ['INF']
      ];

      gloss.load(data);

      // Can be used to check if a morpheme tag is valid
      expect(gloss.validMorphemeLabels.includes('ACT')).toBe(true);
      expect(gloss.validMorphemeLabels.includes('MID')).toBe(true);
      expect(gloss.validMorphemeLabels.includes('INVALID')).toBe(false);
    });

    test('updates when data is reloaded', () => {
      const headers = ['gloss_abbreviation'];
      const gloss = new Gloss(headers);

      gloss.load([['DET'], ['N']]);
      expect(gloss.validMorphemeLabels).toEqual(['DET', 'N']);

      gloss.load([['V'], ['ADJ']]);
      expect(gloss.validMorphemeLabels).toEqual(['V', 'ADJ']);
    });

    test('maintains order from input data', () => {
      const headers = ['gloss_abbreviation'];
      const gloss = new Gloss(headers);

      const data = [
        ['Z'],
        ['A'],
        ['M'],
        ['B']
      ];

      gloss.load(data);

      // Order should match input, not alphabetical
      expect(gloss.validMorphemeLabels[0]).toBe('Z');
      expect(gloss.validMorphemeLabels[1]).toBe('A');
      expect(gloss.validMorphemeLabels[2]).toBe('M');
      expect(gloss.validMorphemeLabels[3]).toBe('B');
    });
  });

  describe('edge cases', () => {
    test('handles very long morpheme tags', () => {
      const headers = ['gloss_abbreviation'];
      const gloss = new Gloss(headers);

      const longTag = 'A'.repeat(100);
      const data = [[longTag]];

      gloss.load(data);

      expect(gloss.rows).toHaveLength(1);
      expect(gloss.rows[0].morpheme_tag).toBe(longTag);
    });

    test('handles morpheme tags with numbers', () => {
      const headers = ['gloss_abbreviation'];
      const gloss = new Gloss(headers);

      const data = [
        ['1SG'],
        ['2SG'],
        ['3PL.M'],
        ['NUM123']
      ];

      gloss.load(data);

      expect(gloss.rows).toHaveLength(4);
      expect(gloss.rows[3].morpheme_tag).toBe('NUM123');
    });

    test('handles morpheme tags with mixed separators', () => {
      const headers = ['gloss_abbreviation'];
      const gloss = new Gloss(headers);

      const data = [
        ['NEG-PST'],
        ['3.PL.M'],
        ['CAUS>APPL'],
        ['1_SG_NOM']
      ];

      gloss.load(data);

      expect(gloss.rows).toHaveLength(4);
      expect(gloss.rows[0].morpheme_tag).toBe('NEG-PST');
      expect(gloss.rows[1].morpheme_tag).toBe('3.PL.M');
      expect(gloss.rows[2].morpheme_tag).toBe('CAUS>APPL');
      expect(gloss.rows[3].morpheme_tag).toBe('1_SG_NOM');
    });
  });
});
