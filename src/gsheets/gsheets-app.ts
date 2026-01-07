
import { GASSpreadsheetAdapter } from "./gas-spreadsheet-adapter";
import { TranscriptSpreadsheet } from "../TranscriptSpreadsheet";
import { ConcordanceRow, GraphemeColumns, MorphemeColumns } from "../types";
import { GASStorageAdapter } from "./gas-storage-adapter";
import { GASUIAdapter } from "./gas-ui-adapter";
import { TranscriptStorage } from "../TranscriptStorage";
import { Elan } from "../Elan";
import { TranscriptColumns } from "../types";
import { SHEET_NAMES } from "../interfaces/constants";

/*
*   Spreadsheet setup
*/
export function createNewWorksheet() {
  const spreadsheetAdapter = new GASSpreadsheetAdapter();
  const transcriptSpreadsheet = new TranscriptSpreadsheet(spreadsheetAdapter);
  //const transcript = transcriptSpreadsheet.getTranscriptData();

  const defaultHeaders = Object.values(TranscriptColumns);

  // Create the worksheet
  const sheetName = transcriptSpreadsheet.createTranscriptSheet(defaultHeaders);

  // Show success message
  SpreadsheetApp.getUi()
    .alert(`Created new worksheet: ${sheetName}`);
}

export function createGlossAbbrevationsSheet() {
  const spreadsheetAdapter = new GASSpreadsheetAdapter();
  const transcriptSpreadsheet = new TranscriptSpreadsheet(spreadsheetAdapter);

  const defaultHeaders = Object.values(MorphemeColumns);

  // Create the worksheet
  const sheetName = transcriptSpreadsheet.createSettingsSheet(defaultHeaders, SHEET_NAMES.MORPHEME_TAGS);

  // Show success message
  SpreadsheetApp.getUi()
    .alert(`Created new worksheet: ${sheetName}`);
}

export function createCharactersSheet() {
  const spreadsheetAdapter = new GASSpreadsheetAdapter();
  const transcriptSpreadsheet = new TranscriptSpreadsheet(spreadsheetAdapter);

  const defaultHeaders = Object.values(GraphemeColumns);

  // Create the worksheet
  const sheetName = transcriptSpreadsheet.createSettingsSheet(defaultHeaders, SHEET_NAMES.GRAPHEME_PROFILE);

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
    .alert(`Done! Saved as ${fileName} in Google Drive.`);
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

export function showSelectedGlosses() {
  const spreadsheetAdapter = new GASSpreadsheetAdapter();
  const uiAdapter = new GASUIAdapter();

  const transcriptSpreadsheet = new TranscriptSpreadsheet(spreadsheetAdapter);
  const transcript = transcriptSpreadsheet.getSelectedTranscriptData();

  const glosses = transcript.generateGlossHtml();

  // Evaluate template
  const glossTemplate = uiAdapter.evaluateTemplate('gloss-template', { CONTENT: glosses });
  const html = HtmlService.createHtmlOutput(glossTemplate);

  SpreadsheetApp.getUi().showModelessDialog(html, 'Selected Glosses');
}

export function exportLatex() {
  // Fetch data
  const spreadsheetAdapter = new GASSpreadsheetAdapter();
  const transcriptSpreadsheet = new TranscriptSpreadsheet(spreadsheetAdapter);
  const storageAdapter = new GASStorageAdapter();
  //const transcriptStorage = new TranscriptStorage(storageAdapter);

  // Generate LaTex 
  const transcript = transcriptSpreadsheet.getTranscriptData();
  const latex = transcript.generateLatexDocument();
`
  // Save file`
  const sheetName = spreadsheetAdapter.getActiveSheetName();
  const fileName = `transcript-${sheetName}.tex`;
  const folderId = storageAdapter.getCurrentFolderId();

  const file = storageAdapter.getOrCreateFile(folderId, fileName, 'text/plain');
  file.setContent(latex);

  SpreadsheetApp.getUi()
    .alert(`Done! Saved as ${fileName} in Google Drive.`);
}

export function exportText() {
  // Fetch data
  const spreadsheetAdapter = new GASSpreadsheetAdapter();
  const transcriptSpreadsheet = new TranscriptSpreadsheet(spreadsheetAdapter);
  const storageAdapter = new GASStorageAdapter();

  // Generate text 
  const transcript = transcriptSpreadsheet.getTranscriptData();
  const text = transcript.generateGlossText();

  // Save file
  const sheetName = spreadsheetAdapter.getActiveSheetName();
  const fileName = `transcript-${sheetName}.txt`;
  const folderId = storageAdapter.getCurrentFolderId();

  const file = storageAdapter.getOrCreateFile(folderId, fileName, 'text/plain');
  file.setContent(text);

  SpreadsheetApp.getUi()
    .alert(`Done! Saved as ${fileName} in Google Drive.`);
}

export function exportCsv() {
  // Fetch data
  const spreadsheetAdapter = new GASSpreadsheetAdapter();
  const transcriptSpreadsheet = new TranscriptSpreadsheet(spreadsheetAdapter);
  const storageAdapter = new GASStorageAdapter();

  // Generate csv 
  const transcript = transcriptSpreadsheet.getTranscriptData();
  const csvContent = transcript.unparseAsCsv();

  // Save file
  const sheetName = spreadsheetAdapter.getActiveSheetName();
  const fileName = `transcript-${sheetName}.csv`;
  const folderId = storageAdapter.getCurrentFolderId();

  const file = storageAdapter.getOrCreateFile(folderId, fileName, 'text/csv');
  file.setContent(csvContent);

  SpreadsheetApp.getUi()
    .alert(`Done! Saved as ${fileName} in Google Drive.`);
}

export function showElanFilePicker() {
  // Create UI adapter
  const uiAdapter = new GASUIAdapter();

  // Show the file picker dialog
  const htmlOutput = HtmlService.createHtmlOutputFromFile('elan-file-picker')
    .setWidth(400)
    .setHeight(300);

  uiAdapter.showModalDialog(htmlOutput.getContent(), 'Select Files');
}

export function processElanFiles(selectedFileIds: string[], elanIdTierName: string): string {
  // Validate input
  if (!elanIdTierName || elanIdTierName === '') {
    return 'First enter the name of the ID tier in ELAN';
  }

  // Fetch data
  const spreadsheetAdapter = new GASSpreadsheetAdapter();
  const transcriptSpreadsheet = new TranscriptSpreadsheet(spreadsheetAdapter);
  const storageAdapter = new GASStorageAdapter();
  const transcript = transcriptSpreadsheet.getTranscriptData();

  // Process each file
  let fileCount = 0;
  let rowCount = 0;
  selectedFileIds.forEach(fileId => {
    fileCount++;

    const file = storageAdapter.getFileById(fileId);
    Logger.log(`file = ${file}`);
    // Parse CSV using storage adapter
    const fileData = storageAdapter.parseCsv(file, '\t');
    Logger.log(`fileData = ${fileData}`);
    Logger.log(`fileData.length = ${fileData.length}`);
    const elan = new Elan(elanIdTierName);
    elan.load(fileData);
    Logger.log(`elan.rows.length = ${elan.rows.length}`);
    Logger.log(`elan.rows = ${elan.rows}`);
    for (let row of elan.rows){
      Logger.log(`elan row id = ${row.id}`);
    }
    for (let row of transcript.rows){
      Logger.log(`transcript row id = ${row.id}`);
    }
    const elanUpdates = transcript.loadElan(elan);
    Logger.log(`elanIdTierName = ${elanIdTierName}`);
    Logger.log(`gsheets-app.elanUpdates = ${elanUpdates}`);
    rowCount += elanUpdates.length;
    Logger.log(`gsheets-app.rowCount = ${rowCount}`);
    transcriptSpreadsheet.updateWithElanData(elanUpdates, transcript);
  });

  // return `Processed ${fileCount} file(s).`;
  return `Found ${rowCount} ELAN rows to update from ${fileCount} file${rowCount > 1 ? 's' : ''}.`
}

export function getDriveFiles() {
  const storageAdapter = new GASStorageAdapter();
  const folderId = storageAdapter.getCurrentFolderId();
  return storageAdapter.listFiles(folderId);
}

export function exportCsvBySpeaker() {
  // Fetch data
  const spreadsheetAdapter = new GASSpreadsheetAdapter();
  const transcriptSpreadsheet = new TranscriptSpreadsheet(spreadsheetAdapter);
  const storageAdapter = new GASStorageAdapter();
  const transcript = transcriptSpreadsheet.getTranscriptData();

  // Get transcripts by speaker
  const speakerTranscripts = transcript.bySpeaker();
  const sheetName = spreadsheetAdapter.getActiveSheetName();
  let fileCount = 0;

  // Save each transcript as a csv file
  for (let speakerTranscript of speakerTranscripts) {
    const csvContent = speakerTranscript.unparseAsCsv();
    const fileName = `transcript-${sheetName}-speaker-${speakerTranscript.speaker}.csv`;
    const folderId = storageAdapter.getCurrentFolderId();
    const file = storageAdapter.getOrCreateFile(folderId, fileName, 'text/csv');
    file.setContent(csvContent);
    fileCount += 1;
  }

  SpreadsheetApp.getUi()
    .alert(`Done! Saved ${fileCount} speaker file${fileCount > 1 ? 's' : ''} to Google Drive.`);
}