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
    const rows: MorphemeRow[] = data.map((row) => ({
        morpheme_tag: row[this.headers.indexOf(MorphemeColumns.morpheme)]
      }));
    this.rows = rows;
    this.validMorphemeLabels = this.rows.map(row => row.morpheme_tag)
  }
}