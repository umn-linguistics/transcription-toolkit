/**
 * Interfaces defining storage operations needed by the application core.
 */

export interface IFile {
  getId(): string;
  getName(): string;
  getContent(): string;
  setContent(content: string): void;
}

export interface IFolder {
  getId(): string;
  getName(): string;
  getFiles(): IFile[];
  getFilesByName(name: string): IFile[];
  createFile(name: string, content: string, mimeType: string): IFile;
}

export interface IStorageSpreadsheet {
  getId(): string;
  getName(): string;
  getSheets(): any[];
  getActiveSheet(): any;
  setFrozenRows(numRows: number): void;
  clear(): void;
}

export interface IStorage {
  /**
   * Get the folder ID where the current spreadsheet is located
   */
  getCurrentFolderId(): string;

  /**
   * Get or create a file in the specified folder
   */
  getOrCreateFile(folderId: string, fileName: string, mimeType: string): IFile;

  /**
   * Get or create a spreadsheet in the specified folder
   */
  getOrCreateSpreadsheet(folderId: string, fileName: string): IStorageSpreadsheet;

  /**
   * Get a folder by ID
   */
  getFolder(folderId: string): IFolder;

  /**
   * List all files in a folder
   */
  listFiles(folderId: string): Array<{ id: string; name: string }>;

  /**
   * Get file data as a 2D array (for CSV/TSV files)
   */
  getFileData(folderId: string, fileName: string, delimiter: string): string[][];

  /**
   * Parse CSV string to 2D array
   */
  parseCsv(content: string, delimiter: string): string[][];
}
