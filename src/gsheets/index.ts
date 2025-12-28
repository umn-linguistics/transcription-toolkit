import { 
    clearValidations, 
    createNewWorksheet, 
    generateWordList, 
    validateGlossAlignment, 
    validateGraphemes, 
    validateIDs, 
    validateMorphemeLabels,
    showSelectedGlosses,
    exportLatex,
    exportText,
    exportCsv,
    showElanFilePicker,
    processElanFiles,
    getDriveFiles,
    exportCsvBySpeaker
 } from "./gsheets-app";

// @ts-ignore - Called by Google Apps Script
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🧰 Transcript Tools')
      .addItem('Show glosses for selected rows', 'showSelectedGlossesMenuItem')
      .addSubMenu(ui.createMenu('Setup')
        .addItem('Create New Worksheet', 'createNewWorksheet'))
      .addSubMenu(ui.createMenu('Generate')
        .addItem('Generate Word List', 'generateWordListMenuItem'))
      .addSubMenu(ui.createMenu('Validate')
        .addItem('Validate Characters', 'validateGraphemesMenuItem')
        .addItem('Validate IDs', 'validateIDsMenuItem')
        .addItem('Validate Gloss Labels', 'validateMorphemeLabelsMenuItem')
        .addItem('Validate Gloss Alignment', 'validateGlossAlignmentMenuItem')
        .addItem('Clear Validation Results', 'clearValidationResultsMenuItem'))
      .addSubMenu(ui.createMenu('Import')
        .addItem('Import from Elan', 'showElanFilePickerMenuItem'))
      .addSubMenu(ui.createMenu('Export')
        .addItem('Export as LaTeX', 'exportLatexMenuItem')
        .addItem('Export as TXT', 'exportTextMenuItem')
        .addItem('Export as CSV', 'exportCsvMenuItem')
        .addItem('Export as CSV by speaker', 'exportElanCsvBySpeakerMenuItem'))
      .addToUi();
}

function tryIt() {
    var ui = SpreadsheetApp.getUi(); // Get the UI object for the spreadsheet
    ui.alert('Hello, world');
}

function createNewWorksheetMenuItem() {
    createNewWorksheet();
}

function generateWordListMenuItem() {
    generateWordList();
}

function validateGraphemesMenuItem() {
    validateGraphemes();
}

function validateIDsMenuItem() {
    validateIDs();
}

function validateMorphemeLabelsMenuItem() {
    validateMorphemeLabels();
}

function validateGlossAlignmentMenuItem() {
    validateGlossAlignment();
}

function clearValidationResultsMenuItem() {
    clearValidations();
}

function showSelectedGlossesMenuItem() {
    showSelectedGlosses();
}

function exportLatexMenuItem() {
    exportLatex();
}

function exportTextMenuItem() {
    exportText();
}

function exportCsvMenuItem() {
    exportCsv();
}

function showElanFilePickerMenuItem() {
  showElanFilePicker();
}

function processElanFilesTemplateCall(selectedFileIds: string[], elanIdTierName: string): string {
  return processElanFiles(selectedFileIds, elanIdTierName);
}

function getDriveFilesTemplateCall() {
  return getDriveFiles();
}

function exportElanCsvBySpeakerMenuItem() {
  exportCsvBySpeaker();
}

// Make this file a module for TypeScript while keeping functions global for Apps Script
export {};