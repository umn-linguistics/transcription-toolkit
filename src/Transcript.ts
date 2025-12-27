import { ConcordanceRow, TranscriptColumns, TranscriptRow, Graphemes, MorphemeColumns, Transcription } from './types';
import { validateGloss, validateGlossAlignment, validHeaders } from './validators';
import { Profile, TokenizeOptions, Tokenizer } from '@enfrank/segments-js';
import { REPLACEMENT_MARKER } from './interfaces/constants';
import { Gloss } from './Gloss';
//import { unparse } from 'papaparse';

const SUPPORTED_HEADERS = Object.values(TranscriptColumns);

export class Transcript {
  public headers: string[];
  public rows: TranscriptRow[] = [];
  public raw: any[] = [];
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
    this.raw = data;
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

  validateGlosses(): string[] {
    const misaligned: string[] = [];

    for (const row of this.rows) {
      if (!validateGlossAlignment(row.utterance, row.utteranceGloss)) {
        misaligned.push(row.id);
      }
    }

    return misaligned;
  }

  generateGlossHtml(): string {
    let utteranceBlocks = '';

    for (const row of this.rows) {
      const concordance = this.toConcordance(row);
      let wordBlocks = '';

      for (const wordRow of concordance) {
        wordBlocks += this.createWordBlock(wordRow.word, wordRow.wordGloss);
      }

      utteranceBlocks += this.createUtteranceBlock(row.id, wordBlocks, row.freeTranslation);
    }

    return utteranceBlocks;
  }

  private createWordBlock = (word: string, wordGloss: string): string => `      <div class="intlin">
            <span class="orig">${word}</span>
            <span class="morph">${wordGloss}</span>
        </div>
        `;

  private createUtteranceBlock = (
    id: string,
    wordBlocks: string,
    freeTranslation: string
  ): string => `    <div class="interlinear">
      <div class="utterance">(${id})</div>
      ${wordBlocks}
      <div class="freetrans">${freeTranslation}</div>
      </div>`;

  private sanitizeGlossString = (str: string): string =>
    str.replace(/\[|\]|{|}|\\|&/g, '');

  private createLatexGloss = (
    id: string,
    transcription: string,
    gloss: string,
    freeTranslation: string
  ): string => {
    const gla = this.sanitizeGlossString(transcription);
    const glb = this.sanitizeGlossString(gloss);
    const glft = this.sanitizeGlossString(freeTranslation);

    return `\\pex[exno=${id}]
  \\begingl
  \\gla ${gla} //
  \\glb ${glb} //
  \\glft ${glft} //
  \\endgl
  \\xe

  `;
  };

  private createLatexDocument = (glosses: string[]): string => {
  const header = `\\documentclass{article}
\\usepackage[margin=0.25in]{geometry}
\\usepackage{expex}
\\usepackage{fontspec}
\\setmainfont{Noto Serif}

\\begin{document}
\\lingset{everygla={\\upshape}}

\\begin{flushleft}
    Student Name \\\\
    Field Methods Transcript \\\\
    \\today \\\\
\\end{flushleft}
\\vspace{5mm}

`;

  const footer = `\\end{document}`;

  return `${header}${glosses.join('')}${footer}`;
};

  public generateLatexDocument(): string {
    const glosses: string[] = [];

    for (const row of this.rows) {
      try {
        const latexGloss = this.createLatexGloss(row.id, row.utterance, row.utteranceGloss, row.freeTranslation);
        glosses.push(latexGloss);
      } catch (err) {
        console.error('Error generating LaTeX for row:', row, err);
      }
    }

    return this.createLatexDocument(glosses);
  }

  generateGlossText(): string {
    let text = '';

    for (const row of this.rows) {
      const concordance = this.toConcordance(row);

      let alignedTranscription = '';
      let alignedGloss = '';

      for (const wordRow of concordance){

        const maxWordLength = Math.max(this.textLength(wordRow.word), this.textLength(wordRow.wordGloss));
          alignedTranscription += `${wordRow.word.padEnd(maxWordLength)}\t`;
          alignedGloss += `${wordRow.wordGloss.padEnd(maxWordLength)}\t`;
      }

      text += `(${row.id})
        ${alignedTranscription}
        ${alignedGloss}
        ${row.freeTranslation}\n\n`
      }
      return text;
  }

  private textLength(text: string): number {
    const re = /(?<char>\P{Mark})(?<combiner>\p{Mark}+)/gu;
    text = text.replace(re, `$1`);
    return Array.from(text).length;
  }

  // unparseAsCsv(): string {
  //   // Extract values from the transcript and include the headers
  //   const csvData = [this.headers, ...this.rows];
  //   return unparse(csvData);
  // }

  private escapeCSV(value: any): string {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  unparseAsCsv(): string {
    const rows = [this.headers, ...this.raw];
    return rows.map(row => 
      Object.values(row).map(this.escapeCSV).join(',')
    ).join('\n');
  }
}