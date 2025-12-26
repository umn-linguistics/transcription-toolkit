
import { GASSpreadsheetAdapter } from "./gas-spreadsheet-adapter";
import { TranscriptSpreadsheet } from "../TranscriptSpreadsheet";

export function validateGraphemes(){
  // Create adapter
  const spreadsheetAdapter = new GASSpreadsheetAdapter();
  const transcriptSpreadsheet = new TranscriptSpreadsheet(spreadsheetAdapter);
  
  const transcript = transcriptSpreadsheet.getTranscriptData();
  const orthography = transcriptSpreadsheet.getGraphemeData();

  const invalidTranscriptions = transcript.validateGraphemes(orthography.profile);

  // Update spreadsheet with validation results
  transcriptSpreadsheet.updateTranscriptWithGraphemeValidations(invalidTranscriptions, transcript.headers);

//   // Use custom HTML dialog for better display of multiple IDs
//   const template = HtmlService.createTemplateFromFile('validation-results-template');
//   template.count = invalidTranscriptions.length;
//   template.validationType = "character";
//   template.ids = invalidTranscriptions.map(r => `ID "${r.id}: ${r.text}`);
//   const html = template.evaluate()
//     .setWidth(500)
//     .setHeight(invalidTranscriptions.length === 0 ? 150 : 400);
//   SpreadsheetApp.getUi().showModalDialog(html, 'Grapheme Validation Results');
}