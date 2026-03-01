/**
 * Tokenizer for Unicode characters, grapheme clusters and tailored grapheme clusters
 * based on orthography profiles
 */

import * as errors from './errors';
import { ErrorHandler } from './errors';
import { Profile, NormalizationForm } from './profile';

export interface TokenizerOptions {
  profile?: Profile | string;
  errors_strict?: ErrorHandler;
  errors_replace?: ErrorHandler;
  errors_ignore?: ErrorHandler;
}

export interface TokenizeOptions {
  column?: string;
  form?: NormalizationForm;
  ipa?: boolean;
  segment_separator?: string;
  separator?: string;
  errors?: 'replace' | 'strict' | 'ignore';
}

/**
 * Class for Unicode character and grapheme tokenization with orthography profile support
 */
export class Tokenizer {
  private op: Profile | null;
  private _errors: {
    strict: ErrorHandler;
    replace: ErrorHandler;
    ignore: ErrorHandler;
  };

  /**
   * Create a Tokenizer instance
   * @param options - Tokenizer configuration options
   *
   * @example
   * ```typescript
   * const profile = new Profile([
   *   { Grapheme: 'uu' },
   *   { Grapheme: 'b' },
   *   { Grapheme: 'o' }
   * ]);
   * const tokenizer = new Tokenizer({ profile });
   * tokenizer('uubo uubo'); // Returns: 'uu b o # uu b o'
   * ```
   */
  constructor(options: TokenizerOptions = {}) {
    this.op = null;

    if (options.profile instanceof Profile) {
      this.op = options.profile;
    } else if (typeof options === 'string') {
      throw 'Disabling file reads -- manually pass in a profile in options.profile';
    }

    this._errors = {
      strict: options.errors_strict || errors.strict,
      replace: options.errors_replace || errors.replace,
      ignore: options.errors_ignore || errors.ignore
    };
  }

  /**
   * Tokenize a string
   * @param string - Input string to tokenize
   * @param options - Tokenization options
   * @returns Tokenized string
   */
  call(string: string, options: TokenizeOptions = {}): string {
    const {
      column = Profile.GRAPHEME_COL,
      form = undefined,
      ipa = false,
      segment_separator = ' ',
      separator = ' # ',
      errors: errorMode = 'replace'
    } = options;

    const res: string[][] = [];

    for (const word of string.split(/\s+/)) {
      if (ipa) {
        const clusters = this.graphemeClusters(this.nfd(word));
        res.push(this.combineModifiers(clusters));
      } else {
        if (this.op) {
          res.push(this.transform(word, column, this._errors[errorMode]));
        } else {
          res.push(this.graphemeClusters(this.nfd(word)));
        }
      }
    }

    const postprocess = (word: string[]): string => {
      const result = word.join(segment_separator).trim();
      return form ? result.normalize(form) : result;
    };

    return res.map(postprocess).join(separator);
  }

  /**
   * Transform graphemes using mappings from the orthography profile
   * @param word - Input word
   * @param column - Column to map to
   * @param error - Error handler
   * @returns Array of transformed tokens
   */
  transform(
    word: string,
    column: string = Profile.GRAPHEME_COL,
    error: ErrorHandler = errors.replace
  ): string[] {
    if (!this.op) {
      throw new Error('method can only be called with orthography profile.');
    }

    if (column !== Profile.GRAPHEME_COL && !this.op.columnLabels.has(column)) {
      throw new Error(`Column ${column} not found in profile.`);
    }

    const parsed = this.op.tree.parse(word, error);

    if (column === Profile.GRAPHEME_COL) {
      return parsed;
    }

    const out: string[] = [];
    for (const token of parsed) {
      const spec = this.op.graphemes.get(token);
      let target: any;

      if (spec && column in spec) {
        target = spec[column];
      } else {
        target = this._errors.replace(token);
      }

      if (target !== null) {
        if (Array.isArray(target)) {
          out.push(...target);
        } else {
          out.push(target);
        }
      }
    }

    return out;
  }

  /**
   * Combine Unicode modifier letters with their base characters
   * Handles IPA-specific combinations
   * @param graphemes - Array of grapheme clusters
   * @returns Array with modifiers combined
   */
  combineModifiers(graphemes: string[]): string[] {
    const result: string[] = [];
    let temp = '';
    let count = graphemes.length;

    // Process in reverse
    for (let i = graphemes.length - 1; i >= 0; i--) {
      const grapheme = graphemes[i];
      count--;

      // Check if it's a modifier letter (category Lm)
      if (grapheme.length === 1) {
        const category = this.getUnicodeCategory(grapheme);
        const code = grapheme.charCodeAt(0);

        // Spacing modifier letters (except specific codes 712, 716)
        if (category === 'Lm' && code !== 712 && code !== 716 && graphemes.length > 1) {
          temp = grapheme + temp;
          // Handle first character edge case
          if (count === 0 && result.length > 0) {
            result[result.length - 1] = temp + result[result.length - 1];
          }
          continue;
        }

        // Stress marks (codes 712, 716)
        if ((code === 712 || code === 716) && result.length > 0) {
          result[result.length - 1] = grapheme + result[result.length - 1];
          temp = '';
          continue;
        }

        // Contour tone marks (category Sk)
        if (category === 'Sk') {
          if (result.length === 0) {
            result.push(grapheme);
            temp = '';
            continue;
          } else {
            const lastCategory = this.getUnicodeCategory(result[result.length - 1][0]);
            if (lastCategory === 'Sk') {
              result[result.length - 1] = grapheme + temp + result[result.length - 1];
              temp = '';
              continue;
            }
          }
        }
      }

      result.push(grapheme + temp);
      temp = '';
    }

    // Reverse back to original order
    const segments = result.reverse();

    // Handle tie bars
    const r: string[] = [];
    let i = 0;
    while (i < segments.length) {
      const lastChar = segments[i].charCodeAt(segments[i].length - 1);
      // Tie bars: U+0361 (865) or U+035C (860)
      if (lastChar === 865 || lastChar === 860) {
        if (i + 1 < segments.length) {
          r.push(segments[i] + segments[i + 1]);
          i += 2;
        } else {
          r.push(segments[i]);
          i++;
        }
      } else {
        r.push(segments[i]);
        i++;
      }
    }

    return r;
  }

  /**
   * Get Unicode general category for a character
   * @param char - Single character
   * @returns Unicode category code
   */
  private getUnicodeCategory(char: string): string {
    const code = char.charCodeAt(0);

    // Spacing Modifier Letters (Lm): U+02B0 to U+02FF
    if (code >= 0x02B0 && code <= 0x02FF) {
      return 'Lm';
    }

    // Modifier Symbol (Sk): U+02C2 to U+02C5, U+02D2 to U+02DF, etc.
    if ((code >= 0x02C2 && code <= 0x02C5) ||
        (code >= 0x02D2 && code <= 0x02DF) ||
        (code >= 0x02E5 && code <= 0x02EB) ||
        (code >= 0x02ED && code <= 0x02FF) ||
        (code >= 0xA700 && code <= 0xA71F)) {
      return 'Sk';
    }

    // Default: Letter
    return 'L';
  }

  /**
   * Normalize a string to NFD (Canonical Decomposition)
   * @param text - String to normalize
   * @returns Normalized string
   */
  private nfd(text: string): string {
    return text.normalize('NFD');
  }

  /**
   * Get Unicode grapheme clusters from a string using the Intl.Segmenter API
   *    See Unicode Text Segmentation http://www.unicode.org/reports/tr29/
   * @param text - String to segment
   * @returns Array of grapheme clusters
   */
  graphemeClusters(text: string): string[] {
    // Use Intl.Segmenter for grapheme segmentation (available in Node 16+)
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
      // Type assertion for Intl.Segmenter which may not be in all type definitions
      const IntlSegmenter = (Intl as any).Segmenter;
      const segmenter = new IntlSegmenter(undefined, { granularity: 'grapheme' });
      const segments = segmenter.segment(text);
      return Array.from(segments, (s: any) => s.segment);
    }

    // Fallback: simple split by character (not perfect for complex graphemes)
    // This won't handle combining marks properly but provides basic functionality
    return Array.from(text);
  }
}
