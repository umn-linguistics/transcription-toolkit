/**
 * Tests for Tree class
 */

import { Tree } from './tree';
import { replace, strict } from './errors';

describe('Tree', () => {
  it('should parse simple graphemes', () => {
    const tree = new Tree(['a', 'b', 'c']);
    const result = tree.parse('abc');
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('should parse multigraphs', () => {
    const tree = new Tree(['aa', 'a', 'b']);
    const result = tree.parse('aab');
    expect(result).toEqual(['aa', 'b']);
  });

  it('should use greedy matching', () => {
    const tree = new Tree(['aaa', 'aa', 'a']);
    const result = tree.parse('aaa');
    expect(result).toEqual(['aaa']);
  });

  it('should handle invalid characters with replace handler', () => {
    const tree = new Tree(['a', 'b']);
    const result = tree.parse('axb', replace);
    expect(result).toEqual(['a', '\uFFFD', 'b']);
  });

  it('should handle invalid characters with strict handler', () => {
    const tree = new Tree(['a', 'b']);
    expect(() => {
      tree.parse('axb', strict);
    }).toThrow('invalid grapheme');
  });

  it('should handle overlapping patterns', () => {
    const tree = new Tree(['ab', 'bc', 'abc']);
    const result = tree.parse('abc');
    expect(result).toEqual(['abc']);
  });
});
