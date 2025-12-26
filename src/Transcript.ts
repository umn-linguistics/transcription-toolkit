import { ConcordanceRow, TranscriptColumns, TranscriptRow, Graphemes, MorphemeColumns, Transcription } from './types';
import { validateGloss, validHeaders } from './validators';
import { Profile, TokenizeOptions, Tokenizer } from '@enfrank/segments-js';
import { REPLACEMENT_MARKER } from './interfaces/constants';
import { Gloss } from './Gloss';

const SUPPORTED_HEADERS = Object.values(TranscriptColumns);

export class Transcript {
  public headers: string[];
  public rows: TranscriptRow[] = [];
  private idToRow: Map<string, number> = new Map<string, number>();

  constructor(headers: string[]) {
    this.headers = validHeaders(headers, SUPPORTED_HEADERS);
  }

  getColumnIndex(columnName: string): number {
    return this.headers.indexOf(columnName);
  }

  public load(data: any[]) {
    const rows: TranscriptRow[] = data.map((row) => ({
        id: row[this.headers.indexOf('id')],
        utterance: row[this.headers.indexOf('ipa_transcription')],
        utteranceGloss: row[this.headers.indexOf('gloss')],
        freeTranslation: row[this.headers.indexOf('free_translation')],
        note: row[this.headers.indexOf('note')],
        scribe: row[this.headers.indexOf('scribe')],
        date: row[this.headers.indexOf('date')],
        group: row[this.headers.indexOf('group')],
        speaker: row[this.headers.indexOf('speaker')]
      }));
    this.rows = rows;
    this.idToRow = new Map(this.rows.map((row, index) => [row.id, index]));
  }

  /*
  *   Concordance methods
  */
  public concordance(): ConcordanceRow[] {
    let concordanceData: ConcordanceRow[] = [];

    for (let row of this.rows) {
      concordanceData.push(...this.toConcordance(row));
    }

    return concordanceData;
  }

  private toConcordance(row: TranscriptRow): ConcordanceRow[] {
    const concordanceData: ConcordanceRow[] = [];

    const transcription = row.utterance;

    if (transcription) {
      const words = transcription.split(' ');
      const wordGlosses = row.utteranceGloss.split(' ');

      words.forEach((word: string, idx: number) => {
        if (word) {
          const concordanceRow: ConcordanceRow = {
            id: row.id,
            word,
            wordGloss: wordGlosses[idx] ?? '',
            wordIndex: idx,
            utterance: transcription,
            utteranceGloss: row.utteranceGloss
          };

          concordanceData.push(concordanceRow);
        }
      });
    }

    return concordanceData;
  }

  /*
  *   Validation methods
  */
  public validateGraphemes(graphemeProfile: Profile): Transcription[]{
    const invalidTranscriptions: Transcription[] = [];
    const opts: TokenizeOptions = { errors: 'replace' };
    const tokenizer = new Tokenizer({profile: graphemeProfile});

    // build profile from graphemes
    for (const row of this.rows) {
      const tokenized = tokenizer.call(row.utterance, opts);

      if (tokenized.includes(REPLACEMENT_MARKER)) {
        invalidTranscriptions.push({id:row.id, text:tokenized});
      }
    }

    return invalidTranscriptions;
  }

  validateIds(): { missingIds: number[]; duplicateRowNumbers: string[] } {
    const missingIds: number[] = [];
    const duplicateRowNumbers: string[] = [];
    const seenIds = new Map<string, number>();

    this.rows.forEach((row, index) => {
      const rowNumber = index + 1; // Start row numbers at 1

      // Check if ID is missing or empty
      if (row.id === '') {
        missingIds.push(rowNumber);
      } else {
        // Check for duplicates
        if (seenIds.has(row.id)) {
          // Only add to duplicates list once per ID
          if (!duplicateRowNumbers.includes(row.id)) {
            duplicateRowNumbers.push(row.id);
          }
        } else {
          seenIds.set(row.id, rowNumber);
        }
      }
    });

    return { missingIds, duplicateRowNumbers };
  }

  validateMorphemeLabels(morphemeData: Gloss): Transcription[] {
    const invalidGloss: Transcription[] = [];

    const headerIndex = (header: TranscriptColumns) =>
      this.headers.indexOf(header);

    const morphemeHeaderIndex = (header: MorphemeColumns) =>
      morphemeData.headers.indexOf(header);

    for (const row of this.rows) {
      const validated = validateGloss(row.utteranceGloss, morphemeData.validMorphemeLabels);

      if (validated.includes(REPLACEMENT_MARKER)) {
        invalidGloss.push({id:row.id, text:validated});
      }
    }

    return invalidGloss;
  }
}