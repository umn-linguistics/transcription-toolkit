import { validateGraphemes, validateIDs, validateMorphemeLabels } from "./gsheets-app";

// @ts-ignore - Called by Google Apps Script
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🧰 Transcript Tools')
      .addItem('Validate Characters', 'validateGraphemesMenuItem')
      .addItem('Validate IDs', 'validateIDsMenuItem')
      .addItem('Validate Morpheme Labels', 'validateMorphemeLabelsMenuItem')
      .addToUi();
}

function tryIt() {
    var ui = SpreadsheetApp.getUi(); // Get the UI object for the spreadsheet
    ui.alert('Hello, world');
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

// Make this file a module for TypeScript while keeping functions global for Apps Script
export {};