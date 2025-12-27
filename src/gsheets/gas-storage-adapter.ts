/**
 * Google Apps Script implementation of the storage adapter
 */

import { IStorage, IFile, IFolder, IStorageSpreadsheet } from '../interfaces/storage';

class GASFile implements IFile {
  constructor(private file: GoogleAppsScript.Drive.File) {}

  getId(): string {
    return this.file.getId();
  }

  getName(): string {
    return this.file.getName();
  }

  getContent(): string {
    return this.file.getBlob().getDataAsString();
  }

  setContent(content: string): void {
    this.file.setContent(content);
  }
}

class GASFolder implements IFolder {
  constructor(private folder: GoogleAppsScript.Drive.Folder) {}

  getId(): string {
    return this.folder.getId();
  }

  getName(): string {
    return this.folder.getName();
  }

  getFiles(): IFile[] {
    const files: IFile[] = [];
    const iterator = this.folder.getFiles();

    while (iterator.hasNext()) {
      files.push(new GASFile(iterator.next()));
    }

    return files;
  }

  getFilesByName(name: string): IFile[] {
    const files: IFile[] = [];
    const iterator = this.folder.getFilesByName(name);

    while (iterator.hasNext()) {
      files.push(new GASFile(iterator.next()));
    }

    return files;
  }

  createFile(name: string, content: string, mimeType: string): IFile {
    const file = this.folder.createFile(name, content, mimeType);
    return new GASFile(file);
  }
}

class GASSpreadsheet implements IStorageSpreadsheet {
  constructor(private spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet) {}

  getId(): string {
    return this.spreadsheet.getId();
  }

  getName(): string {
    return this.spreadsheet.getName();
  }

  getSheets(): any[] {
    return this.spreadsheet.getSheets();
  }

  getActiveSheet(): any {
    return this.spreadsheet.getActiveSheet();
  }

  setFrozenRows(numRows: number): void {
    this.spreadsheet.setFrozenRows(numRows);
  }

  clear(): void {
    this.spreadsheet.getSheets().forEach(s => s.clear());
  }
}

export class GASStorageAdapter implements IStorage {
  getCurrentFolderId(): string {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const file = DriveApp.getFileById(ss.getId());
    const folders = file.getParents();

    if (folders.hasNext()) {
      return folders.next().getId();
    }

    return '';
  }

  getOrCreateFile(folderId: string, fileName: string, mimeType: string): IFile {
    const folder = this.getFolder(folderId);
    const existingFiles = folder.getFilesByName(fileName);

    if (existingFiles.length > 0) {
      return existingFiles[0];
    }

    return folder.createFile(fileName, '', mimeType);
  }

  getOrCreateSpreadsheet(folderId: string, fileName: string): IStorageSpreadsheet {
    const folder = DriveApp.getFolderById(folderId);
    const existingFiles = folder.getFilesByName(fileName);

    let spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;

    if (!existingFiles.hasNext()) {
      spreadsheet = SpreadsheetApp.create(fileName);
      DriveApp.getFileById(spreadsheet.getId()).moveTo(folder);
    } else {
      const file = existingFiles.next();
      spreadsheet = SpreadsheetApp.open(file);
    }

    return new GASSpreadsheet(spreadsheet);
  }

  getFolder(folderId: string): IFolder {
    return new GASFolder(DriveApp.getFolderById(folderId));
  }

  listFiles(folderId: string): Array<{ id: string; name: string }> {
    const folder = DriveApp.getFolderById(folderId);
    const files: Array<{ id: string; name: string }> = [];
    const iterator = folder.getFiles();

    while (iterator.hasNext()) {
      const file = iterator.next();
      files.push({
        id: file.getId(),
        name: file.getName()
      });
    }

    return files;
  }

  getFileData(folderId: string, fileName: string, delimiter: string = '\t'): string[][] {
    const folder = new GASFolder(DriveApp.getFolderById(folderId));
    const files = folder.getFilesByName(fileName);

    if (files.length === 0) {
      throw new Error(`File ${fileName} not found`);
    }

    const fileString = files[0].getContent();
    return this.parseCsv(fileString, delimiter);
  }

  parseCsv(content: string, delimiter: string): string[][] {
    return Utilities.parseCsv(content, delimiter);
  }
}
