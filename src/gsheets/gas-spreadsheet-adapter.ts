/**
 * Google Apps Script adapter implementing spreadsheet and UI ports.
 */

import { ISpreadsheet, IUI } from '../interfaces/spreadsheet';
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

    for (let rownum = 1; rownum <= transcriptRowCount; rownum++) {
      const transcriptEntryId = sheet.getRange(rownum, idColumnIndex).getValue();
      idMap.set(transcriptEntryId.toString(), rownum);
    }

    return idMap;
  }

  updateCellBackgrounds(updates: Array<{row: number, col: number, color: string}>): void {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Group updates by color to minimize API calls
    const byColor = new Map<string, Array<{row: number, col: number}>>();

    for (const update of updates) {
      if (!byColor.has(update.color)) {
        byColor.set(update.color, []);
      }
      byColor.get(update.color)!.push({row: update.row, col: update.col});
    }

    // Apply each color in batch
    for (const [color, cells] of byColor) {
      for (const cell of cells) {
        sheet.getRange(cell.row, cell.col).setBackground(color);
      }
    }

    // Force changes to be written
    SpreadsheetApp.flush();
  }
}

export class GASUIAdapter implements IUI {
  alert(message: string): void {
    SpreadsheetApp.getUi().alert(message);
  }

  showModalDialog(html: string, title: string): void {
    const htmlOutput = HtmlService.createHtmlOutput(html)
      .setWidth(400)
      .setHeight(300);
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, title);
  }

  evaluateTemplate(templateName: string, data: Record<string, string>): string {
    const template = HtmlService.createTemplateFromFile(templateName);

    // Assign all data properties to the template
    for (const key in data) {
      template[key] = data[key];
    }

    return template.evaluate().getContent();
  }
}
