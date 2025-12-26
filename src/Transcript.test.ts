import { Transcript } from './Transcript';
import { TranscriptColumns } from './types';
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