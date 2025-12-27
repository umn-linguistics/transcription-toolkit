import { ConcordanceRow, TranscriptColumns, Transcription, TranscriptRow } from './types';
import { Transcript } from './Transcript';
import { IStorage } from './interfaces/storage';
import { SHEET_NAMES } from './interfaces/constants';
import { GraphemeColumns, Graphemes } from './types';
import { validHeaders } from './validators';
import { Orthography } from './Orthography';
import { Gloss } from './Gloss';

export class TranscriptStorage {
  public storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
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

  createWordListSpreadsheet(
    concordanceData: ConcordanceRow[],
    folderId: string,
    fileName: string
  ): void {

    const concordance = this.concordanceToArray(concordanceData);

    // Get or create spreadsheet
    const wordSheet = this.storage.getOrCreateSpreadsheet(folderId, fileName);

    // Clear all previous data
    wordSheet.clear();
    const sheet = wordSheet.getActiveSheet();

    // Write data to sheet
    const numRows = concordance.length;
    const numCols = 5;
    const range = sheet.getRange(1, 1, numRows, numCols);
    range.setValues(concordance);

    // Freeze the header row
    wordSheet.setFrozenRows(1);
  }
}

