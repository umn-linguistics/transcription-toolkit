/**
 * Tests for Tokenizer class
 */

import { Tokenizer, TokenizeOptions } from './tokenizer';
import { Profile } from './profile';
import { REPLACEMENT_MARKER } from './errors';

describe('Tokenizer', () => {
  describe('basic tokenization', () => {
    it('should tokenize simple text without profile', () => {
      const tokenizer = new Tokenizer();
      const result = tokenizer.call('abc');
      expect(result).toBe('a b c');
    });

    it('should handle multiple words', () => {
      const tokenizer = new Tokenizer();
      const result = tokenizer.call('ab cd');
      expect(result).toBe('a b # c d');
    });
  });

  describe('with orthography profile', () => {
    it('should tokenize with profile', () => {
      const profile = new Profile([
        { Grapheme: 'uu' },
        { Grapheme: 'b' },
        { Grapheme: 'o' }
      ]);
      const tokenizer = new Tokenizer({ profile });
      const result = tokenizer.call('uubo uubo');
      expect(result).toBe('uu b o # uu b o');
    });

    it('should tokenize complex graphemes with profile', () => {
      const profile = new Profile([
        { Grapheme: 'ĩ' },
        { Grapheme: 'm' },
        { Grapheme: 'a' },
        { Grapheme: 'kʰ' },
        { Grapheme: 'ó' },
        { Grapheme: 'tʃʰ' },
        { Grapheme: 'e' },
        { Grapheme: 'k' },
      ]);
      const tokenizer = new Tokenizer({ profile });
      const result = tokenizer.call('ĩmakʰótʃʰek');
      expect(result).toBe('ĩ m a kʰ ó tʃʰ e k');
    });

    it('should map to different column', () => {
      const profile = new Profile([
        { Grapheme: 'ab', mapping: 'x' },
        { Grapheme: 'cd', mapping: 'y' }
      ]);
      const tokenizer = new Tokenizer({ profile });
      const result = tokenizer.call('abcd', { column: 'mapping' });
      expect(result).toBe('x y');
    });
  });

  describe('graphemeClusters', () => {
    it('should extract grapheme clusters', () => {
      const tokenizer = new Tokenizer();
      const result = tokenizer.graphemeClusters('abcd');
      expect(result).toEqual(['a', 'b', 'c', 'd']);
    });
  });
});

describe('Errors', () => {
  it('should apply replacement for replace option', () => {
    const opts: TokenizeOptions = { errors: 'replace' };
    const profile = new Profile([
      { Grapheme: 'uu' },
      { Grapheme: 'b' },
      { Grapheme: 'o' }
    ]);
    const tokenizer = new Tokenizer({ profile });
    const result = tokenizer.call('uuüboli', opts);
    const expectedString = `uu ${REPLACEMENT_MARKER} b o ${REPLACEMENT_MARKER} ${REPLACEMENT_MARKER}`;
    expect(result).toBe(expectedString);
  });

  it('should default to replace option', () => {
    const profile = new Profile([
      { Grapheme: 'uu' },
      { Grapheme: 'b' },
      { Grapheme: 'o' }
    ]);
    const tokenizer = new Tokenizer({ profile });
    const result = tokenizer.call('uuüboli');
    const expectedString = `uu ${REPLACEMENT_MARKER} b o ${REPLACEMENT_MARKER} ${REPLACEMENT_MARKER}`;
    expect(result).toBe(expectedString);
  });

  it('should throw for strict option', () => {
    const opts: TokenizeOptions = { errors: 'strict' };
    const profile = new Profile([
      { Grapheme: 'uu' },
      { Grapheme: 'b' },
      { Grapheme: 'o' }
    ]);
    const tokenizer = new Tokenizer({ profile });
    expect(() => {
      tokenizer.call('uuübo', opts);
    }).toThrow('invalid grapheme');
  });

  it('should ignore with extra space for ignore option', () => {
    const opts: TokenizeOptions = { errors: 'ignore' };
    const profile = new Profile([
      { Grapheme: 'uu' },
      { Grapheme: 'b' },
      { Grapheme: 'o' }
    ]);
    const tokenizer = new Tokenizer({ profile });
    const result = tokenizer.call('uuübo', opts);
    const expectedString = `uu  b o`;
    expect(result).toBe(expectedString);
  });
});
