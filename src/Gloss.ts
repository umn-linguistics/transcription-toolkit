import { ConcordanceRow, TranscriptColumns, TranscriptRow, MorphemeRow, Graphemes, Transcription, GraphemeColumns, MorphemeColumns } from './types';
import { validHeaders } from './validators';
import { Profile } from '@enfrank/segments-js';
import type { TokenizeOptions, NormalizationForm, GraphemeSpec } from '@enfrank/segments-js';

export class Gloss {
  public rows: MorphemeRow[] = [];
  public headers: string[];
  public validMorphemeLabels: string[] = [];

  constructor(headers: string[]) {
    this.headers = validHeaders(headers, Object.values(MorphemeColumns));
  }

  public load(data: any[]) {
    // trim and remove duplicate tags
    const tagSet: Set<string> = new Set(data.map(row => 
        String(row[this.headers.indexOf(MorphemeColumns.morpheme)]).trim())
      .filter(tag => tag !== ''));
    
    const rows: MorphemeRow[] = Array.from(tagSet).map(tag => ({
        morpheme_tag: tag
      }));

    this.rows = rows;
    this.validMorphemeLabels = this.rows.map(row => row.morpheme_tag)
  }
}