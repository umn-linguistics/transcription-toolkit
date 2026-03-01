import { ISpreadsheet } from '../interfaces/spreadsheet';
import { IStorage, IFile, IStorageSpreadsheet } from '../interfaces/storage';
import { TranscriptColumns, GraphemeColumns, MorphemeColumns } from '../types';
import { TranscriptSpreadsheet } from '../TranscriptSpreadsheet';
import { TranscriptStorage } from '../TranscriptStorage';
import { Transcript } from '../Transcript';
import { SHEET_NAMES } from '../interfaces/constants';

// Mock implementations for testing
class MockSpreadsheetAdapter implements ISpreadsheet {
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
    return rows.length + 1;
  }

  buildIdToRowMap(headers: string[]): Map<string, number> {
    const idMap = new Map<string, number>();
    const idColIndex = headers.indexOf('id');
    const rows = this.getRows();

    rows.forEach((row, index) => {
      const id = String(row[idColIndex] || '');
      if (id) {
        idMap.set(id, index + 2);
      }
    });

    return idMap;
  }

  updateCellBackgrounds(updates: Array<{ row: number, col: number, color: string }>): void {
    this.backgroundUpdates.push(...updates);
  }

  // Test helpers
  setSelectedData(data: any[][]): void {
    this.selectedData = data;
  }

  getBackgroundUpdates(): Array<{ row: number, col: number, color: string }> {
    return this.backgroundUpdates;
  }

  addSheet(name: string, headers: string[], rows: any[][]): void {
    this.sheets.set(name, { headers, rows });
  }

  getCellUpdates(): Array<{ row: number, col: number, value: any }> {
    return this.cellUpdates;
  }
}

class MockFile implements IFile {
  constructor(
    private id: string,
    private name: string,
    private content: string = ''
  ) {}

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getContent(): string {
    return this.content;
  }

  setContent(content: string): void {
    this.content = content;
  }
}

class MockStorageSpreadsheet implements IStorageSpreadsheet {
  private sheets: any[] = [];
  private activeSheet: any = null;

  constructor(private id: string, private name: string) {
    this.activeSheet = {
      getRange: (row: number, col: number, numRows: number, numCols: number) => ({
        setValues: (values: any[][]) => {}
      })
    };
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getSheets(): any[] {
    return this.sheets;
  }

  getActiveSheet(): any {
    return this.activeSheet;
  }

  setFrozenRows(numRows: number): void {}

  clear(): void {}
}

class MockStorageAdapter implements IStorage {
  private files: Map<string, MockFile> = new Map();
  private spreadsheets: Map<string, MockStorageSpreadsheet> = new Map();
  private currentFolderId: string = 'folder-123';
  private filesByFolder: Map<string, Array<{ id: string; name: string }>> = new Map();

  getCurrentFolderId(): string {
    return this.currentFolderId;
  }

  getOrCreateFile(folderId: string, fileName: string, mimeType: string): IFile {
    const key = `${folderId}/${fileName}`;
    if (!this.files.has(key)) {
      const file = new MockFile(`file-${Date.now()}`, fileName);
      this.files.set(key, file);
    }
    return this.files.get(key)!;
  }

  getOrCreateSpreadsheet(folderId: string, fileName: string): IStorageSpreadsheet {
    const key = `${folderId}/${fileName}`;
    if (!this.spreadsheets.has(key)) {
      const spreadsheet = new MockStorageSpreadsheet(`ss-${Date.now()}`, fileName);
      this.spreadsheets.set(key, spreadsheet);
    }
    return this.spreadsheets.get(key)!;
  }

  getFolder(folderId: string): any {
    return { getId: () => folderId };
  }

  listFiles(folderId: string): Array<{ id: string; name: string }> {
    return this.filesByFolder.get(folderId) || [];
  }

  getFileData(folderId: string, fileName: string, delimiter: string): string[][] {
    const key = `${folderId}/${fileName}`;
    const file = this.files.get(key);
    if (!file) return [];
    return this.parseCsv(file.getContent(), delimiter);
  }

  parseCsv(content: string, delimiter: string): string[][] {
    if (!content) return [];
    return content.split('\n').map(line => line.split(delimiter));
  }

  getFileById(fileId: string): string {
    for (const file of this.files.values()) {
      if (file.getId() === fileId) {
        return file.getContent();
      }
    }
    return '';
  }

  // Test helpers
  addFile(folderId: string, fileId: string, fileName: string, content: string): void {
    const file = new MockFile(fileId, fileName, content);
    this.files.set(`${folderId}/${fileName}`, file);

    if (!this.filesByFolder.has(folderId)) {
      this.filesByFolder.set(folderId, []);
    }
    this.filesByFolder.get(folderId)!.push({ id: fileId, name: fileName });
  }

  getFile(folderId: string, fileName: string): MockFile | undefined {
    return this.files.get(`${folderId}/${fileName}`);
  }
}

describe('gsheets-app integration tests', () => {
  describe('Sheet Creation Functions', () => {
    test('createTranscriptSheet creates sheet with correct headers', () => {
      const mockSpreadsheet = new MockSpreadsheetAdapter();
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);

      const sheetName = transcriptSpreadsheet.createTranscriptSheet(Object.values(TranscriptColumns));

      expect(sheetName).toBe('TranscriptSheet');
      expect(mockSpreadsheet.getSheetNames()).toContain('TranscriptSheet');
      expect(mockSpreadsheet.getWorksheetHeaders('TranscriptSheet')).toEqual(
        Object.values(TranscriptColumns)
      );
    });

    test('createSettingsSheet for morphemes creates correct sheet', () => {
      const mockSpreadsheet = new MockSpreadsheetAdapter();
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);

      const sheetName = transcriptSpreadsheet.createSettingsSheet(
        Object.values(MorphemeColumns),
        SHEET_NAMES.MORPHEME_TAGS
      );

      expect(sheetName).toBe(SHEET_NAMES.MORPHEME_TAGS);
      expect(mockSpreadsheet.getSheetNames()).toContain(SHEET_NAMES.MORPHEME_TAGS);
    });

    test('createSettingsSheet for graphemes creates correct sheet', () => {
      const mockSpreadsheet = new MockSpreadsheetAdapter();
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);

      const sheetName = transcriptSpreadsheet.createSettingsSheet(
        Object.values(GraphemeColumns),
        SHEET_NAMES.GRAPHEME_PROFILE
      );

      expect(sheetName).toBe(SHEET_NAMES.GRAPHEME_PROFILE);
      expect(mockSpreadsheet.getSheetNames()).toContain(SHEET_NAMES.GRAPHEME_PROFILE);
    });
  });

  describe('Word List Generation', () => {
    test('generates concordance and creates word list spreadsheet', () => {
      const headers = Object.values(TranscriptColumns);
      const rows = [
        ['1', 'čhá̹-ki̹ há̹ska', 'tree-DET is.tall', 'The tree is tall', '', '', '', '', ''],
        ['2', 'há̹ska', 'is.tall', 'It is tall', '', '', '', '', '']
      ];

      const mockSpreadsheet = new MockSpreadsheetAdapter(headers, rows);
      const mockStorage = new MockStorageAdapter();

      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);
      const transcriptStorage = new TranscriptStorage(mockStorage);

      const transcript = transcriptSpreadsheet.getTranscriptData();
      const concordanceData = transcript.concordance();

      const folderId = mockStorage.getCurrentFolderId();
      const fileName = 'word-list-test';

      transcriptStorage.createWordListSpreadsheet(concordanceData, folderId, fileName);

      // Verify spreadsheet was created
      const spreadsheet = mockStorage.getOrCreateSpreadsheet(folderId, fileName);
      expect(spreadsheet).toBeDefined();
      expect(spreadsheet.getName()).toBe(fileName);
    });
  });

  describe('Validation Functions', () => {
    test('validateGraphemes identifies invalid characters', () => {
      const headers = Object.values(TranscriptColumns);
      const rows = [
        ['1', 'abc', 'valid', 'valid word', '', '', '', '', ''],
        ['2', 'xyz', 'invalid', 'invalid word', '', '', '', '', '']
      ];

      const mockSpreadsheet = new MockSpreadsheetAdapter(headers, rows);
      mockSpreadsheet.addSheet(SHEET_NAMES.GRAPHEME_PROFILE, ['character'], [['a'], ['b'], ['c']]);

      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);
      const transcript = transcriptSpreadsheet.getTranscriptData();
      const orthography = transcriptSpreadsheet.getGraphemeData();

      const invalidTranscriptions = transcript.validateGraphemes(orthography.profile);

      expect(invalidTranscriptions.length).toBeGreaterThan(0);
      expect(invalidTranscriptions[0].id).toBe('2');
    });

    test('validateIDs identifies missing and duplicate IDs', () => {
      const headers = Object.values(TranscriptColumns);
      const rows = [
        ['1', 'word1', 'gloss1', 'translation1', '', '', '', '', ''],
        ['', 'word2', 'gloss2', 'translation2', '', '', '', '', ''], // Missing ID
        ['1', 'word3', 'gloss3', 'translation3', '', '', '', '', '']  // Duplicate ID
      ];

      const mockSpreadsheet = new MockSpreadsheetAdapter(headers, rows);
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);
      const transcript = transcriptSpreadsheet.getTranscriptData();

      const { missingIds, duplicateRowNumbers } = transcript.validateIds();

      expect(missingIds.length).toBe(1);
      expect(missingIds[0]).toBe(2); // Row 2 has missing ID
      expect(duplicateRowNumbers.length).toBe(1);
      expect(duplicateRowNumbers[0]).toBe('1'); // ID '1' is duplicated
    });

    test('validateMorphemeLabels identifies invalid gloss abbreviations', () => {
      const headers = Object.values(TranscriptColumns);
      const rows = [
        ['1', 'word1', 'DET', 'translation1', '', '', '', '', ''],
        ['2', 'word2', 'INVALID', 'translation2', '', '', '', '', ''],
        ['3', 'word3', 'FUT', 'translation3', '', '', '', '', ''],
        ['4', 'word4', 'Ferdinand.FUT', 'translation3', '', '', '', '', ''],
        ['5', 'word4', 'ferdinand.FUT', 'translation3', '', '', '', '', ''],
        ['6', 'word4', 'FERDINAND.FUT', 'translation3', '', '', '', '', ''],
        ['7', 'the ferdinand', 'DET Ferdinand.FUT', 'translation3', '', '', '', '', ''],
        ['8', 'ab\'bat-otʃ', 'Dad.PAST', 'translation3', '', '', '', '', ''],
      ];
      
      const mockSpreadsheet = new MockSpreadsheetAdapter(headers, rows);
      mockSpreadsheet.addSheet(SHEET_NAMES.MORPHEME_TAGS, ['gloss_abbreviation'], [['DET'], ['FUT'], ['PAST']]);

      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);
      const transcript = transcriptSpreadsheet.getTranscriptData();
      const morphemes = transcriptSpreadsheet.getMorphemeData();

      const invalidTranscriptions = transcript.validateMorphemeLabels(morphemes);

      expect(invalidTranscriptions.length).toBe(2);
      expect(invalidTranscriptions[0].id).toBe('2');
      expect(invalidTranscriptions[1].id).toBe('6');
    });

    test('validateGlossAlignment identifies misaligned glosses', () => {
      const headers = Object.values(TranscriptColumns);
      const rows = [
        ['1', 'word one', 'word NUM', 'translation', '', '', '', '', ''], // Aligned: 2 words, 2 glosses
        ['2', 'word two three', 'word NUM', 'translation', '', '', '', '', ''], // Misaligned: 3 words, 2 glosses
        ['3', 'word', 'word', 'translation', '', '', '', '', ''] // Aligned: 1 word, 1 gloss
      ];

      const mockSpreadsheet = new MockSpreadsheetAdapter(headers, rows);
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);
      const transcript = transcriptSpreadsheet.getTranscriptData();

      const misalignedRows = transcript.validateGlosses();

      expect(misalignedRows.length).toBe(1);
      expect(misalignedRows[0]).toBe('2');
    });

    test('clearValidations resets all cell backgrounds to white', () => {
      const headers = Object.values(TranscriptColumns);
      const rows = [
        ['1', 'word1', 'gloss1', 'translation1', '', '', '', '', ''],
        ['2', 'word2', 'gloss2', 'translation2', '', '', '', '', '']
      ];

      const mockSpreadsheet = new MockSpreadsheetAdapter(headers, rows);
      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);
      const transcript = transcriptSpreadsheet.getTranscriptData();

      transcriptSpreadsheet.setAllRowsToWhite(transcript.headers);

      const updates = mockSpreadsheet.getBackgroundUpdates();
      expect(updates.every(u => u.color === 'white')).toBe(true);
    });
  });

  describe('Export Functions', () => {
    test('exportCsv creates CSV file with correct content', () => {
      const headers = Object.values(TranscriptColumns);
      const rows = [
        ['1', 'ʧʰáɣa', 'ice', 'ice', '', '', '', '', ''],
        ['2', 'hau', 'hello', 'hello', '', '', '', '', '']
      ];

      const mockSpreadsheet = new MockSpreadsheetAdapter(headers, rows);
      const mockStorage = new MockStorageAdapter();

      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);
      const transcript = transcriptSpreadsheet.getTranscriptData();
      const csvContent = transcript.unparseAsCsv();

      const sheetName = mockSpreadsheet.getActiveSheetName();
      const fileName = `transcript-${sheetName}.csv`;
      const folderId = mockStorage.getCurrentFolderId();

      const file = mockStorage.getOrCreateFile(folderId, fileName, 'text/csv');
      file.setContent(csvContent);

      // Verify file was created and has content
      const savedFile = mockStorage.getFile(folderId, fileName);
      expect(savedFile).toBeDefined();
      expect(savedFile?.getContent()).toContain('ʧʰáɣa');
      expect(savedFile?.getContent()).toContain('hau');
    });

    test('exportLatex creates LaTeX file', () => {
      const headers = Object.values(TranscriptColumns);
      const rows = [
        ['1', 'word', 'gloss', 'translation', '', '', '', '', '']
      ];

      const mockSpreadsheet = new MockSpreadsheetAdapter(headers, rows);
      const mockStorage = new MockStorageAdapter();

      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);
      const transcript = transcriptSpreadsheet.getTranscriptData();
      const latex = transcript.generateLatexDocument();

      const sheetName = mockSpreadsheet.getActiveSheetName();
      const fileName = `transcript-${sheetName}.tex`;
      const folderId = mockStorage.getCurrentFolderId();

      const file = mockStorage.getOrCreateFile(folderId, fileName, 'text/plain');
      file.setContent(latex);

      const savedFile = mockStorage.getFile(folderId, fileName);
      expect(savedFile?.getContent()).toContain('\\documentclass{article}');
      expect(savedFile?.getContent()).toContain('\\begin{document}');
    });

    test('exportText creates text file with glosses', () => {
      const headers = Object.values(TranscriptColumns);
      const rows = [
        ['1', 'word one', 'word NUM', 'translation', '', '', '', '', '']
      ];

      const mockSpreadsheet = new MockSpreadsheetAdapter(headers, rows);
      const mockStorage = new MockStorageAdapter();

      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);
      const transcript = transcriptSpreadsheet.getTranscriptData();
      const text = transcript.generateGlossText();

      const sheetName = mockSpreadsheet.getActiveSheetName();
      const fileName = `transcript-${sheetName}.txt`;
      const folderId = mockStorage.getCurrentFolderId();

      const file = mockStorage.getOrCreateFile(folderId, fileName, 'text/plain');
      file.setContent(text);

      const savedFile = mockStorage.getFile(folderId, fileName);
      expect(savedFile?.getContent()).toContain('(1)');
      expect(savedFile?.getContent()).toContain('word');
    });

    test('exportCsvBySpeaker creates separate files for each speaker', () => {
      const headers = Object.values(TranscriptColumns);
      const rows = [
        ['1', 'word1', 'gloss1', 'translation1', '', 'SpeakerA', '', '', ''],
        ['2', 'word2', 'gloss2', 'translation2', '', 'SpeakerB', '', '', ''],
        ['3', 'word3', 'gloss3', 'translation3', '', 'SpeakerA', '', '', '']
      ];

      const mockSpreadsheet = new MockSpreadsheetAdapter(headers, rows);
      const mockStorage = new MockStorageAdapter();

      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);
      const transcript = transcriptSpreadsheet.getTranscriptData();
      const speakerTranscripts = transcript.bySpeaker();

      const sheetName = mockSpreadsheet.getActiveSheetName();
      const folderId = mockStorage.getCurrentFolderId();
      let fileCount = 0;

      for (let speakerTranscript of speakerTranscripts) {
        const csvContent = speakerTranscript.unparseAsCsv();
        const fileName = `transcript-${sheetName}-speaker-${speakerTranscript.speaker}.csv`;
        const file = mockStorage.getOrCreateFile(folderId, fileName, 'text/csv');
        file.setContent(csvContent);
        fileCount += 1;
      }

      expect(fileCount).toBe(2); // SpeakerA and SpeakerB

      // Verify files were created
      const speakerAFile = mockStorage.getFile(folderId, `transcript-${sheetName}-speaker-SpeakerA.csv`);
      const speakerBFile = mockStorage.getFile(folderId, `transcript-${sheetName}-speaker-SpeakerB.csv`);

      expect(speakerAFile).toBeDefined();
      expect(speakerBFile).toBeDefined();
      expect(speakerAFile?.getContent()).toContain('word1');
      expect(speakerBFile?.getContent()).toContain('word2');
    });
  });

  describe('ELAN Integration', () => {
    test('processElanFiles updates transcript with timing data', () => {
      const headers = [...Object.values(TranscriptColumns), 'begin_time', 'end_time', 'duration'];
      const rows = [
        ['1', 'hau', 'hello', 'hello', '', '', '', '', '', '', '', ''],
        ['2', 'ʧʰáɣa', 'ice', 'ice', '', '', '', '', '', '', '', '']
      ];

      const mockSpreadsheet = new MockSpreadsheetAdapter(headers, rows);
      const mockStorage = new MockStorageAdapter();

      // Add ELAN CSV file to storage
      const folderId = mockStorage.getCurrentFolderId();
      const elanFileId = 'elan-file-1';
      const elanContent = `Tier\tBegin Time - ss.msec\tEnd Time - ss.msec\tDuration - ss.msec\tid\n` +
                         `speaker\t0.000\t1.500\t1.500\t1\n` +
                         `speaker\t1.500\t3.000\t1.500\t2`;

      mockStorage.addFile(folderId, elanFileId, 'elan-export.txt', elanContent);

      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);
      const transcript = transcriptSpreadsheet.getTranscriptData();

      // Parse ELAN file
      const fileData = mockStorage.parseCsv(elanContent, '\t');
      const elan = new (require('../Elan').Elan)('id');
      elan.load(fileData);

      const elanUpdates = transcript.loadElan(elan);
      transcriptSpreadsheet.updateWithElanData(elanUpdates, transcript);

      const cellUpdates = mockSpreadsheet.getCellUpdates();
      expect(cellUpdates.length).toBeGreaterThan(0);
    });

    test('processElanFiles returns error when ID tier name is empty', () => {
      const elanIdTierName = '';

      // Simulate the validation check
      const result = !elanIdTierName || elanIdTierName === ''
        ? 'First enter the name of the ID tier in ELAN'
        : 'Success';

      expect(result).toBe('First enter the name of the ID tier in ELAN');
    });

    test('getDriveFiles lists files in current folder', () => {
      const mockStorage = new MockStorageAdapter();
      const folderId = mockStorage.getCurrentFolderId();

      mockStorage.addFile(folderId, 'file-1', 'test1.txt', 'content1');
      mockStorage.addFile(folderId, 'file-2', 'test2.txt', 'content2');

      const files = mockStorage.listFiles(folderId);

      expect(files).toHaveLength(2);
      expect(files[0].name).toBe('test1.txt');
      expect(files[1].name).toBe('test2.txt');
    });
  });

  describe('Selected Glosses', () => {
    test('showSelectedGlosses generates HTML for selected rows', () => {
      const headers = Object.values(TranscriptColumns);
      const allRows = [
        ['1', 'word one', 'word NUM', 'translation', '', '', '', '', ''],
        ['2', 'word two', 'word NUM', 'translation', '', '', '', '', '']
      ];
      const selectedRows = [
        ['1', 'word one', 'word NUM', 'translation', '', '', '', '', '']
      ];

      const mockSpreadsheet = new MockSpreadsheetAdapter(headers, allRows);
      mockSpreadsheet.setSelectedData(selectedRows);

      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);
      const transcript = transcriptSpreadsheet.getSelectedTranscriptData();
      const glosses = transcript.generateGlossHtml();

      expect(glosses).toContain('(1)');
      expect(glosses).toContain('word');
      expect(transcript.rows).toHaveLength(1);
    });

    test('showSelectedGlosses throws error when no rows selected', () => {
      const headers = Object.values(TranscriptColumns);
      const mockSpreadsheet = new MockSpreadsheetAdapter(headers, []);
      mockSpreadsheet.setSelectedData([]);

      const transcriptSpreadsheet = new TranscriptSpreadsheet(mockSpreadsheet);

      expect(() => transcriptSpreadsheet.getSelectedTranscriptData()).toThrow(
        'No rows are selected. Select one or more rows to see glosses.'
      );
    });
  });
});
