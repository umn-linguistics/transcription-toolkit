// This file is bundled with esbuild to create a global IIFE for Apps Script
// import alignWords from '@digitallinguistics/word-aligner';
// import { transliterate } from '@digitallinguistics/transliterate';
import Papa from 'papaparse';
import { Tokenizer, Profile } from '@enfrank/segments-js';

// Export as a global object for Apps Script
globalThis.npmBundle = {
//   alignWords,
//   transliterate,
  Papa,
  Tokenizer,
  Profile
};
