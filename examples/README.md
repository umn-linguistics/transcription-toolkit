# Transcription Toolkit Examples

This directory contains example code demonstrating how to use the Transcription Toolkit.

## Files

- **field-methods-data.csv** - Sample linguistic field methods data
- **field-methods-example.ts** - TypeScript example demonstrating all Transcript class methods
- **sigmorphon-example.ts** - Script to fetch and convert Gitksan data from SIGMORPHON 2023

## Running the Example

### Prerequisites

1. **Node.js** (v12 or higher)
2. **npm packages** - Install from project root:
   ```bash
   cd ..
   npm install
   cd examples
   ```

### Option 1: Using ts-node

```bash
npx ts-node field-methods-example.ts
```

### Option 2: Using tsx (faster)

```bash
npx tsx field-methods-example.ts
```

### Option 3: Compile and run

```bash
npx tsc field-methods-example.ts --esModuleInterop --moduleResolution node
node transcription-example.js
```

## Fetching Gitksan Data from SIGMORPHON 2023

The `sigmorphon-example.ts` script downloads and converts Gitksan language data from the SIGMORPHON 2023 Glossing Shared Task.

### Running the Gitksan fetch script

```bash
# Using ts-node
npx ts-node sigmorphon-example.ts

# Using tsx (faster)
npx tsx sigmorphon-example.ts
```

### What it does

1. **Fetches** the Gitksan dataset from GitHub
2. **Parses** the three-line gloss format:
   - `\t` lines → IPA transcription
   - `\g` lines → Morpheme-by-morpheme gloss
   - `\l` lines → Free translation
3. **Converts** to Transcript CSV format
4. **Validates** the data (IDs, gloss alignment)
5. **Generates** sample outputs (HTML, LaTeX, text)

### Output files

- `gitksan-data.csv` - Full dataset in CSV format
- `gitksan-sample-gloss.txt` - Sample aligned text glosses
- `gitksan-sample-gloss.html` - Sample HTML glosses
- `gitksan-sample-gloss.tex` - Sample LaTeX glosses
- `gitksan-raw.txt` - Original raw data

### Data source

- **Repository:** [sigmorphon/2023glossingST](https://github.com/sigmorphon/2023glossingST)
- **Dataset:** data/Gitksan/git-dev-track1-uncovered
- **Language:** Gitksan (Tsimshianic language family)
- **Purpose:** Shared task on automatic interlinear glossing

## What the Example Demonstrates

The example script demonstrates all public methods of the `Transcript` class:

1. **concordance()** - Generate word-level concordance
2. **validateIds()** - Check for missing or duplicate IDs
3. **validateGlosses()** - Verify gloss alignment (word count matching)
4. **validateGraphemes()** - Validate character inventory against orthography profile
5. **validateMorphemeLabels()** - Verify morpheme gloss abbreviations
6. **generateGlossText()** - Create aligned text output for documentation
7. **generateGlossHtml()** - Generate HTML interlinear glosses
8. **generateLatexDocument()** - Create LaTeX document with expex package
9. **unparseAsCsv()** - Export transcript data as CSV
10. **bySpeaker()** - Split transcript into separate transcripts per speaker
11. **loadElan()** - Integrate ELAN timing data into transcript

## Generated Output Files

Running the example will create the following files in the `examples/` directory:

- `gloss-output.html` - HTML formatted interlinear glosses
- `glosses.tex` - LaTeX document (compile with `xelatex glosses.tex`)
- `transcript-export.csv` - Full transcript exported as CSV
- `transcript-{speaker}.csv` - Individual CSV files for each speaker
- `workflow-export.csv` - Workflow example output

## Sample Data

The `field-methods-data.csv` file contains language data collected during field methods classes, including:

- IPA transcriptions
- Morpheme-level glosses
- Free translations
- Metadata (scribe, date, speaker, notes)

## Next Steps

After running the example, you can:

1. **Customize the orthography profile** with your language's grapheme inventory
2. **Define your morpheme glossing conventions** following Leipzig Glossing Rules
3. **Import ELAN timing data** from your own recordings
4. **Generate publication-ready outputs** in your preferred format

## Related Classes

The example also demonstrates using:

- `Orthography` - Define grapheme inventory for character validation
- `Gloss` - Define valid morpheme gloss abbreviations
- `Elan` - Load timing data from ELAN exports


## Additional Resources

- [Leipzig Glossing Rules](https://www.eva.mpg.de/lingua/pdf/Glossing-Rules.pdf)
- [ELAN Annotation Software](https://archive.mpi.nl/tla/elan)