# Setup Instructions: The Absurd Ascent (Farce Drama)

This document provides setup instructions for "The Absurd Ascent," a farce drama that is generated completely in a single execution using Google Gemini AI.

## Overview

- **Title**: The Absurd Ascent
- **Genre**: Drama
- **Subgenre**: Farce
- **Type**: Complete drama (14 scenes across 3 acts)
- **Generation**: Single execution generating all scenes at once
- **Workflow**: Manual trigger via GitHub Actions

## Architecture

Unlike the daily novel workflows, the farce drama workflow:
1. Generates all 14 scenes in a single execution
2. Publishes all content to a GitHub Gist at once
3. Is manually triggered (not scheduled)
4. Follows the same structure as novels but uses "acts" and "scenes" instead of "chapters"

## Directory Structure

```
docs/farce-drama/
├── README.md              # Context and overview of the drama
├── series_bible.md        # Character descriptions, setting, themes
├── outline.md             # Complete act and scene structure
├── summaries.md           # Scene-by-scene summaries (generated)
├── continuity_log.txt     # Timestamped log of scene generation (generated)
├── chapters.json          # Metadata for UI display (generated)
└── act_X_scene_XX.md      # Individual scene files (generated)

scripts/farce-drama/
├── farce_drama_to_gist.py # Main generation script
├── requirements.txt       # Python dependencies
└── prompts/
    ├── scene_prompt.txt   # Template for scene generation
    └── summary_prompt.txt # Template for summary generation

public/docs/farce-drama/
└── chapters.json          # Copy of chapters.json for UI

.github/workflows/
└── manual-farce-drama.yml # Manual trigger workflow
```

## Required Environment Variables

These should be set as GitHub repository secrets:

### 1. GEMINI_API_KEY
**Purpose**: Google Gemini API key for AI text generation  
**Used by**: All generation workflows  
**How to obtain**:
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key value

### 2. GIST_TOKEN
**Purpose**: GitHub Personal Access Token for creating/updating gists  
**Used by**: All generation workflows  
**Scope required**: `gist` (Create gists)  
**How to obtain**:
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "MockPoet Gist Access")
4. Select scope: `gist`
5. Click "Generate token"
6. Copy the token immediately (you won't see it again)

### 3. FARCE_DRAMA_GIST_ID
**Purpose**: Gist ID for "The Absurd Ascent" drama  
**Used by**: Farce drama workflow only  
**How to obtain**:
1. Go to [GitHub Gists](https://gist.github.com/)
2. Click "Create new gist"
3. Add a placeholder file (e.g., filename: `README.md`, content: `Placeholder for The Absurd Ascent`)
4. Set visibility to "Public"
5. Click "Create public gist"
6. Copy the gist ID from the URL (e.g., `https://gist.github.com/username/[GIST_ID]`)

## Setup Steps

### 1. Add Secrets to GitHub Repository

1. Go to your repository on GitHub
2. Click Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each of the three secrets listed above:
   - `GEMINI_API_KEY`
   - `GIST_TOKEN`
   - `FARCE_DRAMA_GIST_ID`

### 2. Verify Workflow Configuration

The workflow file at `.github/workflows/manual-farce-drama.yml` should be present and configured to:
- Trigger manually only (`workflow_dispatch`)
- Use Python 3.11
- Install dependencies from `scripts/farce-drama/requirements.txt`
- Run `scripts/farce-drama/farce_drama_to_gist.py`
- Update `config.js` with the gist ID
- Sync `chapters.json` to the public folder
- Commit and push changes

### 3. Manual Workflow Trigger

To generate the complete drama:

1. Go to your repository on GitHub
2. Click on "Actions" tab
3. Select "Manual Farce Drama Generation" from the workflow list
4. Click "Run workflow" button
5. Confirm by clicking "Run workflow" in the dropdown

The workflow will:
- Generate all 14 scenes (3 acts) in a single execution
- Create summaries and continuity logs
- Publish everything to the specified gist
- Update the repository with generated files
- Update `config.js` with the gist ID if it was empty

**Note**: This generation process will take approximately 15-30 minutes depending on API response times.

### 4. Verify Generation

After the workflow completes:

1. Check the gist at `https://gist.github.com/[username]/[FARCE_DRAMA_GIST_ID]`
   - You should see all scene files (act_1_scene_01.md through act_3_scene_04.md)
   - Support files (README.md, series_bible.md, outline.md, summaries.md, continuity_log.txt, chapters.json)

2. Check the repository
   - `docs/farce-drama/` should contain all generated files
   - `public/docs/farce-drama/chapters.json` should be updated
   - `config.js` should have the gist ID filled in for `absurd_ascent`

3. Check the UI
   - Build and deploy the site
   - You should see "The Absurd Ascent" listed under "Drama" section
   - It should show "Farce" as the subgenre badge
   - It should display "14 Scenes Available"
   - Status should show "Completed"

## Drama Structure

### Acts and Scenes

**Act 1**: The Grand Scheme (5 scenes)
- Setup of characters and their ambitions
- Introduction of mistaken identities and schemes
- Escalating complications

**Act 2**: The Complications Multiply (5 scenes)
- Plans go awry in absurd ways
- Physical comedy escalates
- Multiple storylines collide

**Act 3**: The Absurd Resolution (4 scenes)
- Peak chaos and revelations
- Character confessions and growth
- Satisfying comedic resolution

### Content Details

- **Total Scenes**: 14
- **Estimated Word Count**: 25,000-30,000 words
- **Style**: Theatrical farce with stage directions
- **Tone**: Satirical comedy with physical humor
- **Format**: Theatrical script with character names in CAPS and stage directions in brackets

## Updating the Drama

To regenerate the drama (e.g., if you want to create a new version):

1. Optionally edit seed files:
   - `docs/farce-drama/series_bible.md` (character/world details)
   - `docs/farce-drama/outline.md` (plot structure)
   - `scripts/farce-drama/prompts/scene_prompt.txt` (generation instructions)

2. Run the workflow again (this will overwrite existing content)

3. The new version will be published to the same gist (overwriting previous version)

## Troubleshooting

### Workflow Fails

1. Check that all three secrets are set correctly
2. Verify the gist ID is a valid public gist you own
3. Check the workflow logs for specific error messages
4. Ensure the Gemini API key is valid and has quota available

### Gist Not Updating

1. Verify `GIST_TOKEN` has the `gist` scope
2. Ensure the token hasn't expired
3. Check that the `FARCE_DRAMA_GIST_ID` is correct

### UI Not Showing Drama

1. Ensure the workflow completed successfully
2. Verify `chapters.json` was synced to `public/docs/farce-drama/`
3. Rebuild and redeploy the site
4. Check browser console for any fetch errors

### Generation Takes Too Long

- The complete drama generation can take 20-30 minutes due to:
  - 14 scenes being generated sequentially
  - Each scene requires 2 API calls (content + summary)
  - API rate limits and response times
- This is normal; the workflow will wait for completion

## Related Files

- Main workflow: `.github/workflows/manual-farce-drama.yml`
- Generation script: `scripts/farce-drama/farce_drama_to_gist.py`
- Config: `config.js` (absurd_ascent section)
- Home page: `src/pages/Home.jsx`
- Book card: `src/components/BookCard.jsx`

## Notes

- Unlike novels that generate daily chapters, this drama generates all content at once
- The "Completed" status is set to `true` immediately after generation
- The workflow is manual-trigger only to avoid accidental regeneration
- Each run completely overwrites previous content (not incremental)
- The drama structure uses "scenes" instead of "chapters" in the UI
- Genre metadata (Drama/Farce) is stored in `chapters.json` and displayed in the UI
