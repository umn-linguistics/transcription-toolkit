# Developer Guide

This guide covers development workflows, testing, building, and deployment of `Transcription Toolkit` to Google Apps Script.

## Prerequisites

### Required

- **Node.js** (v12 or higher)
- **npm**
- **Google Account**

### Install
1. Install Google clasp (see [Google docs](https://github.com/google/clasp?tab=readme-ov-file#install) for additional details).
   ```bash
   npm install -g @google/clasp
   ```
2. Enable the Google Apps script API at https://script.google.com/home/usersettings
3. Install dependencies
   ```bash
   npm install
   ```
4. Login to clasp 
   ```bash
   clasp login
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

### Initial Setup

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

### Initial Setup

1. Either create a new spreadsheet from scratch using the `clasp` CLI (**Option A**) or open a spreadsheet in Google Sheets and retrieve the spreadsheet and script IDs (**Option B**).

   - **Option A** Create a new project using the `clasp` CLI.
      ```bash
      clasp create --type sheets --title "Transcription Toolkit"
      ```
   - **Option B** Get IDs for Google Apps Script project
      - Open the Google Sheet you want to deploy to in a web browser.
      - From the URL of the sheet, locate and copy the ID. This will be the string of characters preceded by `https://docs.google.com/spreadsheets/d/` and followed by `/edit?`. For example, `xxxxx` from the following URL:
         - https://docs.google.com/spreadsheets/d/xxxxx/edit?gid=123#gid=456
      - This string of characters is `YOUR_SPREADSHEET_ID`.
      - From the same Google Sheet, navigate to `Extensions` → `Apps Script`.
         - Select `⚙ Project Settings`, locate the `Script ID`, and copy the value. This is `YOUR_SCRIPT_ID`.
      - Update `.clasp.json` in the project root with the values identified above. If you chose **Option B** above, these should already be populated 
         ```json
         {
            "scriptId": "YOUR_SCRIPT_ID",
            "rootDir": "./dist",
            "parentId": "YOUR_SPREADSHEET_ID"
         }
         ```

2. **Ensure Apps Script is Enabled in Google Console**

   Enable it by visiting https://script.google.com/home/usersettings.


### Deployment Workflow

#### 1. Build the Project

```bash
npm run build
```

This creates the deployable files in `dist/`.

#### 2. Run tests

```bash
npm run test
```

This creates the deployable files in `dist/`.

#### 3. Push to Google Apps Script

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
  "timeZone": "America/Chicago",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}
```


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