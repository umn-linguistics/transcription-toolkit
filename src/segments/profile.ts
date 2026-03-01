/**
 * Orthography Profile as specified by Moran and Cysouw 2018
 */

import { Tree } from './tree';

export type NormalizationForm = 'NFC' | 'NFD' | 'NFKC' | 'NFKD';

export interface GraphemeSpec {
  [key: string]: string | number | null;
}

export interface ProfileMetadata {
  fname?: string;
  form?: NormalizationForm;
  [key: string]: any;
}

/**
 * Orthography Profile class for handling grapheme specifications
 */
export class Profile {
  static readonly GRAPHEME_COL = 'Grapheme';
  static readonly NULL = 'NULL';

  graphemes: Map<string, GraphemeSpec>;
  columnLabels: Set<string>;
  fname: string | null;
  form: NormalizationForm | null;
  metadata: ProfileMetadata;
  tree: Tree;

  /**
   * Create a Profile instance
   * @param specs - Array of grapheme specifications
   * @param options - Optional metadata and settings
   */
  constructor(specs: GraphemeSpec[], options: ProfileMetadata = {}) {
    this.graphemes = new Map();
    this.columnLabels = new Set();
    this.fname = options.fname || null;
    this.form = options.form || null;
    this.metadata = options;

    const seenGraphemes = new Set<string>();

    for (let i = 0; i < specs.length; i++) {
      const spec = { ...specs[i] };

      if (!(Profile.GRAPHEME_COL in spec)) {
        throw new Error('invalid grapheme specification');
      }

      // Apply Unicode normalization if specified
      if (this.form) {
        const normalizedSpec: GraphemeSpec = {};
        for (const [key, value] of Object.entries(spec)) {
          const normalizedKey = key.normalize(this.form);
          const normalizedValue = value === null ? null :
            typeof value === 'string' ? value.normalize(this.form) : value;
          normalizedSpec[normalizedKey] = normalizedValue;
        }
        Object.assign(spec, normalizedSpec);
      }

      const grapheme = spec[Profile.GRAPHEME_COL] as string;
      delete spec[Profile.GRAPHEME_COL];

      if (!grapheme) {
        throw new Error('Grapheme must not be empty');
      }

      // Track column labels
      for (const key of Object.keys(spec)) {
        this.columnLabels.add(key);
      }

      // Check for duplicates
      if (seenGraphemes.has(grapheme)) {
        console.warn(`line ${i + 2}: duplicate grapheme in profile: ${grapheme}`);
      } else {
        this.graphemes.set(grapheme, spec);
        seenGraphemes.add(grapheme);
      }
    }

    this.tree = new Tree(Array.from(this.graphemes.keys()));
  }

}
