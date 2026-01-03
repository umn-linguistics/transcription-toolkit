/**
 * Transcription Toolkit Example
 *
 * This script demonstrates how to use the Transcript class from the transcription-toolkit
 * to work with linguistic field methods data.
 *
 * Prerequisites:
 * - Node.js (v12 or higher)
 * - npm packages installed (run `npm install` in project root)
 *
 * To run this example:
 *   npx ts-node examples/transcription-example.ts
 *
 * Or with tsx:
 *   npx tsx examples/transcription-example.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { Transcript } from '../src/Transcript';
import { Orthography } from '../src/Orthography';
import { Gloss } from '../src/Gloss';
import { Elan } from '../src/Elan';

// Simple CSV parser
function parseCSV(content: string): string[][] {
    const lines = content.split(/\r?\n|\r/);
    return lines.map(line => {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current);
        return values;
    }).filter(row => row.length > 1 && row[0] !== ''); // Filter empty rows
}

console.log('='.repeat(60));
console.log('Transcription Toolkit Example');
console.log('='.repeat(60));
console.log('');

// Load CSV data
const csvPath = path.join(__dirname, 'field-methods-data.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const data = parseCSV(csvContent);

const headers = data[0];
const dataRows = data.slice(1);

console.log(`Loaded ${dataRows.length} rows of data from field-methods-data.csv`);
console.log(`Headers: ${headers.join(', ')}`);
console.log('');

// ============================================================================
// 1. Creating and Loading a Transcript
// ============================================================================
console.log('1. CREATING AND LOADING A TRANSCRIPT');
console.log('-'.repeat(60));

const transcript = new Transcript(headers);
transcript.load(dataRows);

console.log(`✓ Transcript loaded with ${transcript.rows.length} rows`);
console.log('');
console.log('First 3 entries:');
transcript.rows.slice(0, 3).forEach(row => {
    console.log(`  ID: ${row.id}`);
    console.log(`    IPA: ${row.utterance}`);
    console.log(`    Gloss: ${row.utteranceGloss}`);
    console.log(`    Translation: ${row.freeTranslation}`);
    console.log('');
});

// ============================================================================
// 2. Generate Concordance
// ============================================================================
console.log('2. GENERATE CONCORDANCE');
console.log('-'.repeat(60));

const concordance = transcript.concordance();
console.log(`✓ Total words in concordance: ${concordance.length}`);
console.log('');
console.log('First 10 concordance entries:');
concordance.slice(0, 10).forEach(entry => {
    console.log(`  ID ${entry.id}, Word ${entry.wordIndex}: "${entry.word}" → "${entry.wordGloss}"`);
});

const uniqueWords = new Set(concordance.map(entry => entry.word));
console.log('');
console.log(`✓ Total unique words: ${uniqueWords.size}`);
console.log('');

// ============================================================================
// 3. Validate IDs
// ============================================================================
console.log('3. VALIDATE IDS');
console.log('-'.repeat(60));

const idValidation = transcript.validateIds();
console.log(`Missing IDs (row numbers): ${idValidation.missingIds.length === 0 ? 'None' : idValidation.missingIds.join(', ')}`);
console.log(`Duplicate IDs: ${idValidation.duplicateRowNumbers.length === 0 ? 'None' : idValidation.duplicateRowNumbers.join(', ')}`);

if (idValidation.missingIds.length > 0) {
    console.log('');
    console.log('Rows with missing IDs:');
    idValidation.missingIds.forEach(rowNum => {
        const row = transcript.rows[rowNum - 1];
        console.log(`  Row ${rowNum}: "${row.utterance}"`);
    });
}

if (idValidation.duplicateRowNumbers.length > 0) {
    console.log('');
    console.log('Duplicate IDs found:');
    idValidation.duplicateRowNumbers.forEach(id => {
        console.log(`  ID "${id}" appears multiple times`);
    });
}
console.log('');

// ============================================================================
// 4. Validate Glosses
// ============================================================================
console.log('4. VALIDATE GLOSSES');
console.log('-'.repeat(60));

const misalignedGlosses = transcript.validateGlosses();
console.log(`✓ Misaligned glosses: ${misalignedGlosses.length === 0 ? 'None found!' : misalignedGlosses.length}`);

if (misalignedGlosses.length > 0) {
    console.log('');
    console.log('First 5 misaligned entries:');
    misalignedGlosses.slice(0, 5).forEach(id => {
        const row = transcript.rows.find(r => r.id === id);
        if (row) {
            const wordCount = row.utterance.split(' ').filter(w => w).length;
            const glossCount = row.utteranceGloss.split(' ').filter(w => w).length;
            console.log(`  ID ${id}:`);
            console.log(`    IPA (${wordCount} words): ${row.utterance}`);
            console.log(`    Gloss (${glossCount} words): ${row.utteranceGloss}`);
        }
    });
}
console.log('');

// ============================================================================
// 5. Validate Graphemes
// ============================================================================
console.log('5. VALIDATE GRAPHEMES');
console.log('-'.repeat(60));

const orthography = new Orthography(['character']);

// Define common graphemes (sample - add more as needed)
const graphemeData = [
    ['a'], ['b'], ['d'], ['e'], ['f'], ['g'], ['h'], ['i'], ['j'], ['k'],
    ['l'], ['m'], ['n'], ['o'], ['p'], ['r'], ['s'], ['t'], ['u'], ['v'],
    ['w'], ['x'], ['y'], ['z'],
    ['ə'], ['ɛ'], ['ɪ'], ['ɾ'], ['ɲ'], ['ʃ'], ['ʌ'], ['ˈ'], ['ˌ'],
    ['ʰ'], ['ʧ'], ['ʤ'], [' '], ['-'], ['('], [')'], ['ʔ']
];

orthography.load(graphemeData);

const invalidTranscriptions = transcript.validateGraphemes(orthography.profile);
console.log(`✓ Invalid transcriptions found: ${invalidTranscriptions.length}`);

if (invalidTranscriptions.length > 0) {
    console.log('');
    console.log('First 10 invalid transcriptions (� marks invalid characters):');
    invalidTranscriptions.slice(0, 10).forEach(item => {
        console.log(`  ID ${item.id}: ${item.text}`);
    });
}
console.log('');

// ============================================================================
// 6. Validate Morpheme Labels
// ============================================================================
console.log('6. VALIDATE MORPHEME LABELS');
console.log('-'.repeat(60));

const glossList = new Gloss(['gloss_abbreviation']);

// Define common morpheme labels (sample)
const morphemeData = [
    ['1PL'], ['2F'], ['2M'], ['2PL'], ['3F'], ['3M'], ['3PL'],
    ['POSS'], ['PRO'], ['GEN'], ['PL'], ['your'], ['my'], ['our'],
    ['mother'], ['father'], ['your/my'], ['the'], ['new'], ['year'],
    ['first.month'], ['second.month'], ['third.month']
];

glossList.load(morphemeData);

const invalidGlosses = transcript.validateMorphemeLabels(glossList);
console.log(`✓ Invalid glosses found: ${invalidGlosses.length}`);

if (invalidGlosses.length > 0) {
    console.log('');
    console.log('First 10 entries with invalid glosses (� marks invalid labels):');
    invalidGlosses.slice(0, 10).forEach(item => {
        console.log(`  ID ${item.id}: ${item.text}`);
    });
}
console.log('');

// ============================================================================
// 7. Generate Gloss Text
// ============================================================================
console.log('7. GENERATE GLOSS TEXT');
console.log('-'.repeat(60));

const limitedTranscript = new Transcript(headers);
limitedTranscript.load(dataRows.slice(0, 5));

const glossText = limitedTranscript.generateGlossText();
console.log('Aligned Gloss Text (first 5 entries):');
console.log('');
console.log(glossText);

// ============================================================================
// 8. Generate HTML Output
// ============================================================================
console.log('8. GENERATE HTML OUTPUT');
console.log('-'.repeat(60));

const htmlTranscript = new Transcript(headers);
htmlTranscript.load(dataRows.slice(0, 3));

const glossHtml = htmlTranscript.generateGlossHtml();

const htmlDocument = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Interlinear Glosses</title>
    <style>
        .interlinear { margin-bottom: 20px; }
        .utterance { font-weight: bold; margin-bottom: 5px; }
        .intlin { display: inline-block; margin-right: 10px; vertical-align: top; }
        .orig { display: block; font-style: italic; }
        .morph { display: block; font-size: 0.9em; }
        .freetrans { margin-top: 5px; color: #333; }
    </style>
</head>
<body>
${glossHtml}
</body>
</html>`;

const htmlPath = path.join(__dirname, 'gloss-output.html');
fs.writeFileSync(htmlPath, htmlDocument);
console.log(`✓ HTML file saved to: ${htmlPath}`);
console.log('');

// ============================================================================
// 9. Generate LaTeX Document
// ============================================================================
console.log('9. GENERATE LATEX DOCUMENT');
console.log('-'.repeat(60));

const latexTranscript = new Transcript(headers);
latexTranscript.load(dataRows.slice(0, 5));

const latexDoc = latexTranscript.generateLatexDocument();

const latexPath = path.join(__dirname, 'glosses.tex');
fs.writeFileSync(latexPath, latexDoc);
console.log(`✓ LaTeX file saved to: ${latexPath}`);
console.log('  To compile: xelatex glosses.tex');
console.log('');

// ============================================================================
// 10. Export as CSV
// ============================================================================
console.log('10. EXPORT AS CSV');
console.log('-'.repeat(60));

const csvOutput = transcript.unparseAsCsv();
const exportPath = path.join(__dirname, 'transcript-export.csv');
fs.writeFileSync(exportPath, csvOutput);
console.log(`✓ CSV file saved to: ${exportPath}`);
console.log('');

// ============================================================================
// 11. Split by Speaker
// ============================================================================
console.log('11. SPLIT BY SPEAKER');
console.log('-'.repeat(60));

const speakerTranscripts = transcript.bySpeaker();
console.log(`✓ Total speaker groups: ${speakerTranscripts.length}`);
console.log('');

speakerTranscripts.forEach(st => {
    console.log(`Speaker: ${st.speaker}`);
    console.log(`  Number of entries: ${st.rows.length}`);
    console.log(`  First entry ID: ${st.rows[0]?.id || 'N/A'}`);
    console.log('');
});

// Export each speaker to separate CSV
speakerTranscripts.forEach(st => {
    const speakerCsv = st.unparseAsCsv();
    const fileName = path.join(__dirname, `transcript-${st.speaker.toLowerCase().replace(/\s+/g, '-')}.csv`);
    fs.writeFileSync(fileName, speakerCsv);
    console.log(`  ✓ Saved ${st.speaker}'s data to: ${fileName}`);
});
console.log('');

// ============================================================================
// 12. Load ELAN Timing Data
// ============================================================================
console.log('12. LOAD ELAN TIMING DATA');
console.log('-'.repeat(60));

const elan = new Elan('id');

// Sample ELAN export format
const elanData = [
    ['id', 'Begin Time - ss.msec', 'End Time - ss.msec', 'Duration - ss.msec'],
    ['1', '0.000', '2.500', '2.500'],
    ['2', '2.500', '5.000', '2.500'],
    ['3', '5.000', '7.800', '2.800'],
    ['4', '7.800', '10.200', '2.400'],
    ['5', '10.200', '13.000', '2.800']
];

elan.load(elanData);

const elanTestTranscript = new Transcript(headers);
elanTestTranscript.load(dataRows.slice(0, 10));

console.log('Before loading ELAN data:');
console.log(`  Entry 1 - Begin: ${elanTestTranscript.rows[0].beginTime || 'undefined'}`);
console.log(`  Entry 1 - End: ${elanTestTranscript.rows[0].endTime || 'undefined'}`);
console.log('');

const updatedRows = elanTestTranscript.loadElan(elan);

console.log('After loading ELAN data:');
console.log(`✓ Updated ${updatedRows.length} rows with timing data`);
console.log('');

updatedRows.forEach(row => {
    console.log(`ID ${row.id}:`);
    console.log(`  Begin Time: ${row.beginTime}`);
    console.log(`  End Time: ${row.endTime}`);
    console.log(`  Duration: ${row.duration}`);
    console.log('');
});

// ============================================================================
// 13. Complete Workflow Example
// ============================================================================
console.log('13. COMPLETE WORKFLOW EXAMPLE');
console.log('-'.repeat(60));

console.log('=== COMPLETE WORKFLOW ===');
console.log('');

// 1. Load transcript
const workflowTranscript = new Transcript(headers);
workflowTranscript.load(dataRows);
console.log(`✓ Loaded ${workflowTranscript.rows.length} entries`);

// 2. Validate IDs
const idCheck = workflowTranscript.validateIds();
console.log(`✓ ID Validation: ${idCheck.missingIds.length} missing, ${idCheck.duplicateRowNumbers.length} duplicates`);

// 3. Validate glosses
const glossCheck = workflowTranscript.validateGlosses();
console.log(`✓ Gloss Alignment: ${glossCheck.length} misaligned entries`);

// 4. Generate concordance
const wordList = workflowTranscript.concordance();
console.log(`✓ Generated concordance: ${wordList.length} words`);

// 5. Split by speaker
const bySpkr = workflowTranscript.bySpeaker();
console.log(`✓ Split by speaker: ${bySpkr.length} groups`);

// 6. Generate outputs
const textGloss = workflowTranscript.generateGlossText();
const htmlGloss = workflowTranscript.generateGlossHtml();
const latexGloss = workflowTranscript.generateLatexDocument();
console.log(`✓ Generated text, HTML, and LaTeX outputs`);

// 7. Export as CSV
const exportCsv = workflowTranscript.unparseAsCsv();
const workflowPath = path.join(__dirname, 'workflow-export.csv');
fs.writeFileSync(workflowPath, exportCsv);
console.log(`✓ Exported to: ${workflowPath}`);

console.log('');
console.log('=== WORKFLOW COMPLETE ===');
console.log('');

// ============================================================================
// Summary
// ============================================================================
console.log('='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));
console.log('');
console.log('This example demonstrated all public methods of the Transcript class:');
console.log('');
console.log('  1.  concordance() - Create word-level concordance');
console.log('  2.  validateIds() - Check for missing or duplicate IDs');
console.log('  3.  validateGlosses() - Verify gloss alignment');
console.log('  4.  validateGraphemes() - Check character inventory');
console.log('  5.  validateMorphemeLabels() - Verify morpheme glosses');
console.log('  6.  generateGlossText() - Create aligned text output');
console.log('  7.  generateGlossHtml() - Create HTML interlinear glosses');
console.log('  8.  generateLatexDocument() - Create LaTeX document');
console.log('  9.  unparseAsCsv() - Export as CSV');
console.log('  10. bySpeaker() - Split by speaker');
console.log('  11. loadElan() - Integrate ELAN timing data');
console.log('');
console.log('Generated files in examples/:');
console.log('  - gloss-output.html');
console.log('  - glosses.tex');
console.log('  - transcript-export.csv');
console.log('  - transcript-{speaker}.csv (one per speaker)');
console.log('  - workflow-export.csv');
console.log('');
console.log('Next steps:');
console.log('  - Customize the orthography profile with your language\'s graphemes');
console.log('  - Define your morpheme gloss abbreviations');
console.log('  - Process ELAN exports to add timing data');
console.log('  - Generate publication-ready outputs in your preferred format');
console.log('');
console.log('='.repeat(60));
