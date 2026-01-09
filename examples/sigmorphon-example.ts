/**
 * Fetch Gitksan Data from SIGMORPHON 2023 Glossing Shared Task
 *
 * This script fetches Gitksan language data from the SIGMORPHON 2023 repository
 * and converts it to the Transcript format used by this toolkit.
 *
 * Data source: https://github.com/sigmorphon/2023glossingST
 * File: data/Gitksan/git-dev-track1-uncovered
 *
 * Format:
 * - Lines beginning with \t contain the transcription (IPA/orthographic)
 * - Lines beginning with \g contain the morpheme-by-morpheme gloss
 * - Lines beginning with \l contain the free translation
 *
 * Prerequisites:
 * - Node.js with https support
 * - npm packages installed
 *
 * To run:
 *   npx ts-node examples/fetch-gitksan-data.ts
 *   or
 *   npx tsx examples/fetch-gitksan-data.ts
 */

import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { Transcript } from '../src/Transcript';

// GitHub raw content URL for the Gitksan data
const GITKSAN_DATA_URL = 'https://raw.githubusercontent.com/sigmorphon/2023glossingST/main/data/Gitksan/git-dev-track1-uncovered';

interface GlossEntry {
    transcription: string;
    gloss: string;
    translation: string;
}

/**
 * Fetch content from a URL using https
 */
function fetchUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(data);
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Parse the Gitksan gloss format into structured entries
 *
 * Format:
 * \t <transcription>
 * \g <gloss>
 * \l <translation>
 *
 * Each entry is a set of 3 lines (plus optional blank lines between entries)
 */
function parseGitksan(content: string): GlossEntry[] {
    const lines = content.split(/\r?\n|\r/);
    const entries: GlossEntry[] = [];

    let currentEntry: Partial<GlossEntry> = {};

    for (const line of lines) {
        const trimmedLine = line.trim();

        // Skip empty lines
        if (!trimmedLine) {
            continue;
        }

        // Parse transcription line
        if (trimmedLine.startsWith('\\t ')) {
            // If we have a pending entry, save it
            if (currentEntry.transcription || currentEntry.gloss || currentEntry.translation) {
                if (currentEntry.transcription && currentEntry.gloss && currentEntry.translation) {
                    entries.push(currentEntry as GlossEntry);
                }
                currentEntry = {};
            }
            currentEntry.transcription = trimmedLine.substring(3).trim();
        }
        // Parse gloss line
        else if (trimmedLine.startsWith('\\g ')) {
            currentEntry.gloss = trimmedLine.substring(3).trim();
        }
        // Parse translation line
        else if (trimmedLine.startsWith('\\l ')) {
            currentEntry.translation = trimmedLine.substring(3).trim();
        }
    }

    // Last entry
    if (currentEntry.transcription && currentEntry.gloss && currentEntry.translation) {
        entries.push(currentEntry as GlossEntry);
    }

    return entries;
}

/**
 * Convert Gitksan entries to Transcript row format
 */
function entriesToTranscriptRows(entries: GlossEntry[]): any[][] {
    return entries.map((entry, index) => {
        const id = String(index + 1);
        return [
            id,                           // id
            entry.transcription,          // ipa_transcription
            entry.gloss,                  // gloss
            entry.translation,            // free_translation
            '',                           // note
            'SIGMORPHON 2023',            // scribe
            '2023',                       // date
            'Gitksan',                    // group
            '',                           // speaker
            '',                           // begin_time
            '',                           // end_time
            ''                            // duration
        ];
    });
}

/**
 * Main execution
 */
async function main() {
    console.log('='.repeat(60));
    console.log('Fetch Gitksan Data from SIGMORPHON 2023');
    console.log('='.repeat(60));
    console.log('');

    try {
        // Fetch the data
        console.log('Fetching data from GitHub...');
        console.log(`URL: ${GITKSAN_DATA_URL}`);
        const content = await fetchUrl(GITKSAN_DATA_URL);
        console.log(`✓ Downloaded ${content.length} bytes`);
        console.log('');

        // Parse the data
        console.log('Parsing Gitksan gloss format...');
        const entries = parseGitksan(content);
        console.log(`✓ Parsed ${entries.length} gloss entries`);
        console.log('');

        // Show sample entries
        console.log('Sample entries:');
        entries.slice(0, 3).forEach((entry, idx) => {
            console.log(`\nEntry ${idx + 1}:`);
            console.log(`  Transcription: ${entry.transcription.substring(0, 80)}${entry.transcription.length > 80 ? '...' : ''}`);
            console.log(`  Gloss: ${entry.gloss.substring(0, 80)}${entry.gloss.length > 80 ? '...' : ''}`);
            console.log(`  Translation: ${entry.translation.substring(0, 80)}${entry.translation.length > 80 ? '...' : ''}`);
        });
        console.log('');

        // Convert to Transcript format
        console.log('Converting to Transcript format...');
        const headers = [
            'id',
            'ipa_transcription',
            'gloss',
            'free_translation',
            'note',
            'scribe',
            'date',
            'group',
            'speaker',
            'begin_time',
            'end_time',
            'duration'
        ];

        const transcript = new Transcript(headers);
        const rows = entriesToTranscriptRows(entries);
        transcript.load(rows);

        console.log(`✓ Loaded ${transcript.rows.length} rows into Transcript`);
        console.log('');

        // Validate the transcript
        console.log('Validating transcript...');
        const idValidation = transcript.validateIds();
        console.log(`  Missing IDs: ${idValidation.missingIds.length}`);
        console.log(`  Duplicate IDs: ${idValidation.duplicateRowNumbers.length}`);

        const glossValidation = transcript.validateGlosses();
        console.log(`  Misaligned glosses: ${glossValidation.length}`);
        console.log('');

        // Export to CSV
        console.log('Exporting to CSV...');
        const csvOutput = transcript.unparseAsCsv();
        const csvPath = path.join(__dirname, 'gitksan-data.csv');
        fs.writeFileSync(csvPath, csvOutput);
        console.log(`✓ Saved to: ${csvPath}`);
        console.log('');

        // Generate statistics
        console.log('Statistics:');
        const concordance = transcript.concordance();
        const uniqueWords = new Set(concordance.map(w => w.word));
        console.log(`  Total utterances: ${transcript.rows.length}`);
        console.log(`  Total words: ${concordance.length}`);
        console.log(`  Unique words: ${uniqueWords.size}`);
        console.log('');

        // Generate sample outputs
        console.log('Generating sample outputs...');

        // Generate text gloss for first 5 entries
        const sampleTranscript = new Transcript(headers);
        sampleTranscript.load(rows.slice(0, 5));
        const glossText = sampleTranscript.generateGlossText();
        const textPath = path.join(__dirname, 'gitksan-sample-gloss.txt');
        fs.writeFileSync(textPath, glossText);
        console.log(`  ✓ Text gloss: ${textPath}`);

        // Generate HTML
        const glossHtml = sampleTranscript.generateGlossHtml();
        const htmlDocument = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Gitksan Interlinear Glosses - SIGMORPHON 2023</title>
    <style>
        body { font-family: 'Charis SIL', 'Doulos SIL', 'Gentium Plus', serif; margin: 40px; }
        h1 { color: #333; }
        .interlinear { margin-bottom: 30px; padding: 15px; border-left: 3px solid #4CAF50; background: #f9f9f9; }
        .utterance { font-weight: bold; margin-bottom: 10px; color: #2196F3; }
        .intlin { display: inline-block; margin-right: 15px; vertical-align: top; }
        .orig { display: block; font-style: italic; font-size: 1.1em; color: #333; }
        .morph { display: block; font-size: 0.9em; color: #666; font-variant: small-caps; }
        .freetrans { margin-top: 10px; color: #000; font-style: italic; }
    </style>
</head>
<body>
    <h1>Gitksan Language Data</h1>
    <p><strong>Source:</strong> SIGMORPHON 2023 Glossing Shared Task</p>
    <p><strong>Dataset:</strong> git-dev-track1-uncovered</p>
    <p><strong>Total entries:</strong> ${entries.length}</p>
    <p><strong>Showing:</strong> First 5 entries</p>
    <hr>
${glossHtml}
</body>
</html>`;
        const htmlPath = path.join(__dirname, 'gitksan-sample-gloss.html');
        fs.writeFileSync(htmlPath, htmlDocument);
        console.log(`  ✓ HTML gloss: ${htmlPath}`);

        // Generate LaTeX
        const latexDoc = sampleTranscript.generateLatexDocument();
        const latexPath = path.join(__dirname, 'gitksan-sample-gloss.tex');
        fs.writeFileSync(latexPath, latexDoc);
        console.log(`  ✓ LaTeX gloss: ${latexPath}`);
        console.log('');

        // Save raw data for reference
        const rawPath = path.join(__dirname, 'gitksan-raw.txt');
        fs.writeFileSync(rawPath, content);
        console.log(`Raw data saved to: ${rawPath}`);
        console.log('');

        console.log('='.repeat(60));
        console.log('SUCCESS!');
        console.log('='.repeat(60));
        console.log('');
        console.log('Files created:');
        console.log(`  1. ${csvPath} - Full dataset in CSV format`);
        console.log(`  2. ${textPath} - Sample aligned text glosses`);
        console.log(`  3. ${htmlPath} - Sample HTML glosses`);
        console.log(`  4. ${latexPath} - Sample LaTeX glosses`);
        console.log(`  5. ${rawPath} - Original raw data`);
        console.log('');
        console.log('You can now:');
        console.log('  - Import gitksan-data.csv into spreadsheet software');
        console.log('  - View gitksan-sample-gloss.html in a web browser');
        console.log('  - Compile gitksan-sample-gloss.tex with xelatex');
        console.log('  - Use the Transcript object for further analysis');
        console.log('');

    } catch (error) {
        console.error('ERROR:', error);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

export { parseGitksan, entriesToTranscriptRows, fetchUrl };
