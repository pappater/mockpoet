# Setup Instructions: The Bureaucratic Odyssey (Satire Fiction Novel)

This document provides detailed setup instructions for "The Bureaucratic Odyssey," a satirical fiction novel that lampoons modern bureaucracy and corporate culture.

## Overview

- **Title**: The Bureaucratic Odyssey
- **Genre**: Fiction
- **Subgenre**: Satire
- **Length**: 25 chapters (approximately 100 pages)
- **Generation**: One chapter per day using Google Gemini AI
- **Publication**: All chapters published to a single public GitHub Gist
- **Update Schedule**: Daily at 14:00 UTC

## Prerequisites

Before setting up the novel generation, you'll need:

1. **Google AI Studio API Key** (Gemini API)
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key for Gemini
   - Save this key securely

2. **GitHub Personal Access Token**
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with `gist` scope
   - Save this token securely

3. **Public GitHub Gist**
   - Go to [gist.github.com](https://gist.github.com)
   - Create a new **public** gist with any placeholder content
   - Copy the Gist ID from the URL (e.g., `https://gist.github.com/username/abc123def456` → ID is `abc123def456`)

## Environment Variables

The following environment variables must be configured as GitHub repository secrets:

### Required Secrets

Navigate to your repository on GitHub:
- Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

1. **GEMINI_API_KEY**
   - Your Google AI Studio API key
   - Used for AI-powered chapter generation
   - Example: `AIzaSyD...your_key_here`

2. **GIST_TOKEN**
   - Your GitHub Personal Access Token with `gist` scope
   - Used to update the gist with new chapters
   - Example: `ghp_abc123...your_token_here`

3. **SATIRE_GIST_ID**
   - The ID of your public gist where chapters will be published
   - This is unique to the Satire Novel
   - Example: `abc123def456...your_gist_id`

### Optional Configuration

The workflow uses these additional environment variables (with defaults):

- **GEMINI_MODEL**: `gemini-2.5-flash` (can be changed in workflow file)

## Initial Setup Steps

### 1. Add Repository Secrets

Add all three required secrets (`GEMINI_API_KEY`, `GIST_TOKEN`, `SATIRE_GIST_ID`) to your GitHub repository as described above.

### 2. Create the Gist

1. Create a new public gist at https://gist.github.com
2. Add a placeholder file (e.g., `README.md` with "Setting up...")
3. Copy the gist ID from the URL
4. Add this ID as the `SATIRE_GIST_ID` secret

### 3. Initial Workflow Run

After adding all secrets, manually trigger the first run:

1. Go to Actions tab in your repository
2. Select "Daily Gemini Satire Novel Chapter to Gist" workflow
3. Click "Run workflow" button
4. Select the branch and click "Run workflow"

### 4. Verify Success

After the workflow completes:

1. Check the Actions tab for the workflow run status (should show green checkmark)
2. Visit your Gist URL
3. You should see these files:
   - `chapter_001.md` - The first chapter
   - `series_bible.md` - Character and setting information
   - `outline.md` - Story structure for all 25 chapters
   - `summaries.md` - Chapter summaries (updated with chapter 1)
   - `continuity_log.txt` - Timestamped generation log
   - `chapters.json` - Chapter index with URLs for UI integration
   - `README.md` - Context about the novel

4. Check the repository:
   - `config.js` and `src/config.js` should have the gist ID populated
   - `docs/satire-novel/chapters.json` and `public/docs/satire-novel/chapters.json` should be updated

## Ongoing Operation

### Automatic Daily Generation

After initial setup, the workflow will:
- Run automatically every day at 14:00 UTC
- Generate the next chapter in sequence
- Check for any missing chapters and fill gaps
- Update all tracking files (summaries, continuity log, chapters.json)
- Publish everything to the gist
- Update the repository with latest metadata
- No manual intervention required

### Manual Triggering

You can trigger chapter generation manually at any time:
1. Go to Actions tab
2. Select "Daily Gemini Satire Novel Chapter to Gist"
3. Click "Run workflow"
4. Select branch and run

This is useful for:
- Generating chapters on-demand
- Recovering from failed runs
- Testing changes to prompts or structure

### Gap Filling

The script includes intelligent gap detection:
- Checks for missing chapters in the sequence (e.g., if chapter 5 is missing between 4 and 6)
- Automatically generates missing chapters before moving forward
- Ensures no chapters are skipped even if workflows fail

## File Structure

### Repository Files

```
docs/satire-novel/
├── README.md              # Novel context and synopsis
├── series_bible.md        # Characters, setting, themes
├── outline.md             # All 25 chapters outlined
├── summaries.md           # Generated chapter summaries
├── continuity_log.txt     # Generation log with timestamps
└── chapters.json          # Chapter index with URLs

public/docs/satire-novel/
└── chapters.json          # Copy for web deployment

scripts/satire-novel/
├── satire_novel_daily_to_gist.py  # Main generation script
├── requirements.txt                # Python dependencies
└── prompts/
    ├── chapter_prompt.txt          # AI chapter generation template
    └── summary_prompt.txt          # AI summary generation template

.github/workflows/
└── daily-satire-novel.yml         # GitHub Actions workflow
```

### Gist Files

The public gist will contain:
- `chapter_001.md` through `chapter_025.md` (as generated)
- `README.md` - Novel context
- `series_bible.md` - Reference material
- `outline.md` - Story structure
- `summaries.md` - All chapter summaries
- `continuity_log.txt` - Generation history
- `chapters.json` - Complete chapter index

## Configuration in UI

The novel will appear in the UI with:
- **Title**: "The Bureaucratic Odyssey"
- **Category**: Novels (Fiction)
- **Subgenre Badge**: "Satire"
- **Update Frequency**: "Updated daily"
- **Status**: "Ongoing" (until all 25 chapters complete)

The chapters.json file provides:
```json
{
  "novel_title": "The Bureaucratic Odyssey",
  "genre": "Fiction",
  "subgenre": "Satire",
  "total_chapters": <number>,
  "last_updated": "<timestamp>",
  "gist_id": "<your_gist_id>",
  "completed": false,
  "chapters": [
    {
      "chapter": 1,
      "filename": "chapter_001.md",
      "chapter_name": "The Morning Ritual",
      "url": "<raw_gist_url>",
      "gist_url": "<gist_web_url>"
    },
    ...
  ]
}
```

## Customization

### Changing the Theme

Edit `scripts/satire-novel/satire_novel_daily_to_gist.py`:
```python
THEME = "Your custom theme here"
```

### Modifying Story Direction

Edit these files in `docs/satire-novel/`:
- `series_bible.md` - Characters, setting, themes
- `outline.md` - Chapter structure and plot

### Adjusting Generation Prompts

Edit files in `scripts/satire-novel/prompts/`:
- `chapter_prompt.txt` - Controls chapter generation style and content
- `summary_prompt.txt` - Controls summary format

### Changing Schedule

Edit `.github/workflows/daily-satire-novel.yml`:
```yaml
schedule:
  - cron: '0 14 * * *'  # Currently 14:00 UTC daily
```

Change the cron expression to your preferred schedule.

## Troubleshooting

### Workflow fails with "SATIRE_GIST_ID not set"
- Verify the secret is added with exact name `SATIRE_GIST_ID`
- Check that the gist ID is correct
- Ensure the gist is public (not secret)

### Workflow fails with "GEMINI_API_KEY not set"
- Verify the secret is added with exact name `GEMINI_API_KEY`
- Check that your API key is valid
- Verify you have quota remaining in Google AI Studio

### Workflow fails with "GIST_TOKEN not set"
- Verify the secret is added with exact name `GIST_TOKEN`
- Ensure your Personal Access Token has `gist` scope
- Check that the token hasn't expired

### Chapter generation fails
- Check the Actions log for specific error messages
- Verify Gemini API quota
- Check that series_bible.md and outline.md exist and are valid
- Ensure the gist is public and accessible

### Chapters are missing
- The script automatically detects and fills gaps
- Manually trigger the workflow to generate missing chapters
- Check continuity_log.txt to see what's been generated

### Config files not updating
- Verify the workflow has write permissions
- Check that the `SATIRE_GIST_ID` secret is set
- Look for the config update step in the workflow logs

## Monitoring

### What to Check

1. **Actions Tab**: Workflow runs should complete successfully (green checkmark)
2. **Gist**: Should have latest chapter and updated files
3. **Repository**: chapters.json should be updated in both docs and public folders
4. **Config Files**: Both config.js and src/config.js should have the gist ID set

### Expected Timeline

- **Day 1**: Chapter 1 generated
- **Day 2**: Chapter 2 generated
- **Day 3**: Chapter 3 generated
- ...
- **Day 25**: Final chapter generated, novel complete

If any day's workflow fails, the next run will detect missing chapters and generate them.

## API Costs

- **Google Gemini API**: Check [Google AI pricing](https://ai.google.dev/pricing) for current rates
  - Uses `gemini-2.5-flash` model
  - 2 API calls per chapter (chapter + summary)
  - ~50 calls total for 25 chapters
- **GitHub Gist API**: Free for public gists
- **GitHub Actions**: Free for public repositories within usage limits

## Security Notes

- Never commit API keys or tokens to the repository
- Always use GitHub Secrets for sensitive credentials
- The gist must be public for this workflow
- Regularly rotate your API keys and tokens
- Review workflow runs to ensure no secrets are logged

## Support and Issues

If you encounter issues:
1. Check the detailed error messages in GitHub Actions logs
2. Verify all secrets are correctly configured
3. Review the troubleshooting section above
4. Check that all required files exist in docs/satire-novel/
5. Ensure Python dependencies are correctly specified
6. Open an issue in the repository if problems persist

## Novel Information

- **Genre**: Fiction / Satire
- **Style**: Kafkaesque corporate satire meets Terry Pratchett humor
- **Themes**: Bureaucratic absurdity, human connection, finding meaning in work
- **Target Length**: 25 chapters, ~100 pages
- **Protagonist**: Gordon Paperwork, middle manager turned reluctant revolutionary
- **Tone**: Sharp satirical wit balanced with genuine humanity

The novel satirizes modern workplace culture through the lens of an exaggerated bureaucracy, ultimately celebrating human resilience and the power of small rebellions against absurdity.
