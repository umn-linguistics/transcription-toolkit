import { validateGraphemes } from "./gsheets-app";

// @ts-ignore - Called by Google Apps Script
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🧰 Transcript Tools')
      .addItem('TryIt', 'tryIt')
      .addItem('Validate Characters', 'validateGraphemes')
      .addToUi();
}

function tryIt() {
    var ui = SpreadsheetApp.getUi(); // Get the UI object for the spreadsheet
    ui.alert('Hello, world');
}

function validateGraphemesMenuItem() {
    validateGraphemes();
}

// Make this file a module for TypeScript while keeping functions global for Apps Script
export {};