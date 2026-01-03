import { TranscriptSpreadsheet } from './TranscriptSpreadsheet';
import { Elan } from './Elan';
import { ISpreadsheet } from './interfaces/spreadsheet';
import { TranscriptColumns } from './types';
import { SHEET_NAMES } from './interfaces/constants';

// Mock implementation of ISpreadsheet for testing
class MockSpreadsheet implements ISpreadsheet {
  private sheets: Map<string, { headers: string[], rows: any[][] }> = new Map();
  private activeSheetName: string = 'Sheet1';
  private selectedData: any[][] = [];
  private cellUpdates: Array<{ row: number, col: number, value: any }> = [];
  private backgroundUpdates: Array<{ row: number, col: number, color: string }> = [];

  constructor(headers: string[] = [], rows: any[][] = []) {
    this.sheets.set(this.activeSheetName, { headers, rows });
  }

  getActiveSheetName(): string {
    return this.activeSheetName;
  }

  getHeaders(): string[] {
    return this.sheets.get(this.activeSheetName)?.headers || [];
  }

  getRows(): any[][] {
    return this.sheets.get(this.activeSheetName)?.rows || [];
  }

  getWorksheetHeaders(worksheetName: string): string[] {
    return this.sheets.get(worksheetName)?.headers || [];
  }

  getWorksheetRows(worksheetName: string): any[][] {
    return this.sheets.get(worksheetName)?.rows || [];
  }

  getSelectedData(headers: string[]): any[][] {
    return this.selectedData;
  }

  updateCell(row: number, col: number, value: any): void {
    this.cellUpdates.push({ row, col, value });
  }

  updateCellBackground(row: number, col: number, color: string): void {
    this.backgroundUpdates.push({ row, col, color });
  }

  getSheetNames(): string[] {
    return Array.from(this.sheets.keys());
  }

  createSheet(name: string, headers: string[]): void {
    this.sheets.set(name, { headers, rows: [] });
  }

  getLastRow(): number {
    const rows = this.sheets.get(this.activeSheetName)?.rows || [];
    return rows.length + 1; // +1 for header row
  }

  buildIdToRowMap(headers: string[]): Map<string, number> {
    const idMap = new Map<string, number>();
    const idColIndex = headers.indexOf('id');
    const rows = this.getRows();

    rows.forEach((row, index) => {
      const id = String(row[idColIndex] || '');
      if (id) {
        idMap.set(id, index + 2); // +2 because row 1 is headers, data starts at row 2
      }
    });

    return idMap;
  }

  updateCellBackgrounds(updates: Array<{ row: number, col: number, color: string }>): void {
    this.backgroundUpdates.push(...updates);
  }

  // Test helper methods
  setSelectedData(data: any[][]): void {
    this.selectedData = data;
  }

  getCellUpdates(): Array<{ row: number, col: number, value: any }> {
    return this.cellUpdates;
  }

  getBackgroundUpdates(): Array<{ row: number, col: number, color: string }> {
    return this.backgroundUpdates;
  }

  clearUpdates(): void {
    this.cellUpdates = [];
    this.backgroundUpdates = [];
  }

  addSheet(name: string, headers: string[], rows: any[][]): void {
    this.sheets.set(name, { headers, rows });
  }
}

describe('TranscriptSpreadsheet', () => {
  describe('getTranscriptData', () => {
    test('loads transcript data from spreadsheet', () => {
      const headers = Object.values(TranscriptColumns);
      const rows = [
        ['1', 'hau', 'hello', 'hello', '', 'Speaker1', '', '', ''],
        ['2', 'ʧʰáɣa', 'ice', 'ice', '', 'Speaker2', '', '', '']
      ];

      const mockSpreadsheet = new MockSpreadsheet(headers, rows);
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);

      const transcript = transcriptSpreadsheet.getTranscriptData();

      expect(transcript.rows).toHaveLength(2);
      expect(transcript.rows[0].id).toBe('1');
      expect(transcript.rows[0].utterance).toBe('hau');
      expect(transcript.rows[1].id).toBe('2');
      expect(transcript.rows[1].utterance).toBe('ʧʰáɣa');
    });

    test('handles empty spreadsheet', () => {
      const headers = Object.values(TranscriptColumns);
      const mockSpreadsheet = new MockSpreadsheet(headers, []);
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);

      const transcript = transcriptSpreadsheet.getTranscriptData();

      expect(transcript.rows).toHaveLength(0);
    });
  });

  describe('getSelectedTranscriptData', () => {
    test('loads only selected rows from spreadsheet', () => {
      const headers = Object.values(TranscriptColumns);
      const allRows = [
        ['1', 'wapsít͡ʃa', 'jump.1SG', 'I jumped', '', '', '', '', ''],
        ['2', 'ʧʰáɣa', 'ice', 'ice', '', '', '', '', ''],
        ['3', 'testing', 'test.ING', 'tesing', '', '', '', '', '']
      ];
      const selectedRows = [
        ['1', 'wapsít͡ʃa', 'jump.1SG', 'I jumped', '', '', '', '', ''],
        ['3', 'testing', 'test.ING', 'tesing', '', '', '', '', '']
      ];

      const mockSpreadsheet = new MockSpreadsheet(headers, allRows);
      mockSpreadsheet.setSelectedData(selectedRows);
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);

      const transcript = transcriptSpreadsheet.getSelectedTranscriptData();

      expect(transcript.rows).toHaveLength(2);
      expect(transcript.rows[0].id).toBe('1');
      expect(transcript.rows[1].id).toBe('3');
    });

    test('throws error when no rows are selected', () => {
      const headers = Object.values(TranscriptColumns);
      const mockSpreadsheet = new MockSpreadsheet(headers, []);
      mockSpreadsheet.setSelectedData([]);
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);

      expect(() => transcriptSpreadsheet.getSelectedTranscriptData()).toThrow(
        'No rows are selected. Select one or more rows to see glosses.'
      );
    });
  });

  describe('generateUniqueSheetName', () => {
    test('returns base name when no conflicts exist', () => {
      const mockSpreadsheet = new MockSpreadsheet();
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);

      const sheetName = transcriptSpreadsheet.generateUniqueSheetName(['Sheet1'], 'NewSheet');

      expect(sheetName).toBe('NewSheet');
    });

    test('appends counter when base name already exists', () => {
      const mockSpreadsheet = new MockSpreadsheet();
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);

      const sheetName = transcriptSpreadsheet.generateUniqueSheetName(
        ['TranscriptSheet', 'TranscriptSheet-1'],
        'TranscriptSheet'
      );

      expect(sheetName).toBe('TranscriptSheet-2');
    });

    test('uses default base name when not provided', () => {
      const mockSpreadsheet = new MockSpreadsheet();
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);

      const sheetName = transcriptSpreadsheet.generateUniqueSheetName([]);

      expect(sheetName).toBe('TranscriptSheet');
    });
  });

  describe('createSettingsSheet', () => {
    test('creates a new sheet with specified name and headers', () => {
      const mockSpreadsheet = new MockSpreadsheet();
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);

      const sheetName = transcriptSpreadsheet.createSettingsSheet(['grapheme'], 'Graphemes');

      expect(sheetName).toBe('Graphemes');
      expect(mockSpreadsheet.getSheetNames()).toContain('Graphemes');
      expect(mockSpreadsheet.getWorksheetHeaders('Graphemes')).toEqual(['grapheme']);
    });

    test('throws error when sheet already exists', () => {
      const mockSpreadsheet = new MockSpreadsheet();
      mockSpreadsheet.createSheet('Graphemes', ['grapheme']);
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);

      expect(() => transcriptSpreadsheet.createSettingsSheet(['grapheme'], 'Graphemes')).toThrow(
        'Sheet Graphemes already exists.'
      );
    });
  });

  describe('createTranscriptSheet', () => {
    test('creates a new sheet with unique name', () => {
      const mockSpreadsheet = new MockSpreadsheet();
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);
      const headers = Object.values(TranscriptColumns);

      const sheetName = transcriptSpreadsheet.createTranscriptSheet(headers);

      expect(sheetName).toBe('TranscriptSheet');
      expect(mockSpreadsheet.getSheetNames()).toContain('TranscriptSheet');
    });

    test('appends counter when sheet name already exists', () => {
      const mockSpreadsheet = new MockSpreadsheet();
      mockSpreadsheet.createSheet('TranscriptSheet', []);
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);
      const headers = Object.values(TranscriptColumns);

      const sheetName = transcriptSpreadsheet.createTranscriptSheet(headers);

      expect(sheetName).toBe('TranscriptSheet-1');
    });
  });

  describe('getGraphemeData', () => {
    test('loads grapheme data from grapheme profile sheet', () => {
      const mockSpreadsheet = new MockSpreadsheet();
      mockSpreadsheet.addSheet(SHEET_NAMES.GRAPHEME_PROFILE, ['character'], [['a'], ['ʧʰ'], ['ĩ́']]);
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);

      const orthography = transcriptSpreadsheet.getGraphemeData();

      expect(orthography.graphemes).toHaveLength(3);
    });
  });

  describe('getMorphemeData', () => {
    test('loads morpheme data from morpheme tags sheet', () => {
      const mockSpreadsheet = new MockSpreadsheet();
      mockSpreadsheet.addSheet(SHEET_NAMES.MORPHEME_TAGS, ['gloss_abbreviation'], [['DET'], ['FUT'], ['DEM']]);
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);

      const gloss = transcriptSpreadsheet.getMorphemeData();

      expect(gloss.rows).toHaveLength(3);
    });
  });

  describe('updateTranscriptWithGraphemeValidations', () => {
    test('highlights invalid grapheme cells in red', () => {
      const headers = Object.values(TranscriptColumns);
      const rows = [
        ['1', 'valid', 'valid.row', '', '', '', '', '', ''],
        ['2', 'invalid', 'invalid.row', '', '', '', '', '', ''],
        ['3', 'valid2', 'second.valid.row', '', '', '', '', '', '']
      ];

      const mockSpreadsheet = new MockSpreadsheet(headers, rows);
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);

      const invalidTranscriptions = [{ id: '2', text: 'invalid' }];
      const numRows = transcriptSpreadsheet.updateTranscriptWithGraphemeValidations(invalidTranscriptions, headers);

      expect(numRows).toBe(3);
      const updates = mockSpreadsheet.getBackgroundUpdates();

      // Check that row 2 (id='1') has white background
      const row1Updates = updates.filter(u => u.row === 2);
      expect(row1Updates.some(u => u.color === 'white')).toBe(true);

      // Check that row 3 (id='2') has red background
      const row2Updates = updates.filter(u => u.row === 3);
      expect(row2Updates.some(u => u.color === '#eb9999')).toBe(true);
    });

    test('returns 0 for empty spreadsheet', () => {
      const headers = Object.values(TranscriptColumns);
      const mockSpreadsheet = new MockSpreadsheet(headers, []);
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);

      const numRows = transcriptSpreadsheet.updateTranscriptWithGraphemeValidations([], headers);

      expect(numRows).toBe(0);
    });
  });

  describe('updateTranscriptWithIdValidations', () => {
    test('highlights duplicate IDs in red', () => {
      const headers = Object.values(TranscriptColumns);
      const rows = [
        ['1', 'ʧʰáɣa', 'ice', '', '', '', '', '', ''],
        ['2', 'hau', 'hello', '', '', '', '', '', ''],
        ['1', 'duplicate', 'duplicate', '', '', '', '', '', '']
      ];

      const mockSpreadsheet = new MockSpreadsheet(headers, rows);
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);

      const duplicateIds = ['1'];
      const numRows = transcriptSpreadsheet.updateTranscriptWithIdValidations(duplicateIds, headers);

      expect(numRows).toBe(3);
      const updates = mockSpreadsheet.getBackgroundUpdates();

      // Rows with id '1' should be red
      const row1Updates = updates.filter(u => u.row === 2);
      expect(row1Updates[0].color).toBe('#eb9999');

      const row3Updates = updates.filter(u => u.row === 4);
      expect(row3Updates[0].color).toBe('#eb9999');

      // Row with id '2' should be white
      const row2Updates = updates.filter(u => u.row === 3);
      expect(row2Updates[0].color).toBe('white');
    });
  });

  describe('updateTranscriptWithMorphemeValidations', () => {
    test('highlights invalid morpheme glosses in red', () => {
      const headers = Object.values(TranscriptColumns);
      const rows = [
        ['1', 'word1', 'DET', '', '', '', '', '', ''],
        ['2', 'word2', 'INVALID', '', '', '', '', '', ''],
        ['3', 'word3', 'FUT', '', '', '', '', '', '']
      ];

      const mockSpreadsheet = new MockSpreadsheet(headers, rows);
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);

      const invalidTranscriptions = [{ id: '2', text: 'INVALID' }];
      const numRows = transcriptSpreadsheet.updateTranscriptWithMorphemeValidations(invalidTranscriptions, headers);

      expect(numRows).toBe(3);
      const updates = mockSpreadsheet.getBackgroundUpdates();

      // Row with id '2' should have red background
      const row2Updates = updates.filter(u => u.row === 3);
      expect(row2Updates.some(u => u.color === '#eb9999')).toBe(true);
    });
  });

  describe('updateTranscriptWithGlossAlignmentValidations', () => {
    test('highlights misaligned transcription and gloss cells in red', () => {
      const headers = Object.values(TranscriptColumns);
      const rows = [
        ['1', 'word one', 'word NUM', '', '', '', '', '', ''],
        ['2', 'word two three', 'word NUM1 NUM2', '', '', '', '', '', ''], // Misaligned: 3 words, 2 glosses
        ['3', 'word', 'word', '', '', '', '', '', '']
      ];

      const mockSpreadsheet = new MockSpreadsheet(headers, rows);
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);

      const misalignedIds = ['2'];
      const numRows = transcriptSpreadsheet.updateTranscriptWithGlossAlignmentValidations(misalignedIds, headers);

      expect(numRows).toBe(3);
      const updates = mockSpreadsheet.getBackgroundUpdates();

      // Row 3 (id='2') should have both transcription and gloss columns highlighted
      const row2Updates = updates.filter(u => u.row === 3 && u.color === '#eb9999');
      expect(row2Updates.length).toBe(2); // Both columns
    });
  });

  describe('setAllRowsToWhite', () => {
    test('resets all validation highlighting to white', () => {
      const headers = Object.values(TranscriptColumns);
      const rows = [
        ['1', 'word1', 'word.1', '', '', '', '', '', ''],
        ['2', 'word2', 'word.2', '', '', '', '', '', '']
      ];

      const mockSpreadsheet = new MockSpreadsheet(headers, rows);
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);

      const numRows = transcriptSpreadsheet.setAllRowsToWhite(headers);

      expect(numRows).toBe(2);
      const updates = mockSpreadsheet.getBackgroundUpdates();

      // All updates should be white
      expect(updates.every(u => u.color === 'white')).toBe(true);

      // Should update id, transcription, and gloss columns for each row
      expect(updates.length).toBe(6); // 2 rows × 3 columns
    });
  });

  describe('concordanceToArray', () => {
    test('converts concordance data to 2D array with headers', () => {
      const mockSpreadsheet = new MockSpreadsheet();
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);

      const concordanceData = [
        {
          id: '1',
          word: 'čhá̹-ki̹',
          wordGloss: 'tree-DET',
          wordIndex: 0,
          utterance: 'čhá̹-ki̹ há̹ska',
          utteranceGloss: 'tree-DET is.tall'
        },
        {
          id: '1',
          word: 'há̹ska',
          wordGloss: 'is.tall',
          wordIndex: 1,
          utterance: 'čhá̹-ki̹ há̹ska',
          utteranceGloss: 'tree-DET is.tall'
        }
      ];

      const result = transcriptSpreadsheet.concordanceToArray(concordanceData);

      expect(result).toHaveLength(3); // Headers + 2 data rows
      expect(result[0]).toEqual(['id', 'word', 'word_gloss', 'ipa_transcription', 'ipa_transcription_gloss']);
      expect(result[1]).toEqual(['1', 'čhá̹-ki̹', 'tree-DET', 'čhá̹-ki̹ há̹ska', 'tree-DET is.tall']);
      expect(result[2]).toEqual(['1', 'há̹ska', 'is.tall', 'čhá̹-ki̹ há̹ska', 'tree-DET is.tall']);
    });

    test('handles empty concordance data', () => {
      const mockSpreadsheet = new MockSpreadsheet();
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);

      const result = transcriptSpreadsheet.concordanceToArray([]);

      expect(result).toHaveLength(1); // Just headers
      expect(result[0]).toEqual(['id', 'word', 'word_gloss', 'ipa_transcription', 'ipa_transcription_gloss']);
    });
  });

  describe('updateWithElanData', () => {
    test('updates spreadsheet cells with Elan timing data', () => {
      const headers = [...Object.values(TranscriptColumns), 'begin_time', 'end_time', 'duration'];
      const rows = [
        ['1', 'hau', 'hello', 'hello', '', '', '', '', '', '', '', ''],
        ['2', 'ʧʰáɣa', 'ice', 'ice', '', '', '', '', '', '', '', '']
      ];

      const mockSpreadsheet = new MockSpreadsheet(headers, rows);
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);

      // Get transcript and load Elan data
      const transcript = transcriptSpreadsheet.getTranscriptData();
      const elan = new Elan('id');
      elan.rows = [
        { id: '1', beginTime: '0.000', endTime: '1.500', duration: '1.500' },
        { id: '2', beginTime: '1.500', endTime: '3.000', duration: '1.500' }
      ];

      const elanData = transcript.loadElan(elan);
      transcriptSpreadsheet.updateWithElanData(elanData, transcript);

      const cellUpdates = mockSpreadsheet.getCellUpdates();

      // Check that cells were updated for both rows
      expect(cellUpdates.length).toBe(6); // 2 rows × 3 columns (begin, end, duration)

      // Verify row 1 updates (spreadsheet row 2)
      expect(cellUpdates).toContainEqual({ row: 2, col: 10, value: '0.000' }); // begin_time
      expect(cellUpdates).toContainEqual({ row: 2, col: 11, value: '1.500' }); // end_time
      expect(cellUpdates).toContainEqual({ row: 2, col: 12, value: '1.500' }); // duration

      // Verify row 2 updates (spreadsheet row 3)
      expect(cellUpdates).toContainEqual({ row: 3, col: 10, value: '1.500' }); // begin_time
      expect(cellUpdates).toContainEqual({ row: 3, col: 11, value: '3.000' }); // end_time
      expect(cellUpdates).toContainEqual({ row: 3, col: 12, value: '1.500' }); // duration
    });

    test('handles Elan data with no matching transcript rows', () => {
      const headers = [...Object.values(TranscriptColumns), 'begin_time', 'end_time', 'duration'];
      const rows = [['1', 'hau', 'hello', 'hello', '', '', '', '', '', '', '', '']];

      const mockSpreadsheet = new MockSpreadsheet(headers, rows);
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);

      const transcript = transcriptSpreadsheet.getTranscriptData();
      const elan = new Elan('id');
      elan.rows = [
        { id: '999', beginTime: '0.000', endTime: '1.500', duration: '1.500' } // Non-matching ID
      ];

      const elanData = transcript.loadElan(elan);
      transcriptSpreadsheet.updateWithElanData(elanData, transcript);

      const cellUpdates = mockSpreadsheet.getCellUpdates();

      // No cells should be updated
      expect(cellUpdates.length).toBe(0);
    });

    test('handles undefined row numbers gracefully', () => {
      const headers = [...Object.values(TranscriptColumns), 'begin_time', 'end_time', 'duration'];
      const rows = [['1', 'hau', 'hello', 'hello', '', '', '', '', '', '', '', '']];

      const mockSpreadsheet = new MockSpreadsheet(headers, rows);
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);

      const transcript = transcriptSpreadsheet.getTranscriptData();

      // Create Elan data that doesn't match any transcript IDs
      const elanData = [
        {
          id: '999',
          utterance: 'test',
          utteranceGloss: 'TEST',
          freeTranslation: '',
          note: '',
          speaker: '',
          scribe: '',
          date: '',
          group: '',
          beginTime: '0.000',
          endTime: '1.500',
          duration: '1.500'
        }
      ];

      // Should not throw error
      expect(() => transcriptSpreadsheet.updateWithElanData(elanData, transcript)).not.toThrow();
    });
  });
});
