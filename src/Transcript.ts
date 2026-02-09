import { ConcordanceRow, TranscriptColumns, TranscriptRow, Transcription, ElanColumns } from './types';
import { validateGloss, validateGlossAlignment, validHeaders } from './validators';
import { Profile, TokenizeOptions, Tokenizer } from '@umn-linguistics/segments-js';
import { REPLACEMENT_MARKER } from './interfaces/constants';
import { Gloss } from './Gloss';
import { Elan } from './Elan';

export class Transcript {
  public headers: string[];
  public rows: TranscriptRow[] = [];
  public idToRow: Map<string, number> = new Map<string, number>();
  public speaker: string = '';

  constructor(headers: string[]) {
    this.headers = validHeaders(headers, Object.values(TranscriptColumns));
  }

  getColumnIndex(columnName: string): number {
    return this.headers.indexOf(columnName);
  }

  public load(data: any[]) {
    const rows: TranscriptRow[] = data.map((row: any[]) => ({
        id: row[this.headers.indexOf('id')],
        utterance: row[this.headers.indexOf('ipa_transcription')],
        utteranceGloss: row[this.headers.indexOf('gloss')],
        freeTranslation: row[this.headers.indexOf('free_translation')],
        note: row[this.headers.indexOf('note')],
        scribe: row[this.headers.indexOf('scribe')],
        date: row[this.headers.indexOf('date')],
        group: row[this.headers.indexOf('group')],
        speaker: row[this.headers.indexOf('speaker')],
        beginTime: row[this.headers.indexOf('begin_time')],
        endTime: row[this.headers.indexOf('end_time')],
        duration: row[this.headers.indexOf('duration')],
        raw: row
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
      const words = String(transcription).split(' ');
      const wordGlosses = String(row.utteranceGloss).split(' ');

      words.forEach((word: string, idx: number) => {
        if (word) {
          const concordanceRow: ConcordanceRow = {
            id: row.id,
            word,
            wordGloss: wordGlosses[idx] ?? '',
            wordIndex: idx,
            utterance: String(transcription),
            utteranceGloss: String(row.utteranceGloss)
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

  public generateGlossText(): string {
    let text = '';

    for (const row of this.rows) {
      const concordance = this.toConcordance(row);

      let alignedTranscription = '';
      let alignedGloss = '';

      for (const wordRow of concordance){
        const maxLetterLength = Math.max(this.letterLength(wordRow.word), this.letterLength(wordRow.wordGloss));
          alignedTranscription += `${this.padByLetterLength(wordRow.word, maxLetterLength)}\t`;
          alignedGloss += `${this.padByLetterLength(wordRow.wordGloss, maxLetterLength)}\t`;
      }

      text += `(${row.id})
        ${alignedTranscription.trimEnd()}
        ${alignedGloss.trimEnd()}
        ${row.freeTranslation}\n\n`
      }
      return text;
  }

  private padByLetterLength(text: string, maxLetterLength: number){
    const letterLength = this.letterLength(text);
    return (maxLetterLength > letterLength) ? `${text}${' '.repeat(maxLetterLength - letterLength)}` : text;
  }

  private letterLength(text: string): number {
    // find each letter followed by one or more combining marks
    const re = /(\p{Letter})(\p{Mark}+)/gu;
    // replace with a blank space
    text = text.replace(re, ' ');
    // find the length of the string without combining marks
    return Array.from(text).length;
  }

  private escapeCSV(value: any): string {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  unparseAsCsv(): string {
    // To support the addition of unmanaged columns, return the original raw
    // data aligned to the original headers. 
    const rows = [this.headers, ...this.rows.map(row => row.raw as any[])];
    return rows.map(row => 
      row.map(this.escapeCSV).join(',')
    ).join('\n');
  }

  unparseAsElanTab(): string {
    // To support the addition of unmanaged columns, return the original raw
    // data aligned to the original headers. 
    let timeDateRows: TranscriptRow[] = [];
    for (let row of this.rows){
      if (row.beginTime){
        timeDateRows.push(row);
      }
    }

    //const timeDateRows = this.rows.filter(row => row.beginTime && row.endTime && row.duration);
    const rows = [this.headers, ...timeDateRows.map(row => row.raw as any[])];
    return rows.map(row => 
      row.map(this.escapeCSV).join('\t')
    ).join('\n');
  }

  public loadElan(elan: Elan): TranscriptRow[] {
    let updatedTranscriptRows: TranscriptRow[] = [];
    for (let elanRow of elan.rows) {
      for (let transcriptRow of this.rows) {
        if (String(elanRow.id) == String(transcriptRow.id)) {
          transcriptRow.beginTime = elanRow.beginTime;
          transcriptRow.endTime = elanRow.endTime;
          transcriptRow.duration = elanRow.duration;
          // To support the addition of unmanaged columns, update the original raw
          // to handle csv export.
          if (transcriptRow.raw) {
            transcriptRow.raw[this.getColumnIndex(ElanColumns.begin_time)] = elanRow.beginTime;
            transcriptRow.raw[this.getColumnIndex(ElanColumns.end_time)] = elanRow.endTime;
            transcriptRow.raw[this.getColumnIndex(ElanColumns.duration)] = elanRow.duration;
          }
          updatedTranscriptRows.push(transcriptRow);
        }
      }
    }
    return updatedTranscriptRows;
  }

  public bySpeaker(): Transcript[] {
    // Group rows by speaker
    const rowsBySpeaker = new Map<string, any[]>();

    this.rows.forEach(row => {
      const speaker = row.speaker === '' ? 'blank' : row.speaker;
      if (!rowsBySpeaker.has(speaker)) {
        rowsBySpeaker.set(speaker, []);
      }
      rowsBySpeaker.get(speaker)!.push(row);
    });

    let speakerTranscripts: Transcript[] = [];

    rowsBySpeaker.forEach((speakerRows, speaker) => {
      const speakerTranscript = new Transcript(this.headers);
      speakerTranscript.load(speakerRows.map(rows => rows.raw));
      speakerTranscript.speaker = speaker;
      speakerTranscripts.push(speakerTranscript);
    });

    return speakerTranscripts;
  }
}