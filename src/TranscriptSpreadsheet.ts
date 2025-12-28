import { ConcordanceRow, TranscriptColumns, Transcription, TranscriptRow } from './types';
import { Transcript } from './Transcript';
import { ISpreadsheet } from './interfaces/spreadsheet';
import { SHEET_NAMES } from './interfaces/constants';
import { GraphemeColumns, Graphemes } from './types';
import { validHeaders } from './validators';
import { Orthography } from './Orthography';
import { Gloss } from './Gloss';
//import { Transcript, Graphemes, Transcription, Morphemes } from '../../types';

export class TranscriptSpreadsheet {
  //public transcript: Transcript;
  public spreadsheet: ISpreadsheet;

  constructor(spreadsheet: ISpreadsheet) {
    this.spreadsheet = spreadsheet;
    //this.transcript = new Transcript(SUPPORTED_HEADERS);
  }

  public getTranscriptData(): Transcript {
    const headers = this.spreadsheet.getHeaders();
    const transcript = new Transcript(headers);
    const rows = this.spreadsheet.getRows();
    transcript.load(rows);
    return transcript;
  }

  public getSelectedTranscriptData(): Transcript {
    const headers = this.spreadsheet.getHeaders();
    const transcript = new Transcript(headers);
    const rows = this.spreadsheet.getSelectedData(headers);
    
    if (rows.length === 0) {
      throw new Error('No rows are selected. Select one or more rows to see glosses.');
    }

    transcript.load(rows);
    return transcript;
  }

  generateUniqueSheetName(existingNames: string[], baseName: string = 'TranscriptSheet'): string {
    let newSheetName = baseName;
    let counter = 0;

    while (existingNames.includes(newSheetName)) {
      counter += 1;
      newSheetName = `${baseName}-${counter}`;
    }

    return newSheetName;
  }

  createTranscriptSheet(columnHeaders: string[], baseName: string = 'TranscriptSheet'): string {
    // Get existing sheet names
    const existingNames = this.spreadsheet.getSheetNames();

    // Generate unique name
    const sheetName = this.generateUniqueSheetName(existingNames, baseName);

    // Create the sheet with headers
    this.spreadsheet.createSheet(sheetName, columnHeaders);

    return sheetName;
  }

  getGraphemeData(): Orthography {
    const headers = this.spreadsheet.getWorksheetHeaders(SHEET_NAMES.GRAPHEME_PROFILE)
    const rows = this.spreadsheet.getWorksheetRows(SHEET_NAMES.GRAPHEME_PROFILE);
    const orthography = new Orthography(headers);
    orthography.load(rows);
    return orthography;
  }

  getMorphemeData(): Gloss {
    const headers = this.spreadsheet.getWorksheetHeaders(SHEET_NAMES.MORPHEME_TAGS)
    const rows = this.spreadsheet.getWorksheetRows(SHEET_NAMES.MORPHEME_TAGS);
    const gloss = new Gloss(headers);
    gloss.load(rows);
    return gloss;
  }

  updateTranscriptWithGraphemeValidations(invalidTranscriptions: Transcription[], headers: string[]): number {
    const transcriptRowCount = this.spreadsheet.getLastRow();

    if (transcriptRowCount < 2) {
      return 0; // No data rows
    }

    const numRows = transcriptRowCount - 1; // Exclude header row
    const transcriptionColIndex = headers.indexOf(TranscriptColumns.transcription) + 1;

    // Build list of all cell background updates
    const updates: Array<{row: number, col: number, color: string}> = [];

    // Get ID to row mapping
    const idMap = this.spreadsheet.buildIdToRowMap(headers);
    const misalignedIdsSet = new Set(invalidTranscriptions.map(t => String(t.id)));

    // First, set all rows to white
    for (let rowNum = 2; rowNum <= transcriptRowCount; rowNum++) {
      updates.push(
        { row: rowNum, col: transcriptionColIndex, color: 'white' },
      );
    }

    // Then, override misaligned rows with red
    for (const [id, rowNum] of idMap) {
      if (misalignedIdsSet.has(id)) {
        // Find and update the white entries for this row
        const transcriptionIndex = updates.findIndex(
          u => u.row === rowNum && u.col === transcriptionColIndex
        );

        if (transcriptionIndex !== -1) {
          updates[transcriptionIndex].color = '#eb9999';
        }
      }
    }

    // Apply all updates in batch
    this.spreadsheet.updateCellBackgrounds(updates);

    return numRows;
  }

  updateTranscriptWithIdValidations(duplicateIds: string[], headers: string[]): number {
    const transcriptRowCount = this.spreadsheet.getLastRow();

    if (transcriptRowCount < 2) {
      return 0; // No data rows
    }

    const numRows = transcriptRowCount - 1; // Exclude header row
    const idColIndex = headers.indexOf('id') + 1;
    const duplicateIdsSet = new Set(duplicateIds.map(id => String(id)));

    // Build list of all cell background updates
    const updates: Array<{row: number, col: number, color: string}> = [];

    // Get all rows and check each one
    const rows = this.spreadsheet.getRows();

    rows.forEach((row, index) => {
      const rowNum = index + 2; // Row 1 is headers, data starts at row 2
      const idValue = String(row[idColIndex - 1] || '').trim();

      const color = duplicateIdsSet.has(idValue) ? '#eb9999' : 'white';
      updates.push({ row: rowNum, col: idColIndex, color });
    });

    // Apply all updates in batch
    this.spreadsheet.updateCellBackgrounds(updates);

    return numRows;
  }

  updateTranscriptWithMorphemeValidations(invalidTranscriptions: Transcription[], headers: string[]): number {
    const transcriptRowCount = this.spreadsheet.getLastRow();

    if (transcriptRowCount < 2) {
      return 0; // No data rows
    }

    const numRows = transcriptRowCount - 1; // Exclude header row
    const glossColIndex = headers.indexOf(TranscriptColumns.gloss) + 1;

    // Build list of all cell background updates
    const updates: Array<{row: number, col: number, color: string}> = [];

    // Get ID to row mapping
    const idMap = this.spreadsheet.buildIdToRowMap(headers);
    const misalignedIdsSet = new Set(invalidTranscriptions.map(t => String(t.id)));

    // First, set all rows to white
    for (let rowNum = 2; rowNum <= transcriptRowCount; rowNum++) {
      updates.push(
        { row: rowNum, col: glossColIndex, color: 'white' },
      );
    }

    // Then, override misaligned rows with red
    for (const [id, rowNum] of idMap) {
      if (misalignedIdsSet.has(id)) {
        // Find and update the white entries for this row
        const transcriptionIndex = updates.findIndex(
          u => u.row === rowNum && u.col === glossColIndex
        );

        if (transcriptionIndex !== -1) {
          updates[transcriptionIndex].color = '#eb9999';
        }
      }
    }

    // Apply all updates in batch
    this.spreadsheet.updateCellBackgrounds(updates);

    return numRows;
  }

  updateTranscriptWithGlossAlignmentValidations(misalignedRowIds: string[], headers: string[]): number {
      const transcriptRowCount = this.spreadsheet.getLastRow();

      if (transcriptRowCount < 2) {
        return 0; // No data rows
      }

      const numRows = transcriptRowCount - 1; // Exclude header row
      const transcriptionColIndex = headers.indexOf('ipa_transcription') + 1;
      const glossColIndex = headers.indexOf('gloss') + 1;

      // Build list of all cell background updates
      const updates: Array<{row: number, col: number, color: string}> = [];

      // Get ID to row mapping
      const idMap = this.spreadsheet.buildIdToRowMap(headers);
      const misalignedIdsSet = new Set(misalignedRowIds.map(id => String(id)));

      // First, set all rows to white
      for (let rowNum = 2; rowNum <= transcriptRowCount; rowNum++) {
        updates.push(
          { row: rowNum, col: transcriptionColIndex, color: 'white' },
          { row: rowNum, col: glossColIndex, color: 'white' }
        );
      }

      // Then, override misaligned rows with red
      for (const [id, rowNum] of idMap) {
        if (misalignedIdsSet.has(id)) {
          // Find and update the white entries for this row
          const transcriptionIndex = updates.findIndex(
            u => u.row === rowNum && u.col === transcriptionColIndex
          );
          const glossIndex = updates.findIndex(
            u => u.row === rowNum && u.col === glossColIndex
          );

          if (transcriptionIndex !== -1) {
            updates[transcriptionIndex].color = '#eb9999';
          }
          if (glossIndex !== -1) {
            updates[glossIndex].color = '#eb9999';
          }
        }
      }

      // Apply all updates in batch
      this.spreadsheet.updateCellBackgrounds(updates);

      return numRows;
    }

  setAllRowsToWhite(headers: string[]){
      const transcriptRowCount = this.spreadsheet.getLastRow();

      if (transcriptRowCount < 2) {
        return 0; // No data rows
      }

      const numRows = transcriptRowCount - 1; // Exclude header row
      const glossColIndex = headers.indexOf(TranscriptColumns.gloss) + 1;
      const transcriptionColIndex = headers.indexOf(TranscriptColumns.transcription) + 1;
      const idColIndex = headers.indexOf(TranscriptColumns.id) + 1;
      const updates: Array<{row: number, col: number, color: string}> = [];
      for (let rowNum = 2; rowNum <= transcriptRowCount; rowNum++) {
        updates.push(
          { row: rowNum, col: glossColIndex, color: 'white' },
          { row: rowNum, col: transcriptionColIndex, color: 'white' },
          { row: rowNum, col: idColIndex, color: 'white' },
        );
      }
      this.spreadsheet.updateCellBackgrounds(updates);

      return numRows;
  }

  concordanceToArray(concordanceData: ConcordanceRow[]): any[][] {
    const headers = ['id', 'word', 'word_gloss', 'ipa_transcription', 'ipa_transcription_gloss'];
    const rows = concordanceData.map(row => [
      row.id,
      row.word,
      row.wordGloss,
      row.utterance,
      row.utteranceGloss
    ]);

    return [headers, ...rows];
  }

  updateWithElanData(
    elanData: TranscriptRow[],
    transcript: Transcript
  ): void {
    const beginTimeCol = transcript.headers.indexOf('begin_time') + 1;
    const endTimeCol = transcript.headers.indexOf('end_time') + 1;
    const durationCol = transcript.headers.indexOf('duration') + 1;
    for (const elanRow of elanData) {
      const rowNum = transcript.idToRow.get(elanRow.id);
       if (rowNum !== undefined && Number(rowNum)) {
        const spreadsheetRowNum = rowNum + 2; // account for spreadsheet index starting at 1 and header row
        this.spreadsheet.updateCell(spreadsheetRowNum, beginTimeCol, elanRow.beginTime);
        this.spreadsheet.updateCell(spreadsheetRowNum, endTimeCol, elanRow.endTime);
        this.spreadsheet.updateCell(spreadsheetRowNum, durationCol, elanRow.duration);
      }
    }
  }
}

