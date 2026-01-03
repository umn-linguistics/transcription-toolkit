import { TranscriptStorage } from './TranscriptStorage';
import { ConcordanceRow } from './types';
import { IStorage, IStorageSpreadsheet } from './interfaces/storage';

// Mock implementations
class MockSheet {
  private data: any[][] = [];
  private frozenRows: number = 0;

  getRange(row: number, col: number, numRows: number, numCols: number) {
    return {
      setValues: (values: any[][]) => {
        this.data = values;
      },
      getValues: () => this.data
    };
  }

  setFrozenRows(numRows: number) {
    this.frozenRows = numRows;
  }

  getFrozenRows() {
    return this.frozenRows;
  }

  clear() {
    this.data = [];
  }

  getData() {
    return this.data;
  }
}

class MockStorageSpreadsheet implements IStorageSpreadsheet {
  private id: string;
  private name: string;
  private sheet: MockSheet;
  private frozenRows: number = 0;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.sheet = new MockSheet();
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getSheets(): any[] {
    return [this.sheet];
  }

  getActiveSheet(): any {
    return this.sheet;
  }

  setFrozenRows(numRows: number): void {
    this.frozenRows = numRows;
    this.sheet.setFrozenRows(numRows);
  }

  clear(): void {
    this.sheet.clear();
  }

  getFrozenRows(): number {
    return this.frozenRows;
  }
}

class MockStorage implements IStorage {
  private spreadsheets: Map<string, MockStorageSpreadsheet> = new Map();
  private currentFolderId: string = 'test-folder-id';

  getCurrentFolderId(): string {
    return this.currentFolderId;
  }

  getOrCreateFile(folderId: string, fileName: string, mimeType: string): any {
    return null;
  }

  getOrCreateSpreadsheet(folderId: string, fileName: string): IStorageSpreadsheet {
    const key = `${folderId}/${fileName}`;
    if (!this.spreadsheets.has(key)) {
      this.spreadsheets.set(key, new MockStorageSpreadsheet(`spreadsheet-${key}`, fileName));
    }
    return this.spreadsheets.get(key)!;
  }

  getFolder(folderId: string): any {
    return null;
  }

  listFiles(folderId: string): Array<{ id: string; name: string }> {
    return [];
  }

  getFileData(folderId: string, fileName: string, delimiter: string): string[][] {
    return [];
  }

  parseCsv(content: string, delimiter: string): string[][] {
    return [];
  }

  getFileById(fileId: string): string {
    return '';
  }

  getSpreadsheet(folderId: string, fileName: string): MockStorageSpreadsheet | undefined {
    return this.spreadsheets.get(`${folderId}/${fileName}`);
  }
}

describe('TranscriptStorage', () => {
  describe('constructor', () => {
    test('initializes with storage', () => {
      const storage = new MockStorage();
      const transcriptStorage = new TranscriptStorage(storage);

      expect(transcriptStorage.storage).toBe(storage);
    });
  });

  describe('concordanceToArray', () => {
    test('converts concordance data to array format', () => {
      const storage = new MockStorage();
      const transcriptStorage = new TranscriptStorage(storage);

      const concordanceData: ConcordanceRow[] = [
        {
          id: '1',
          word: 'bon',
          wordGloss: 'good',
          wordIndex: 0,
          utterance: 'bon jour',
          utteranceGloss: 'hello'
        },
        {
          id: '2',
          word: 'jour',
          wordGloss: 'day',
          wordIndex: 1,
          utterance: 'bon jour',
          utteranceGloss: 'hello'
        }
      ];

      const result = transcriptStorage.concordanceToArray(concordanceData);

      expect(result).toHaveLength(3); // header + 2 rows
      expect(result[0]).toEqual(['id', 'word', 'word_gloss', 'ipa_transcription', 'ipa_transcription_gloss']);
      expect(result[1]).toEqual(['1', 'bon', 'good', 'bon jour', 'hello']);
      expect(result[2]).toEqual(['2', 'jour', 'day', 'bon jour', 'hello']);
    });

    test('handles empty concordance data', () => {
      const storage = new MockStorage();
      const transcriptStorage = new TranscriptStorage(storage);

      const result = transcriptStorage.concordanceToArray([]);

      expect(result).toHaveLength(1); // only header
      expect(result[0]).toEqual(['id', 'word', 'word_gloss', 'ipa_transcription', 'ipa_transcription_gloss']);
    });

    test('handles single row concordance data', () => {
      const storage = new MockStorage();
      const transcriptStorage = new TranscriptStorage(storage);

      const concordanceData: ConcordanceRow[] = [
        {
          id: '1',
          word: 'bon',
          wordGloss: 'good',
          wordIndex: 0,
          utterance: 'bon',
          utteranceGloss: 'good'
        }
      ];

      const result = transcriptStorage.concordanceToArray(concordanceData);

      expect(result).toHaveLength(2);
      expect(result[1]).toEqual(['1', 'bon', 'good', 'bon', 'good']);
    });

    test('preserves empty strings in concordance data', () => {
      const storage = new MockStorage();
      const transcriptStorage = new TranscriptStorage(storage);

      const concordanceData: ConcordanceRow[] = [
        {
          id: '1',
          word: '',
          wordGloss: '',
          wordIndex: 0,
          utterance: '',
          utteranceGloss: ''
        }
      ];

      const result = transcriptStorage.concordanceToArray(concordanceData);

      expect(result).toHaveLength(2);
      expect(result[1]).toEqual(['1', '', '', '', '']);
    });

    test('handles special characters in concordance data', () => {
      const storage = new MockStorage();
      const transcriptStorage = new TranscriptStorage(storage);

      const concordanceData: ConcordanceRow[] = [
        {
          id: '1',
          word: 'café',
          wordGloss: 'coffee-shop',
          wordIndex: 0,
          utterance: 'kæˈfeɪ',
          utteranceGloss: 'coffee.shop'
        }
      ];

      const result = transcriptStorage.concordanceToArray(concordanceData);

      expect(result[1]).toEqual(['1', 'café', 'coffee-shop', 'kæˈfeɪ', 'coffee.shop']);
    });

    test('handles Unicode characters in concordance data', () => {
      const storage = new MockStorage();
      const transcriptStorage = new TranscriptStorage(storage);

      const concordanceData: ConcordanceRow[] = [
        {
          id: '1',
          word: '你好',
          wordGloss: 'hello',
          wordIndex: 0,
          utterance: 'nǐhǎo',
          utteranceGloss: 'greeting'
        }
      ];

      const result = transcriptStorage.concordanceToArray(concordanceData);

      expect(result[1]).toEqual(['1', '你好', 'hello', 'nǐhǎo', 'greeting']);
    });

    test('handles large concordance datasets', () => {
      const storage = new MockStorage();
      const transcriptStorage = new TranscriptStorage(storage);

      const concordanceData: ConcordanceRow[] = [];
      for (let i = 0; i < 100; i++) {
        concordanceData.push({
          id: String(i),
          word: `word${i}`,
          wordGloss: `gloss${i}`,
          wordIndex: i,
          utterance: `utterance${i}`,
          utteranceGloss: `utteranceGloss${i}`
        });
      }

      const result = transcriptStorage.concordanceToArray(concordanceData);

      expect(result).toHaveLength(101); // header + 100 rows
      expect(result[1]).toEqual(['0', 'word0', 'gloss0', 'utterance0', 'utteranceGloss0']);
      expect(result[100]).toEqual(['99', 'word99', 'gloss99', 'utterance99', 'utteranceGloss99']);
    });
  });

  describe('createWordListSpreadsheet', () => {
    test('creates spreadsheet with concordance data', () => {
      const storage = new MockStorage();
      const transcriptStorage = new TranscriptStorage(storage);

      const concordanceData: ConcordanceRow[] = [
        {
          id: '1',
          word: 'bon',
          wordGloss: 'good',
          wordIndex: 0,
          utterance: 'bon',
          utteranceGloss: 'good'
        }
      ];

      transcriptStorage.createWordListSpreadsheet(concordanceData, 'folder-123', 'wordlist.xlsx');

      const spreadsheet = storage.getSpreadsheet('folder-123', 'wordlist.xlsx');
      expect(spreadsheet).toBeDefined();
      expect(spreadsheet!.getName()).toBe('wordlist.xlsx');
    });

    test('writes concordance data to spreadsheet', () => {
      const storage = new MockStorage();
      const transcriptStorage = new TranscriptStorage(storage);

      const concordanceData: ConcordanceRow[] = [
        {
          id: '1',
          word: 'hello',
          wordGloss: 'greeting',
          wordIndex: 0,
          utterance: 'həˈloʊ',
          utteranceGloss: 'greeting world'
        },
        {
          id: '2',
          word: 'world',
          wordGloss: 'earth',
          wordIndex: 1,
          utterance: 'wɜrld',
          utteranceGloss: 'hello earth'
        }
      ];

      transcriptStorage.createWordListSpreadsheet(concordanceData, 'folder-123', 'wordlist.xlsx');

      const spreadsheet = storage.getSpreadsheet('folder-123', 'wordlist.xlsx');
      const sheet = spreadsheet!.getActiveSheet();
      const data = sheet.getData();

      expect(data).toHaveLength(3); // header + 2 rows
      expect(data[0]).toEqual(['id', 'word', 'word_gloss', 'ipa_transcription', 'ipa_transcription_gloss']);
      expect(data[1]).toEqual(['1', 'hello', 'greeting', 'həˈloʊ', 'greeting world']);
      expect(data[2]).toEqual(['2', 'world', 'earth', 'wɜrld', 'hello earth']);
    });

    test('freezes header row', () => {
      const storage = new MockStorage();
      const transcriptStorage = new TranscriptStorage(storage);

      const concordanceData: ConcordanceRow[] = [
        {
          id: '1',
          word: 'test',
          wordGloss: 'test_gloss',
          wordIndex: 0,
          utterance: 'tɛst',
          utteranceGloss: 'test gloss full'
        }
      ];

      transcriptStorage.createWordListSpreadsheet(concordanceData, 'folder-123', 'wordlist.xlsx');

      const spreadsheet = storage.getSpreadsheet('folder-123', 'wordlist.xlsx');
      expect(spreadsheet!.getFrozenRows()).toBe(1);
    });

    test('clears existing data before writing', () => {
      const storage = new MockStorage();
      const transcriptStorage = new TranscriptStorage(storage);

      const concordanceData1: ConcordanceRow[] = [
        {
          id: '1',
          word: 'old',
          wordGloss: 'old_gloss',
          wordIndex: 0,
          utterance: 'oʊld',
          utteranceGloss: 'old utterance'
        }
      ];

      // First write
      transcriptStorage.createWordListSpreadsheet(concordanceData1, 'folder-123', 'wordlist.xlsx');

      const concordanceData2: ConcordanceRow[] = [
        {
          id: '2',
          word: 'new',
          wordGloss: 'new_gloss',
          wordIndex: 0,
          utterance: 'nuː',
          utteranceGloss: 'new utterance'
        }
      ];

      // Second write
      transcriptStorage.createWordListSpreadsheet(concordanceData2, 'folder-123', 'wordlist.xlsx');

      const spreadsheet = storage.getSpreadsheet('folder-123', 'wordlist.xlsx');
      const sheet = spreadsheet!.getActiveSheet();
      const data = sheet.getData();

      expect(data).toHaveLength(2); // header + 1 row (not 3)
      expect(data[1]).toEqual(['2', 'new', 'new_gloss', 'nuː', 'new utterance']);
    });

    test('handles empty concordance data', () => {
      const storage = new MockStorage();
      const transcriptStorage = new TranscriptStorage(storage);

      transcriptStorage.createWordListSpreadsheet([], 'folder-123', 'wordlist.xlsx');

      const spreadsheet = storage.getSpreadsheet('folder-123', 'wordlist.xlsx');
      const sheet = spreadsheet!.getActiveSheet();
      const data = sheet.getData();

      expect(data).toHaveLength(1); // only header
      expect(data[0]).toEqual(['id', 'word', 'word_gloss', 'ipa_transcription', 'ipa_transcription_gloss']);
    });

    test('creates spreadsheet in correct folder', () => {
      const storage = new MockStorage();
      const transcriptStorage = new TranscriptStorage(storage);

      const concordanceData: ConcordanceRow[] = [
        {
          id: '1',
          word: 'test',
          wordGloss: 'test_gloss',
          wordIndex: 0,
          utterance: 'tɛst',
          utteranceGloss: 'test gloss full'
        }
      ];

      transcriptStorage.createWordListSpreadsheet(concordanceData, 'folder-abc', 'wordlist.xlsx');
      transcriptStorage.createWordListSpreadsheet(concordanceData, 'folder-xyz', 'wordlist.xlsx');

      const spreadsheet1 = storage.getSpreadsheet('folder-abc', 'wordlist.xlsx');
      const spreadsheet2 = storage.getSpreadsheet('folder-xyz', 'wordlist.xlsx');

      expect(spreadsheet1).toBeDefined();
      expect(spreadsheet2).toBeDefined();
      expect(spreadsheet1!.getId()).not.toBe(spreadsheet2!.getId());
    });

    test('uses correct file name', () => {
      const storage = new MockStorage();
      const transcriptStorage = new TranscriptStorage(storage);

      const concordanceData: ConcordanceRow[] = [
        {
          id: '1',
          word: 'test',
          wordGloss: 'test_gloss',
          wordIndex: 0,
          utterance: 'tɛst',
          utteranceGloss: 'test gloss full'
        }
      ];

      transcriptStorage.createWordListSpreadsheet(concordanceData, 'folder-123', 'my-custom-wordlist.xlsx');

      const spreadsheet = storage.getSpreadsheet('folder-123', 'my-custom-wordlist.xlsx');
      expect(spreadsheet).toBeDefined();
      expect(spreadsheet!.getName()).toBe('my-custom-wordlist.xlsx');
    });

    test('handles multiple wordlists in same folder', () => {
      const storage = new MockStorage();
      const transcriptStorage = new TranscriptStorage(storage);

      const concordanceData1: ConcordanceRow[] = [
        {
          id: '1',
          word: 'list1',
          wordGloss: 'gloss1',
          wordIndex: 0,
          utterance: 'lɪst1',
          utteranceGloss: 'utterance1'
        }
      ];

      const concordanceData2: ConcordanceRow[] = [
        {
          id: '2',
          word: 'list2',
          wordGloss: 'gloss2',
          wordIndex: 0,
          utterance: 'lɪst2',
          utteranceGloss: 'utterance2'
        }
      ];

      transcriptStorage.createWordListSpreadsheet(concordanceData1, 'folder-123', 'wordlist1.xlsx');
      transcriptStorage.createWordListSpreadsheet(concordanceData2, 'folder-123', 'wordlist2.xlsx');

      const spreadsheet1 = storage.getSpreadsheet('folder-123', 'wordlist1.xlsx');
      const spreadsheet2 = storage.getSpreadsheet('folder-123', 'wordlist2.xlsx');

      expect(spreadsheet1).toBeDefined();
      expect(spreadsheet2).toBeDefined();

      const data1 = spreadsheet1!.getActiveSheet().getData();
      const data2 = spreadsheet2!.getActiveSheet().getData();

      expect(data1[1]).toEqual(['1', 'list1', 'gloss1', 'lɪst1', 'utterance1']);
      expect(data2[1]).toEqual(['2', 'list2', 'gloss2', 'lɪst2', 'utterance2']);
    });
  });

  describe('integration tests', () => {
    test('full workflow: convert and create spreadsheet', () => {
      const storage = new MockStorage();
      const transcriptStorage = new TranscriptStorage(storage);

      const concordanceData: ConcordanceRow[] = [
        {
          id: '1',
          word: 'hello',
          wordGloss: 'greeting',
          wordIndex: 0,
          utterance: 'həˈloʊ',
          utteranceGloss: 'greeting world'
        },
        {
          id: '1',
          word: 'world',
          wordGloss: 'earth',
          wordIndex: 1,
          utterance: 'həˈloʊ wɜrld',
          utteranceGloss: 'greeting earth'
        }
      ];

      // Convert to array
      const arrayData = transcriptStorage.concordanceToArray(concordanceData);
      expect(arrayData).toHaveLength(3);

      // Create spreadsheet
      transcriptStorage.createWordListSpreadsheet(concordanceData, 'folder-123', 'wordlist.xlsx');

      // Verify spreadsheet
      const spreadsheet = storage.getSpreadsheet('folder-123', 'wordlist.xlsx');
      const sheet = spreadsheet!.getActiveSheet();
      const data = sheet.getData();

      expect(data).toEqual(arrayData);
      expect(spreadsheet!.getFrozenRows()).toBe(1);
    });

    test('handles real-world linguistic data', () => {
      const storage = new MockStorage();
      const transcriptStorage = new TranscriptStorage(storage);

      const concordanceData: ConcordanceRow[] = [
        {
          id: '1',
          word: 'wičháša',
          wordGloss: 'man',
          wordIndex: 0,
          utterance: 'wičháša kiŋ',
          utteranceGloss: 'man the'
        },
        {
          id: '1',
          word: 'kiŋ',
          wordGloss: 'the',
          wordIndex: 1,
          utterance: 'wičháša kiŋ',
          utteranceGloss: 'man the'
        }
      ];

      transcriptStorage.createWordListSpreadsheet(concordanceData, 'folder-123', 'lakota-wordlist.xlsx');

      const spreadsheet = storage.getSpreadsheet('folder-123', 'lakota-wordlist.xlsx');
      const data = spreadsheet!.getActiveSheet().getData();

      expect(data[1]).toEqual(['1', 'wičháša', 'man', 'wičháša kiŋ', 'man the']);
      expect(data[2]).toEqual(['1', 'kiŋ', 'the', 'wičháša kiŋ', 'man the']);
    });
  });

  describe('edge cases', () => {
    test('handles concordance data with wordIndex 0', () => {
      const storage = new MockStorage();
      const transcriptStorage = new TranscriptStorage(storage);

      const concordanceData: ConcordanceRow[] = [
        {
          id: '1',
          word: 'first',
          wordGloss: 'first_word',
          wordIndex: 0,
          utterance: 'fɜrst',
          utteranceGloss: 'first word'
        }
      ];

      const result = transcriptStorage.concordanceToArray(concordanceData);
      expect(result[1][0]).toBe('1');
    });

    test('handles very long strings in concordance data', () => {
      const storage = new MockStorage();
      const transcriptStorage = new TranscriptStorage(storage);

      const longString = 'a'.repeat(1000);
      const concordanceData: ConcordanceRow[] = [
        {
          id: '1',
          word: longString,
          wordGloss: longString,
          wordIndex: 0,
          utterance: longString,
          utteranceGloss: longString
        }
      ];

      const result = transcriptStorage.concordanceToArray(concordanceData);
      expect(result[1][1]).toBe(longString);
      expect(result[1][1].length).toBe(1000);
    });

    test('handles numeric IDs as strings', () => {
      const storage = new MockStorage();
      const transcriptStorage = new TranscriptStorage(storage);

      const concordanceData: ConcordanceRow[] = [
        {
          id: '123',
          word: 'test',
          wordGloss: 'test_gloss',
          wordIndex: 0,
          utterance: 'tɛst',
          utteranceGloss: 'test gloss full'
        }
      ];

      const result = transcriptStorage.concordanceToArray(concordanceData);
      expect(result[1][0]).toBe('123');
    });

    test('handles whitespace in concordance data', () => {
      const storage = new MockStorage();
      const transcriptStorage = new TranscriptStorage(storage);

      const concordanceData: ConcordanceRow[] = [
        {
          id: '1',
          word: '  test  ',
          wordGloss: '  gloss  ',
          wordIndex: 0,
          utterance: '  utterance  ',
          utteranceGloss: '  utterance gloss  '
        }
      ];

      const result = transcriptStorage.concordanceToArray(concordanceData);
      expect(result[1]).toEqual(['1', '  test  ', '  gloss  ', '  utterance  ', '  utterance gloss  ']);
    });
  });
});
