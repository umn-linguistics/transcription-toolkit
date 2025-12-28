import { Transcript } from './Transcript';
import { Elan } from './Elan';
import { TranscriptColumns, ElanColumns } from './types';
import { Profile } from '@enfrank/segments-js';
//const Transcript = require('./Transcript');

test('load transcript', () => {
  const baseColumns = Object.values(TranscriptColumns);
  let t = new Transcript(baseColumns);
  //let t = new Transcript(["id", "gloss"]);
  t.load([["col 1 val", "col 2 val"],["col 1 val next", "col 2 val next"]])
  expect(t.rows.length).toBe(2);
});

test('parses multiple words into separate concordance rows', () => {
  const rows = [['123', 'the cat', 'DET N', 'the cat', '', '', '', '']];
  const headers = Object.values(TranscriptColumns);

  const transcript = new Transcript(headers);
  transcript.load(rows);
  const result = transcript.concordance();

  expect(result).toHaveLength(2);
  expect(result[0]).toEqual({
    id: '123',
    word: 'the',
    wordGloss: 'DET',
    wordIndex: 0,
    utterance: 'the cat',
    utteranceGloss: 'DET N'
  });
  expect(result[1]).toEqual({
    id: '123',
    word: 'cat',
    wordGloss: 'N',
    wordIndex: 1,
    utterance: 'the cat',
    utteranceGloss: 'DET N'
  });
});

test('validateGraphemes returns empty array when all graphemes are valid', () => {
  const headers = Object.values(TranscriptColumns);
  const transcript = new Transcript(headers);

  // Load transcript with valid IPA characters
  const rows = [
    ['1', 'bato', 'DET N', 'the house', '', '', '', '', ''],
    ['2', 'ipa', 'N V', 'IPA symbols', '', '', '', '', '']
  ];
  transcript.load(rows);

  // Create a profile that accepts these graphemes
  const profile = new Profile([
    { Grapheme: 'b' },
    { Grapheme: 'a' },
    { Grapheme: 't' },
    { Grapheme: 'o' },
    { Grapheme: 'i' },
    { Grapheme: 'p' }
  ]);

  const result = transcript.validateGraphemes(profile);

  expect(result).toEqual([]);
});

test('validateGraphemes returns invalid transcriptions when graphemes are not in profile', () => {
  const headers = Object.values(TranscriptColumns);
  const transcript = new Transcript(headers);

  // Load transcript with some invalid graphemes
  const rows = [
    ['1', 'xyz', 'N', 'invalid', '', '', '', '', ''],
    ['2', 'abc', 'N', 'valid', '', '', '', '', '']
  ];
  transcript.load(rows);

  // Create a profile that only accepts 'a', 'b', 'c'
  const profile = new Profile([
    { Grapheme: 'a' },
    { Grapheme: 'b' },
    { Grapheme: 'c' }
  ]);

  const result = transcript.validateGraphemes(profile);

  // 'xyz' should be flagged because 'x', 'y', 'z' are not in the profile
  expect(result.length).toBeGreaterThan(0);
  expect(result[0].id).toBe('1');
  expect(result[0].text).toContain('\uFFFD'); // Should contain replacement marker
});

test('validateGraphemes handles multi-character graphemes', () => {
  const headers = Object.values(TranscriptColumns);
  const transcript = new Transcript(headers);

  // Load transcript with multi-character grapheme
  const rows = [
    ['1', 'tʃap', 'N', 'word', '', '', '', '', '']
  ];
  transcript.load(rows);

  // Create a profile with multi-character grapheme 'tʃ'
  const profile = new Profile([
    { Grapheme: 'tʃ' },
    { Grapheme: 'a' },
    { Grapheme: 'p' }
  ]);

  const result = transcript.validateGraphemes(profile);

  expect(result).toEqual([]);
});

describe('loadElan', () => {
  test('updates transcript rows with Elan timing data', () => {
    const headers = Object.values(TranscriptColumns);
    const transcript = new Transcript(headers);

    // Load transcript with some rows
    const transcriptData = [
      ['1', 'hello', 'GREETING', 'hello', '', '', '', '', ''],
      ['2', 'world', 'NOUN', 'world', '', '', '', '', ''],
      ['3', 'test', 'NOUN', 'test', '', '', '', '', '']
    ];
    transcript.load(transcriptData);

    // Create Elan data with timing information
    const elan = new Elan('id');
    elan.rows = [
      { id: '1', beginTime: '0.000', endTime: '1.500', duration: '1.500' },
      { id: '2', beginTime: '1.500', endTime: '3.000', duration: '1.500' }
    ];

    // Load Elan data into transcript
    const updatedRows = transcript.loadElan(elan);

    // Should return only the rows that matched Elan data
    expect(updatedRows).toHaveLength(2);

    // Check that timing data was added to the transcript rows
    const row1 = transcript.rows.find(row => row.id === '1');
    expect(row1?.beginTime).toBe('0.000');
    expect(row1?.endTime).toBe('1.500');

    const row2 = transcript.rows.find(row => row.id === '2');
    expect(row2?.beginTime).toBe('1.500');
    expect(row2?.endTime).toBe('3.000');

    // Row 3 should not have timing data
    const row3 = transcript.rows.find(row => row.id === '3');
    expect(row3?.beginTime).toBeUndefined();
    expect(row3?.endTime).toBeUndefined();
  });

  test('updates raw array with timing data for CSV export', () => {
    const headers = [...Object.values(TranscriptColumns), ElanColumns.begin_time, ElanColumns.end_time];
    const transcript = new Transcript(headers);

    // Load transcript with raw data
    const transcriptData = [
      ['1', 'hello', 'GREETING', 'hello', '', '', '', '', '', '', '']
    ];
    transcript.load(transcriptData);

    // Create Elan data
    const elan = new Elan('id');
    elan.rows = [
      { id: '1', beginTime: '0.000', endTime: '1.500', duration: '1.500' }
    ];

    // Load Elan data
    transcript.loadElan(elan);

    // Check that raw data was updated
    const row = transcript.rows[0];
    const beginTimeIdx = transcript.getColumnIndex(ElanColumns.begin_time);
    const endTimeIdx = transcript.getColumnIndex(ElanColumns.end_time);

    expect(row.raw?.[beginTimeIdx]).toBe('0.000');
    expect(row.raw?.[endTimeIdx]).toBe('1.500');
  });

  test('handles transcript rows without raw data', () => {
    const headers = Object.values(TranscriptColumns);
    const transcript = new Transcript(headers);

    // Manually create rows without raw data
    transcript.rows = [
      {
        id: '1',
        utterance: 'hello',
        utteranceGloss: 'GREETING',
        freeTranslation: 'hello',
        note: '',
        speaker: '',
        scribe: '',
        date: '',
        group: ''
      }
    ];

    // Create Elan data
    const elan = new Elan('id');
    elan.rows = [
      { id: '1', beginTime: '0.000', endTime: '1.500', duration: '1.500' }
    ];

    // Should not throw error even when raw is undefined
    expect(() => transcript.loadElan(elan)).not.toThrow();

    // Check that timing properties were still added
    expect(transcript.rows[0].beginTime).toBe('0.000');
    expect(transcript.rows[0].endTime).toBe('1.500');
  });

  test('returns empty array when no Elan rows match transcript IDs', () => {
    const headers = Object.values(TranscriptColumns);
    const transcript = new Transcript(headers);

    const transcriptData = [
      ['1', 'hello', 'GREETING', 'hello', '', '', '', '', '']
    ];
    transcript.load(transcriptData);

    // Create Elan data with non-matching IDs
    const elan = new Elan('id');
    elan.rows = [
      { id: '999', beginTime: '0.000', endTime: '1.500', duration: '1.500' }
    ];

    const updatedRows = transcript.loadElan(elan);

    expect(updatedRows).toHaveLength(0);
  });

  test('handles multiple Elan rows matching the same transcript ID', () => {
    const headers = Object.values(TranscriptColumns);
    const transcript = new Transcript(headers);

    const transcriptData = [
      ['1', 'hello', 'GREETING', 'hello', '', '', '', '', '']
    ];
    transcript.load(transcriptData);

    // Create Elan data with duplicate IDs
    const elan = new Elan('id');
    elan.rows = [
      { id: '1', beginTime: '0.000', endTime: '1.500', duration: '1.500' },
      { id: '1', beginTime: '2.000', endTime: '3.500', duration: '1.500' }
    ];

    const updatedRows = transcript.loadElan(elan);

    // Should return 2 entries (one for each Elan row match)
    expect(updatedRows).toHaveLength(2);

    // The transcript row should have the timing from the last match
    expect(transcript.rows[0].endTime).toBe('3.500');
  });
});