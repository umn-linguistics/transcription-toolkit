import { Elan } from './Elan';
import { ElanColumns } from './types';

describe('Elan', () => {
  describe('constructor', () => {
    test('initializes with tier name', () => {
      const tierName = 'utterance';
      const elan = new Elan(tierName);

      expect(elan.idTier).toBe('utterance');
      expect(elan.rows).toEqual([]);
      expect(elan.validMorphemeLabels).toEqual([]);
    });

    test('accepts custom tier names', () => {
      const elan = new Elan('custom_tier');

      expect(elan.idTier).toBe('custom_tier');
    });

    test('initializes with IPA tier name', () => {
      const elan = new Elan('ipa_transcription');

      expect(elan.idTier).toBe('ipa_transcription');
    });
  });

  describe('load', () => {
    test('loads ELAN export data with standard format', () => {
      const tierName = 'utterance';
      const elan = new Elan(tierName);

      const data = [
        ['utterance', 'Begin Time - ss.msec', 'End Time - ss.msec', 'Duration - ss.msec'],
        ['hello world', '0.000', '2.500', '2.500'],
        ['goodbye', '3.000', '5.000', '2.000']
      ];

      elan.load(data);

      expect(elan.rows).toHaveLength(2);
      expect(elan.rows[0].id).toBe('hello world');
      expect(elan.rows[0].beginTime).toBe('0.000');
      expect(elan.rows[0].endTime).toBe('2.500');
      expect(elan.rows[0].duration).toBe('2.500');
      expect(elan.rows[1].id).toBe('goodbye');
    });

    test('loads numeric IDs', () => {
      const tierName = 'id';
      const elan = new Elan(tierName);

      const data = [
        ['id', 'Begin Time - ss.msec', 'End Time - ss.msec', 'Duration - ss.msec'],
        ['1', '0.000', '2.500', '2.500'],
        ['2', '3.000', '5.000', '2.000']
      ];

      elan.load(data);

      expect(elan.rows).toHaveLength(2);
      expect(elan.rows[0].id).toBe('1');
      expect(elan.rows[1].id).toBe('2');
    });

    test('handles columns in different order', () => {
      const tierName = 'utterance';
      const elan = new Elan(tierName);

      const data = [
        ['Duration - ss.msec', 'utterance', 'End Time - ss.msec', 'Begin Time - ss.msec'],
        ['2.500', 'hello world', '2.500', '0.000'],
        ['2.000', 'goodbye', '5.000', '3.000']
      ];

      elan.load(data);

      expect(elan.rows).toHaveLength(2);
      expect(elan.rows[0].id).toBe('hello world');
      expect(elan.rows[0].beginTime).toBe('0.000');
      expect(elan.rows[0].endTime).toBe('2.500');
      expect(elan.rows[0].duration).toBe('2.500');
    });

    test('handles extra columns in ELAN export', () => {
      const tierName = 'utterance';
      const elan = new Elan(tierName);

      const data = [
        ['utterance', 'Begin Time - ss.msec', 'End Time - ss.msec', 'Duration - ss.msec', 'Extra Column', 'Another Column'],
        ['hello world', '0.000', '2.500', '2.500', 'extra1', 'extra2'],
        ['goodbye', '3.000', '5.000', '2.000', 'extra3', 'extra4']
      ];

      elan.load(data);

      expect(elan.rows).toHaveLength(2);
      expect(elan.rows[0].id).toBe('hello world');
      expect(elan.rows[0].beginTime).toBe('0.000');
    });

    test('overwrites existing data when loading new data', () => {
      const tierName = 'utterance';
      const elan = new Elan(tierName);

      const data1 = [
        ['utterance', 'Begin Time - ss.msec', 'End Time - ss.msec', 'Duration - ss.msec'],
        ['first', '0.000', '1.000', '1.000']
      ];

      elan.load(data1);
      expect(elan.rows).toHaveLength(1);
      expect(elan.rows[0].id).toBe('first');

      const data2 = [
        ['utterance', 'Begin Time - ss.msec', 'End Time - ss.msec', 'Duration - ss.msec'],
        ['second', '2.000', '3.000', '1.000'],
        ['third', '4.000', '6.000', '2.000']
      ];

      elan.load(data2);
      expect(elan.rows).toHaveLength(2);
      expect(elan.rows[0].id).toBe('second');
      expect(elan.rows[1].id).toBe('third');
    });

    test('handles empty data array', () => {
      const tierName = 'utterance';
      const elan = new Elan(tierName);

      elan.load([]);

      expect(elan.rows).toHaveLength(0);
    });

    test('handles header row only', () => {
      const tierName = 'utterance';
      const elan = new Elan(tierName);

      const data = [
        ['utterance', 'Begin Time - ss.msec', 'End Time - ss.msec', 'Duration - ss.msec']
      ];

      elan.load(data);

      expect(elan.rows).toHaveLength(0);
    });

    test('handles missing columns gracefully', () => {
      const tierName = 'utterance';
      const elan = new Elan(tierName);

      // Missing 'Duration - ss.msec' column
      const data = [
        ['utterance', 'Begin Time - ss.msec', 'End Time - ss.msec'],
        ['hello world', '0.000', '2.500']
      ];

      elan.load(data);

      // Should not process rows since not all required columns are present
      expect(elan.rows).toHaveLength(0);
    });

    test('handles missing tier name column', () => {
      const tierName = 'missing_tier';
      const elan = new Elan(tierName);

      const data = [
        ['utterance', 'Begin Time - ss.msec', 'End Time - ss.msec', 'Duration - ss.msec'],
        ['hello world', '0.000', '2.500', '2.500']
      ];

      elan.load(data);

      // Should not process rows since tier name column is not found
      expect(elan.rows).toHaveLength(0);
    });

    test('loads timing data with millisecond precision', () => {
      const tierName = 'utterance';
      const elan = new Elan(tierName);

      const data = [
        ['utterance', 'Begin Time - ss.msec', 'End Time - ss.msec', 'Duration - ss.msec'],
        ['test', '0.123', '2.456', '2.333'],
        ['test2', '10.987', '15.654', '4.667']
      ];

      elan.load(data);

      expect(elan.rows).toHaveLength(2);
      expect(elan.rows[0].beginTime).toBe('0.123');
      expect(elan.rows[0].endTime).toBe('2.456');
      expect(elan.rows[0].duration).toBe('2.333');
      expect(elan.rows[1].beginTime).toBe('10.987');
    });

    test('handles special characters in ID tier', () => {
      const tierName = 'utterance';
      const elan = new Elan(tierName);

      const data = [
        ['utterance', 'Begin Time - ss.msec', 'End Time - ss.msec', 'Duration - ss.msec'],
        ['hello-world', '0.000', '2.500', '2.500'],
        ['goodbye_friend', '3.000', '5.000', '2.000'],
        ['test.item', '6.000', '8.000', '2.000']
      ];

      elan.load(data);

      expect(elan.rows).toHaveLength(3);
      expect(elan.rows[0].id).toBe('hello-world');
      expect(elan.rows[1].id).toBe('goodbye_friend');
      expect(elan.rows[2].id).toBe('test.item');
    });

    test('handles Unicode characters in ID tier', () => {
      const tierName = 'utterance';
      const elan = new Elan(tierName);

      const data = [
        ['utterance', 'Begin Time - ss.msec', 'End Time - ss.msec', 'Duration - ss.msec'],
        ['你好', '0.000', '2.500', '2.500'],
        ['مرحبا', '3.000', '5.000', '2.000'],
        ['Здравствуйте', '6.000', '9.000', '3.000']
      ];

      elan.load(data);

      expect(elan.rows).toHaveLength(3);
      expect(elan.rows[0].id).toBe('你好');
      expect(elan.rows[1].id).toBe('مرحبا');
      expect(elan.rows[2].id).toBe('Здравствуйте');
    });

    test('handles empty string values', () => {
      const tierName = 'utterance';
      const elan = new Elan(tierName);

      const data = [
        ['utterance', 'Begin Time - ss.msec', 'End Time - ss.msec', 'Duration - ss.msec'],
        ['', '0.000', '2.500', '2.500'],
        ['test', '', '', '']
      ];

      elan.load(data);

      expect(elan.rows).toHaveLength(2);
      expect(elan.rows[0].id).toBe('');
      expect(elan.rows[1].beginTime).toBe('');
      expect(elan.rows[1].endTime).toBe('');
    });

    test('handles duplicate IDs', () => {
      const tierName = 'utterance';
      const elan = new Elan(tierName);

      const data = [
        ['utterance', 'Begin Time - ss.msec', 'End Time - ss.msec', 'Duration - ss.msec'],
        ['hello', '0.000', '2.500', '2.500'],
        ['hello', '3.000', '5.000', '2.000']
      ];

      elan.load(data);

      // Both entries should be loaded
      expect(elan.rows).toHaveLength(2);
      expect(elan.rows[0].id).toBe('hello');
      expect(elan.rows[0].beginTime).toBe('0.000');
      expect(elan.rows[1].id).toBe('hello');
      expect(elan.rows[1].beginTime).toBe('3.000');
    });

    test('handles large datasets', () => {
      const tierName = 'id';
      const elan = new Elan(tierName);

      const data = [
        ['id', 'Begin Time - ss.msec', 'End Time - ss.msec', 'Duration - ss.msec']
      ];

      // Add 100 rows
      for (let i = 0; i < 100; i++) {
        data.push([
          String(i),
          String(i * 1.5),
          String((i + 1) * 1.5),
          '1.5'
        ]);
      }

      elan.load(data);

      expect(elan.rows).toHaveLength(100);
      expect(elan.rows[0].id).toBe('0');
      expect(elan.rows[99].id).toBe('99');
    });
  });

  describe('columnRowFound', () => {
    test('returns true when all columns are found', () => {
      const tierName = 'utterance';
      const elan = new Elan(tierName);

      const data = [
        ['utterance', 'Begin Time - ss.msec', 'End Time - ss.msec', 'Duration - ss.msec'],
        ['hello', '0.000', '2.500', '2.500']
      ];

      elan.load(data);

      // If data loads successfully, columnRowFound returned true
      expect(elan.rows).toHaveLength(1);
    });

    test('returns false when columns are missing', () => {
      const tierName = 'utterance';
      const elan = new Elan(tierName);

      const data = [
        ['utterance', 'Begin Time - ss.msec'], // Missing columns
        ['hello', '0.000']
      ];

      elan.load(data);

      // If no data loads, columnRowFound returned false
      expect(elan.rows).toHaveLength(0);
    });
  });

  describe('real-world ELAN export examples', () => {
    test('loads ELAN export with long-form utterances', () => {
      const tierName = 'utterance';
      const elan = new Elan(tierName);

      const data = [
        ['utterance', 'Begin Time - ss.msec', 'End Time - ss.msec', 'Duration - ss.msec'],
        ['The quick brown fox jumps over the lazy dog', '0.000', '5.500', '5.500'],
        ['This is a longer utterance with multiple words and phrases', '6.000', '12.000', '6.000']
      ];

      elan.load(data);

      expect(elan.rows).toHaveLength(2);
      expect(elan.rows[0].id).toBe('The quick brown fox jumps over the lazy dog');
      expect(elan.rows[1].id).toBe('This is a longer utterance with multiple words and phrases');
    });

    test('loads ELAN export with integer time values', () => {
      const tierName = 'id';
      const elan = new Elan(tierName);

      const data = [
        ['id', 'Begin Time - ss.msec', 'End Time - ss.msec', 'Duration - ss.msec'],
        ['1', '0', '1000', '1000'],
        ['2', '1000', '2000', '1000'],
        ['3', '2000', '3500', '1500']
      ];

      elan.load(data);

      expect(elan.rows).toHaveLength(3);
      expect(elan.rows[0].beginTime).toBe('0');
      expect(elan.rows[0].duration).toBe('1000');
    });

    test('loads ELAN export with custom tier name', () => {
      const tierName = 'Speaker A';
      const elan = new Elan(tierName);

      const data = [
        ['Speaker A', 'Begin Time - ss.msec', 'End Time - ss.msec', 'Duration - ss.msec'],
        ['Hello', '0.000', '1.500', '1.500'],
        ['How are you?', '2.000', '3.500', '1.500']
      ];

      elan.load(data);

      expect(elan.rows).toHaveLength(2);
      expect(elan.rows[0].id).toBe('Hello');
      expect(elan.rows[1].id).toBe('How are you?');
    });
  });

  describe('edge cases', () => {
    test('handles rows with extra whitespace', () => {
      const tierName = 'utterance';
      const elan = new Elan(tierName);

      const data = [
        ['utterance', 'Begin Time - ss.msec', 'End Time - ss.msec', 'Duration - ss.msec'],
        ['  hello  ', '  0.000  ', '  2.500  ', '  2.500  ']
      ];

      elan.load(data);

      expect(elan.rows).toHaveLength(1);
      // Values are loaded as-is, including whitespace
      expect(elan.rows[0].id).toBe('  hello  ');
    });

    test('handles header row appearing mid-data', () => {
      const tierName = 'utterance';
      const elan = new Elan(tierName);

      const data = [
        ['some', 'random', 'data', 'here'],
        ['utterance', 'Begin Time - ss.msec', 'End Time - ss.msec', 'Duration - ss.msec'],
        ['hello', '0.000', '2.500', '2.500']
      ];

      elan.load(data);

      // Should find the header row and load data after it
      expect(elan.rows).toHaveLength(1);
      expect(elan.rows[0].id).toBe('hello');
    });

    test('handles zero duration annotations', () => {
      const tierName = 'utterance';
      const elan = new Elan(tierName);

      const data = [
        ['utterance', 'Begin Time - ss.msec', 'End Time - ss.msec', 'Duration - ss.msec'],
        ['instant', '5.000', '5.000', '0.000']
      ];

      elan.load(data);

      expect(elan.rows).toHaveLength(1);
      expect(elan.rows[0].duration).toBe('0.000');
    });

    test('handles negative time values', () => {
      const tierName = 'utterance';
      const elan = new Elan(tierName);

      const data = [
        ['utterance', 'Begin Time - ss.msec', 'End Time - ss.msec', 'Duration - ss.msec'],
        ['before_start', '-1.000', '0.000', '1.000']
      ];

      elan.load(data);

      expect(elan.rows).toHaveLength(1);
      expect(elan.rows[0].beginTime).toBe('-1.000');
    });

    test('handles very large time values', () => {
      const tierName = 'utterance';
      const elan = new Elan(tierName);

      const data = [
        ['utterance', 'Begin Time - ss.msec', 'End Time - ss.msec', 'Duration - ss.msec'],
        ['late', '99999.999', '100000.000', '0.001']
      ];

      elan.load(data);

      expect(elan.rows).toHaveLength(1);
      expect(elan.rows[0].beginTime).toBe('99999.999');
    });
  });
});
