
import { GASSpreadsheetAdapter } from "./gas-spreadsheet-adapter";
import { TranscriptSpreadsheet } from "../TranscriptSpreadsheet";
import { ConcordanceRow } from "../types";
import { GASStorageAdapter } from "./gas-storage-adapter";
import { TranscriptStorage } from "../TranscriptStorage";

/*
*   Spreadsheet setup
*/
export function createNewWorksheet() {
  const spreadsheetAdapter = new GASSpreadsheetAdapter();
  const transcriptSpreadsheet = new TranscriptSpreadsheet(spreadsheetAdapter);
  const transcript = transcriptSpreadsheet.getTranscriptData();

  // Create the worksheet
  const sheetName = transcriptSpreadsheet.createTranscriptSheet(transcript.headers);

  // Show success message
  SpreadsheetApp.getUi()
    .alert(`Created new worksheet: ${sheetName}`);
}

export function generateWordList() {
  // Fetch data
  const spreadsheetAdapter = new GASSpreadsheetAdapter();
  const transcriptSpreadsheet = new TranscriptSpreadsheet(spreadsheetAdapter);
  const storageAdapter = new GASStorageAdapter();
  const transcriptStorage = new TranscriptStorage(storageAdapter);
  
  // Build concordance
  const transcript = transcriptSpreadsheet.getTranscriptData();
  const concordanceData = transcript.concordance();
  
  // Write concordance to the word list spreadsheet
  const sheetName = spreadsheetAdapter.getActiveSheetName();
  const folderId = storageAdapter.getCurrentFolderId();
  const fileName = `word-list-${sheetName}`;
  
  transcriptStorage.createWordListSpreadsheet(concordanceData, folderId, fileName);

  SpreadsheetApp.getUi()
    .alert('Done!');
}

export function validateGraphemes() {
  // Fetch data
  const spreadsheetAdapter = new GASSpreadsheetAdapter();
  const transcriptSpreadsheet = new TranscriptSpreadsheet(spreadsheetAdapter);
  const transcript = transcriptSpreadsheet.getTranscriptData();
  const orthography = transcriptSpreadsheet.getGraphemeData();

  // Validate graphemes
  const invalidTranscriptions = transcript.validateGraphemes(orthography.profile);
  
  // Update spreadsheet with validation results
  transcriptSpreadsheet.updateTranscriptWithGraphemeValidations(invalidTranscriptions, transcript.headers);

  // Display results in html
  const template = HtmlService.createTemplateFromFile('validation-results-template');
  template.count = invalidTranscriptions.length;
  template.validationType = "character";
  template.ids = invalidTranscriptions.map(r => `ID ${r.id}: ${r.text}`);
  Logger.log(`creating html template for displaying validation results...`);
  const html = template.evaluate()
    .setWidth(500)
    .setHeight(invalidTranscriptions.length === 0 ? 150 : 400);
  SpreadsheetApp.getUi().showModalDialog(html, 'Grapheme Validation Results');
}

export function validateIDs(){
  // Fetch data
  const spreadsheetAdapter = new GASSpreadsheetAdapter();
  const transcriptSpreadsheet = new TranscriptSpreadsheet(spreadsheetAdapter);
  const transcript = transcriptSpreadsheet.getTranscriptData();

  const { missingIds, duplicateRowNumbers } = transcript.validateIds();

  // Update spreadsheet with validation results (highlight duplicates in red)
  transcriptSpreadsheet.updateTranscriptWithIdValidations(duplicateRowNumbers, transcript.headers);

  // Build list of issues for display
  const issues: string[] = [];

  if (missingIds.length > 0) {
    issues.push(...missingIds.map(row => `Row ${row}: Missing ID`));
  }

  if (duplicateRowNumbers.length > 0) {
    issues.push(...duplicateRowNumbers.map(id => `ID "${id}": Duplicate`));
  }

  // Use custom HTML dialog for better display
  const template = HtmlService.createTemplateFromFile('validation-results-template');
  template.count = issues.length;
  template.validationType = "ID";
  template.ids = issues;
  const html = template.evaluate()
    .setWidth(500)
    .setHeight(issues.length === 0 ? 150 : 400);
  SpreadsheetApp.getUi().showModalDialog(html, 'ID Validation Results');
}

export function validateMorphemeLabels(){
  // Fetch data
  const spreadsheetAdapter = new GASSpreadsheetAdapter();
  const transcriptSpreadsheet = new TranscriptSpreadsheet(spreadsheetAdapter);
  const transcript = transcriptSpreadsheet.getTranscriptData();
  const morphemes = transcriptSpreadsheet.getMorphemeData();

  const invalidTranscriptions = transcript.validateMorphemeLabels(morphemes);

  Logger.log(invalidTranscriptions);
  // Update spreadsheet with validation results
  transcriptSpreadsheet.updateTranscriptWithMorphemeValidations(invalidTranscriptions, transcript.headers);

  // Use custom HTML dialog for better display of multiple IDs
  const template = HtmlService.createTemplateFromFile('validation-results-template');
  template.count = invalidTranscriptions.length;
  template.validationType = "gloss abbreviation";
  //template.ids = invalidTranscriptions.map(r => r.id);
  template.ids = invalidTranscriptions.map(r => `ID "${r.id}: ${r.text}`);
  const html = template.evaluate()
    .setWidth(500)
    .setHeight(invalidTranscriptions.length === 0 ? 150 : 400);
  SpreadsheetApp.getUi().showModalDialog(html, 'Morpheme Validation Results');
}

export function validateGlossAlignment() {
  // Fetch data
  const spreadsheetAdapter = new GASSpreadsheetAdapter();
  const transcriptSpreadsheet = new TranscriptSpreadsheet(spreadsheetAdapter);
  const transcript = transcriptSpreadsheet.getTranscriptData();

  const misalignedRows = transcript.validateGlosses();

  // Update spreadsheet with validation results
  transcriptSpreadsheet.updateTranscriptWithGlossAlignmentValidations(misalignedRows, transcript.headers);

  // Use custom HTML dialog for better display of multiple IDs
  const template = HtmlService.createTemplateFromFile('validation-results-template');
  template.count = misalignedRows.length;
  template.validationType = "gloss alignment";
  template.ids = misalignedRows;
  const html = template.evaluate()
    .setWidth(500)
    .setHeight(misalignedRows.length === 0 ? 150 : 400);
  SpreadsheetApp.getUi().showModalDialog(html, 'Gloss Validation Results');
}

export function clearValidations() {
  // Fetch data
  const spreadsheetAdapter = new GASSpreadsheetAdapter();
  const transcriptSpreadsheet = new TranscriptSpreadsheet(spreadsheetAdapter);
  const transcript = transcriptSpreadsheet.getTranscriptData();

  // Reset fill color for all cells to white
  transcriptSpreadsheet.setAllRowsToWhite(transcript.headers);
}