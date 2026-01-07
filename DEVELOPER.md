# Developer Guide

This guide covers development workflows, testing, building, and deployment to Google Apps Script.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Building the Project](#building-the-project)
- [Running Tests](#running-tests)
- [Deploying to Google Apps Script](#deploying-to-google-apps-script)
- [Development Workflow](#development-workflow)

## Prerequisites

### Required

- **Node.js** (v12 or higher)
- **npm** (comes with Node.js)
- **Google Account** (for Google Apps Script deployment)

### Install Global Tools

```bash
# Install clasp (Command Line Apps Script Projects)
npm install -g @google/clasp

# Install TypeScript compiler (optional, project has local version)
npm install -g typescript
```

## Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd transcription-toolkit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Login to clasp** (first time only)
   ```bash
   clasp login
   ```
   This opens a browser window for Google authentication and stores credentials locally.

4. **Verify setup**
   ```bash
   npm test
   npm run build
   ```

## Project Structure

```
transcription-toolkit/
├── src/                      # TypeScript source files
│   ├── Transcript.ts         # Core transcript class
│   ├── Orthography.ts        # Grapheme validation
│   ├── Gloss.ts              # Morpheme gloss validation
│   ├── Elan.ts               # ELAN timing data integration
│   ├── TranscriptStorage.ts  # Storage abstraction
│   ├── TranscriptSpreadsheet.ts  # Spreadsheet abstraction
│   ├── types.ts              # TypeScript type definitions
│   ├── validators.ts         # Validation functions
│   ├── interfaces/           # Interface definitions
│   └── gsheets/              # Google Apps Script specific code
│       ├── gsheets-app.ts    # Main entry point for Google Sheets
│       └── *-template.html   # HTML templates for UI
├── dist/                     # Build output (generated)
│   ├── index.js              # Bundled JavaScript
│   └── appsscript.json       # Google Apps Script manifest
├── examples/                 # Example scripts and data
├── .clasp.json               # Clasp configuration
├── appsscript.json           # Apps Script manifest (source)
├── rollup.config.js          # Build configuration
└── package.json              # Project dependencies
```

## Building the Project

The build process compiles TypeScript and bundles code for Google Apps Script.

### Build Commands

```bash
npm run build
```

### Build Process

1. **Compile TypeScript** (`rollup` script)
   - Transpiles TypeScript to JavaScript
   - Outputs to `dist/` directory
   - Uses Babel for compatibility

2. **Copy manifest** (`manifest` script)
   - Copies `appsscript.json` to `dist/`
   - Copies HTML templates to `dist/`

### Build Output

After building, the `dist/` folder contains:
- `index.js` - Main application code
- `appsscript.json` - Apps Script manifest
- HTML templates for UI dialogs

## Running Tests

### Run All Tests

```bash
npm test
```

### Test Coverage

```bash
npm test -- --coverage
```

## Deploying to Google Apps Script

### Initial Setup (First Time Only)

1. **Create a new Google Apps Script project**

   Option A: Create from Google Sheets
   - Open a Google Sheet
   - Extensions → Apps Script
   - Copy the Script ID from Project Settings

   Option B: Create standalone project
   ```bash
   clasp create --type sheets --title "Transcription Toolkit"
   ```

2. **Enable Apps Script in Google Console**

Enable it by visiting https://script.google.com/home/usersettings.

3. **Update `.clasp.json`**

   Create or update `.clasp.json` in the project root:
   ```json
   {
     "scriptId": "YOUR_SCRIPT_ID_HERE",
     "rootDir": "./dist"
   }
   ```

   Replace `YOUR_SCRIPT_ID_HERE` with your actual Script ID.

### Deployment Workflow

#### 1. Build the Project

```bash
npm run build
```

This creates the deployable files in `dist/`.

#### 2. Push to Google Apps Script

```bash
npm run deploy
# or
clasp push
```

This uploads all files from `dist/` to your Google Apps Script project.

#### 3. Verify Deployment

```bash
# Open the script in the browser
clasp open
```

### Alternative: Combined Build and Deploy

```bash
npm run ci
```

This runs tests, builds, and deploys in one command.

### Deployment Tips

**Watch mode during development:**
```bash
clasp push --watch
```
Automatically pushes changes when files are modified.

**Check what will be deployed:**
```bash
clasp status
```

**Pull remote changes:**
```bash
clasp pull
```
Downloads the latest version from Google Apps Script.

## Development Workflow

### Typical Development Cycle

1. **Make changes** to TypeScript files in `src/`

2. **Run tests** to verify changes
   ```bash
   npm test
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Deploy to Google Apps Script**
   ```bash
   npm run deploy
   ```

5. **Test in Google Sheets**
   - Open the Google Sheet bound to your script
   - Test the custom menu functions
   - Check the Apps Script execution logs

### Viewing Logs

```bash
# View recent execution logs
clasp logs

# Stream logs in real-time
clasp logs --watch
```

## Google Apps Script Configuration

### appsscript.json

The `appsscript.json` file configures your Apps Script project:

```json
{
  "timeZone": "America/New_York",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}
```

Key settings:
- **timeZone**: Affects date/time functions
- **runtimeVersion**: Use "V8" for modern JavaScript features
- **exceptionLogging**: "STACKDRIVER" enables detailed error logs


## Additional Resources

### Google Apps Script

- [Apps Script Documentation](https://developers.google.com/apps-script)
- [Spreadsheet Service](https://developers.google.com/apps-script/reference/spreadsheet)
- [Drive Service](https://developers.google.com/apps-script/reference/drive)

### Clasp

- [Clasp Documentation](https://github.com/google/clasp)
- [Clasp Commands](https://github.com/google/clasp/blob/master/docs/commands.md)

### Project Tools

- [Rollup Documentation](https://rollupjs.org/)
- [esbuild Documentation](https://esbuild.github.io/)
- [Jest Documentation](https://jestjs.io/)

## Contributing

### Before Submitting Changes

1. **Run tests:**
   ```bash
   npm test
   ```

2. **Build successfully:**
   ```bash
   npm run build
   ```

3. **Verify deployment works:**
   ```bash
   npm run deploy
   clasp open  # Test in browser
   ```

## Version Management

### Creating a New Deployment

```bash
# Create a versioned deployment
clasp deploy --description "Version 1.0.0"

# List all deployments
clasp deployments

# Redeploy to existing deployment
clasp deploy --deploymentId <deployment-id>
```

### Updating Version

Update version in `package.json`:
```json
{
  "version": "1.0.0"
}
```