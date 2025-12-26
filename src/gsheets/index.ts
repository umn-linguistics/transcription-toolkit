import { clearValidations, createNewWorksheet, validateGlossAlignment, validateGraphemes, validateIDs, validateMorphemeLabels } from "./gsheets-app";

// @ts-ignore - Called by Google Apps Script
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🧰 Transcript Tools')
      .addItem('Create New Worksheet', 'createNewWorksheet')
      .addSeparator()
      .addSubMenu(ui.createMenu('Validate')
        .addItem('Validate Characters', 'validateGraphemesMenuItem')
        .addItem('Validate IDs', 'validateIDsMenuItem')
        .addItem('Validate Gloss Labels', 'validateMorphemeLabelsMenuItem')
        .addItem('Validate Gloss Alignment', 'validateGlossAlignmentMenuItem')
        .addItem('Clear Validation Results', 'clearValidationResultsMenuItem'))
      .addToUi();
}

function tryIt() {
    var ui = SpreadsheetApp.getUi(); // Get the UI object for the spreadsheet
    ui.alert('Hello, world');
}

function createNewWorksheetMenuItem() {
    createNewWorksheet();
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

// Make this file a module for TypeScript while keeping functions global for Apps Script
export {};