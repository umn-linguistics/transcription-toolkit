
import { GASSpreadsheetAdapter } from "./gas-spreadsheet-adapter";
import { TranscriptSpreadsheet } from "../TranscriptSpreadsheet";

export function validateGraphemes(){
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