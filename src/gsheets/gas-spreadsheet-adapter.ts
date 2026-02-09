/**
 * Google Apps Script adapter implementing spreadsheet and UI ports.
 */

import { ISpreadsheet } from '../interfaces/spreadsheet';
import { COLORS } from '../interfaces/constants';

export class GASSpreadsheetAdapter implements ISpreadsheet {
  getActiveSheetName(): string {
    return SpreadsheetApp.getActiveSheet().getName();
  }

  getHeaders(): string[] {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const lastColumn = sheet.getLastColumn();
    if (lastColumn === 0) return [];
    return sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  }

  getRows(): any[][] {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();
    return data.slice(1); // Exclude header row
  }

  getWorksheetHeaders(worksheetName: string): string[] {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(worksheetName);
    if (!sheet) {
      throw new Error(`Worksheet "${worksheetName}" not found`);
    } 
    const lastColumn = sheet.getLastColumn();
    if (lastColumn === 0) return [];
    return sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  }

  getWorksheetRows(worksheetName: string): any[][] {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(worksheetName);
    if (!sheet) {
      throw new Error(`Worksheet "${worksheetName}" not found`);
    }
    const data = sheet.getDataRange().getValues();
    return data.slice(1); // Exclude header row
  }


  getSelectedData(headers: string[]): any[][] {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const activeRange = sheet.getActiveRange();

    if (!activeRange) {
      return [];
    }

    const beginIndex = activeRange.getRowIndex();
    const endIndex = activeRange.getLastRow();
    const numColumns = headers.length;

    const rangeData = sheet.getRange(
      beginIndex,
      1,
      endIndex - beginIndex + 1,
      numColumns
    );

    return rangeData.getValues();
  }

  updateCell(row: number, col: number, value: any): void {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.getRange(row, col).setValue(value);
  }

  updateCellBackground(row: number, col: number, color: string): void {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.getRange(row, col).setBackground(color);
  }

  getSheetNames(): string[] {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    return spreadsheet.getSheets().map(s => s.getName());
  }

  createSheet(name: string, headers: string[]): void {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // Create the new sheet
    const newSheet = spreadsheet.insertSheet(name);

    // Set headers
    if (headers.length > 0) {
      newSheet.getRange(1, 1, 1, headers.length).setValues([headers]);

      // Format headers
      const headerRange = newSheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground(COLORS.HEADER_BACKGROUND);

      // Lock header rows to prevent editing by anyone other than owner
      const protection = headerRange.protect();
      const editors = protection.getEditors();

      if (editors.length > 0){
        protection.removeEditors(editors);
      }
      protection.setDescription(`Protected range: ${headerRange}`);
      newSheet.setFrozenRows(1);
    }
  }

  getLastRow(): number {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    return sheet.getLastRow();
  }

  buildIdToRowMap(headers: string[]): Map<string, number> {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const transcriptRowCount = sheet.getLastRow();
    const idMap = new Map<string, number>();
    const idColumnIndex = headers.indexOf('id') + 1; // 1-indexed

    Logger.log(`Build id to row map.`)
    const values = sheet.getRange(1, idColumnIndex, transcriptRowCount, 1).getValues();
    for (let rowNum = 0; rowNum < values.length; rowNum++) {
      idMap.set(values[rowNum][0].toString(), rowNum + 1);
    }
    Logger.log(`Done building id to row map.`)
    return idMap;
  }

  updateCellBackgrounds(updates: Array<{row: number, col: number, color: string}>): void {
    Logger.log(`Get spreadsheet for cell color background update.`)
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Group updates by color to minimize API calls
    const byColor = new Map<string, Array<{row: number, col: number}>>();

    Logger.log(`Set colors for update.`)
    for (const update of updates) {
      if (!byColor.has(update.color)) {
        byColor.set(update.color, []);
      }
      byColor.get(update.color)!.push({row: update.row, col: update.col});
    }

    const colorKeys = Array.from(byColor.keys());
    Logger.log(`Colors to update: ${colorKeys}`)

    // Apply each color in batch
    for (const [color, cells] of byColor) {
      Logger.log(`Count of cells to update: ${cells.length}`);
      for (const cell of cells) {
        sheet.getRange(cell.row, cell.col).setBackground(color);
      }
    }
    Logger.log(`Flush spreadsheet to write updates.`);
    // Force changes to be written
    SpreadsheetApp.flush();
    Logger.log(`Background update complete.`);
  }
}

