/**
 * Interfaces defining spreadsheet operations needed by the application core.
 */

export interface ISpreadsheet {
  /**
   * Get the name of the currently active sheet
   */
  getActiveSheetName(): string;

  /**
   * Get the header row (first row) of the active sheet
   */
  getHeaders(): string[];

  /**
   * Get all data rows (excluding header row) from the active sheet
   */
  getRows(): any[][];

  /**
   * Get the header row (first row) for a specified worksheet
   */
  getWorksheetHeaders(worksheetName: string): string[];

  /**
   * Get all data rows (excluding header row) for a specified worksheet
   */
  getWorksheetRows(worksheetName: string): any[][];

  /**
   * Get the currently selected range of data
   */
  getSelectedData(headers: string[]): any[][];

  /**
   * Update a single cell value
   */
  updateCell(row: number, col: number, value: any): void;

  /**
   * Update a cell's background color
   */
  updateCellBackground(row: number, col: number, color: string): void;

  /**
   * Get all sheet names in the spreadsheet
   */
  getSheetNames(): string[];

  /**
   * Create a new sheet with specified name and headers
   */
  createSheet(name: string, headers: string[]): void;

  /**
   * Get the total number of rows in the active sheet
   */
  getLastRow(): number;

  /**
   * Build a map of ID values to row numbers for efficient lookups
   */
  buildIdToRowMap(headers: string[]): Map<string, number>;

  /**
   * Update multiple cells' background colors in batch
   * More efficient than updating one cell at a time
   */
  updateCellBackgrounds(updates: Array<{row: number, col: number, color: string}>): void;
}

/**
 * Port (interface) defining UI operations needed by the application core.
 */
export interface IUI {
  /**
   * Show an alert dialog to the user
   */
  alert(message: string): void;

  /**
   * Show a modal dialog with HTML content
   */
  showModalDialog(html: string, title: string): void;

  /**
   * Evaluate a template file with data
   */
  evaluateTemplate(templateName: string, data: Record<string, string>): string;
}
