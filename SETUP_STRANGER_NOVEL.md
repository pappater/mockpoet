# Setup Instructions for "The Indifferent Shore" Novel

This document provides step-by-step instructions for setting up the new Camus-inspired novel "The Indifferent Shore" in the mockpoet repository.

## Overview

"The Indifferent Shore" is a new AI-generated novel inspired by Albert Camus' "The Stranger". It explores themes of absurdism, existentialism, alienation, indifference of the universe, death and mortality, and justice and society's expectations.

The novel runs on a separate daily cron job and publishes to its own dedicated GitHub Gist, allowing both novels to coexist independently in the same UI.

## Prerequisites

Before setting up the new novel, ensure you have:

1. **Google AI Studio API Key** (can be shared with the main novel)
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create or use existing API key for Gemini

2. **GitHub Personal Access Token** (can be shared with the main novel)
   - Already configured as `GIST_TOKEN` secret
   - Ensure it has `gist` scope

3. **A NEW Public GitHub Gist** (must be different from the main novel)
   - Go to [gist.github.com](https://gist.github.com)
   - Create a new **public** gist with placeholder content
   - Note: This MUST be a different Gist ID from "The Weight of Promises"

## Environment Variables

### New Secret Required

You need to add **ONE** new repository secret:

**Name**: `STRANGER_GIST_ID`  
**Value**: Your new public Gist ID for "The Indifferent Shore"

Example:
- If your Gist URL is: `https://gist.github.com/pappater/xyz789abc123`
- Then `STRANGER_GIST_ID` = `xyz789abc123`

### Existing Secrets (Reused)

These secrets are already configured and will be reused:
- `GEMINI_API_KEY` - Google Gemini API key
- `GIST_TOKEN` - GitHub personal access token with gist scope

## Setup Steps

### Step 1: Add the New Secret

1. Navigate to your repository on GitHub
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add:
   - **Name**: `STRANGER_GIST_ID`
   - **Value**: Your new Gist ID (just the ID part, not the full URL)
5. Click **Add secret**

### Step 2: Update config.js (Optional)

The `config.js` file has been updated to support multiple novels. If you want to customize the Gist ID in the config file:

```javascript
novels: {
  indifferent_shore: {
    title: "The Indifferent Shore",
    gist: {
      username: 'pappater',
      id: 'YOUR_STRANGER_GIST_ID'  // Update this if needed
    },
    localPath: 'docs/stranger-novel'
  }
}
```

**Note**: The workflow uses the secret value, so updating this is optional.

### Step 3: Initial Run

Manually trigger the first chapter generation:

1. Go to **Actions** tab in your repository
2. Select **"Daily Gemini Stranger Novel Chapter to Gist"** workflow
3. Click **"Run workflow"** button
4. Select the branch (likely `main` or your PR branch)
5. Click **"Run workflow"**

### Step 4: Verify Success

After the workflow completes:

1. Check the **Actions** tab for the workflow run status
2. Visit your new Gist URL: `https://gist.github.com/[username]/[STRANGER_GIST_ID]`
3. You should see these files created:
   - `chapter_001.md` - The first chapter
   - `series_bible.md` - Character and setting information
   - `outline.md` - Story structure
   - `summaries.md` - Chapter 1 summary
   - `continuity_log.txt` - Chapter 1 log entry
   - `chapters.json` - Chapter index for UI

### Step 5: Check the UI

1. Visit your deployed site (or run locally with `python3 -m http.server`)
2. You should see TWO novels on the home page:
   - "The Weight of Promises" (existing)
   - "The Indifferent Shore" (new)
3. Click on "The Indifferent Shore" to read the first chapter

## Schedule

The new novel generates on a different schedule than the main novel:

- **The Weight of Promises**: Daily at 10:00 UTC
- **The Indifferent Shore**: Daily at 11:00 UTC

This prevents conflicts and ensures both novels can generate independently.

## File Structure

### New Files Created

```
docs/stranger-novel/
├── README.md              # Novel-specific documentation
├── series_bible.md        # Characters, setting, themes
├── outline.md             # Story structure (~18-20 chapters)
├── summaries.md           # Chapter summaries (auto-generated)
├── continuity_log.txt     # Generation log (auto-generated)
└── chapters.json          # Chapter index (auto-generated)

scripts/stranger-novel/
├── stranger_novel_daily_to_gist.py  # Main generation script
├── requirements.txt       # Python dependencies
└── prompts/
    ├── chapter_prompt.txt # Camus-style chapter prompt
    └── summary_prompt.txt # Summary generation prompt

.github/workflows/
└── daily-stranger-novel.yml  # Workflow for new novel
```

### Modified Files

```
config.js                  # Added multi-novel support
scripts/api.js            # Updated to handle multiple novels
scripts/home.js           # Updated to display multiple novels
scripts/reader.js         # Updated to handle novel selection
```

## Differences from "The Weight of Promises"

| Aspect | The Weight of Promises | The Indifferent Shore |
|--------|------------------------|----------------------|
| **Style** | Dostoevsky-inspired psychological realism | Camus-inspired existentialism |
| **Tone** | Deeply introspective, emotionally rich | Detached, observational |
| **Themes** | Debt, mercy, moral obligation | Absurdism, alienation, indifference |
| **Narrative Voice** | Third-person past tense | First-person present tense |
| **Prose Style** | Rich, philosophical, complex | Simple, declarative, sparse |
| **Chapter Count** | Open-ended | ~18-20 chapters (~200 pages) |
| **Gist ID** | `51893c25959355bda1884804375ec3d8` | Your new Gist ID |
| **Workflow Schedule** | 10:00 UTC | 11:00 UTC |
| **Secret Name** | `GIST_ID` | `STRANGER_GIST_ID` |

## Customization

### Changing the Novel's Theme

Edit `scripts/stranger-novel/stranger_novel_daily_to_gist.py`:

```python
THEME = "Your new theme here"
```

Also update `docs/stranger-novel/series_bible.md` to reflect changes.

### Modifying the Schedule

Edit `.github/workflows/daily-stranger-novel.yml`:

```yaml
schedule:
  - cron: '0 11 * * *'  # Change this cron expression
```

### Adjusting Chapter Length or Style

Edit the prompt templates:
- `scripts/stranger-novel/prompts/chapter_prompt.txt` - Chapter generation
- `scripts/stranger-novel/prompts/summary_prompt.txt` - Summary generation

## Troubleshooting

### Workflow Fails: "ERROR: STRANGER_GIST_ID environment variable not set"

**Solution**: Ensure you added the `STRANGER_GIST_ID` secret in repository settings with the correct Gist ID.

### Second Novel Not Showing in UI

**Possible causes**:
1. Gist ID not configured in `config.js`
2. Gist ID is empty or invalid
3. No chapters generated yet (will show "0 Chapters Available")

**Solution**: 
- Check `config.js` has the correct structure
- Run the workflow manually to generate Chapter 1
- Clear browser cache and reload

### Both Novels Using Same Gist

**Problem**: Both novels should use different Gists.

**Solution**: 
- Verify `STRANGER_GIST_ID` secret is different from `GIST_ID`
- Check the workflow logs to confirm it's using the correct Gist ID

### Chapter Generation Fails

Check these common issues:
1. Gemini API key is valid and has quota
2. Gist token has correct permissions
3. Gist is public (not secret)
4. Series bible and outline files exist

## Testing Locally

To test the UI locally:

```bash
# Navigate to repository
cd /path/to/mockpoet

# Start a local web server
python3 -m http.server 8000

# Open browser to http://localhost:8000
```

You should see both novels on the home page.

## API Costs

Both novels share the same Gemini API key, so costs accumulate:

- **Per novel**: ~2 API calls per day (chapter + summary)
- **Both novels**: ~4 API calls per day
- **Monthly**: ~120 API calls (for both novels)

Check [Google AI pricing](https://ai.google.dev/pricing) for current rates.

## Manual Chapter Generation

To manually generate a chapter without waiting for the cron job:

```bash
# Set environment variables
export GEMINI_API_KEY="your-key"
export GIST_TOKEN="your-token"
export STRANGER_GIST_ID="your-gist-id"

# Run the script
python3 scripts/stranger-novel/stranger_novel_daily_to_gist.py
```

## Support

For issues or questions:
1. Check the Actions log for detailed error messages
2. Review the troubleshooting section above
3. Verify all secrets are correctly configured
4. Ensure the Gist is public and accessible
5. Open an issue in the repository if problems persist

## Summary

- ✅ One new secret: `STRANGER_GIST_ID`
- ✅ Two reused secrets: `GEMINI_API_KEY`, `GIST_TOKEN`
- ✅ New workflow runs at 11:00 UTC daily
- ✅ Separate Gist for separate novel content
- ✅ Both novels appear in the same UI
- ✅ Click a novel card to read chapters
- ✅ ~18-20 chapters total (~200 pages)
