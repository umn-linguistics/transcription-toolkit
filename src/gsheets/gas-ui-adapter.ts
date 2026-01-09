import { IUI } from '../interfaces/spreadsheet';

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