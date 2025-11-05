# Setup Instructions for "Moonbound Devotion" Novel

This document provides step-by-step instructions for setting up the new werewolf fantasy romance novel "Moonbound Devotion" in the rabbit repository.

## Overview

"Moonbound Devotion" is a contemporary fantasy romance novel inspired by popular Wattpad werewolf stories. It explores themes of fated mates, complete devotion, forbidden love between humans and werewolves, and ancient magic in a richly developed fantasy world.

The novel runs on a separate daily cron job and publishes to its own dedicated GitHub Gist, allowing all novels to coexist independently in the same UI.

## Prerequisites

Before setting up the new novel, ensure you have:

1. **Google AI Studio API Key** (can be shared with other novels)
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create or use existing API key for Gemini

2. **GitHub Personal Access Token** (can be shared with other novels)
   - Already configured as `GIST_TOKEN` secret
   - Ensure it has `gist` scope

3. **A NEW Public GitHub Gist** (must be different from other novels)
   - Go to [gist.github.com](https://gist.github.com)
   - Create a new **public** gist with placeholder content
   - Note: This MUST be a different Gist ID from other novels

## Environment Variables

### New Secret Required

You need to add **ONE** new repository secret:

**Name**: `WEREWOLF_GIST_ID`  
**Value**: Your new public Gist ID for "Moonbound Devotion"

Example:
- If your Gist URL is: `https://gist.github.com/pappater/abc123xyz789`
- Then `WEREWOLF_GIST_ID` = `abc123xyz789`

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
   - **Name**: `WEREWOLF_GIST_ID`
   - **Value**: Your new Gist ID (just the ID part, not the full URL)
5. Click **Add secret**

### Step 2: Update config.js (If Needed)

The `config.js` file has been updated to support the new novel. If you want to customize the Gist ID in the config file:

```javascript
novels: {
  moonbound_devotion: {
    title: "Moonbound Devotion",
    gist: {
      username: 'pappater',
      id: 'YOUR_WEREWOLF_GIST_ID'  // Update this if needed
    },
    localPath: 'docs/werewolf-novel'
  }
}
```

**Note**: The workflow uses the secret value, so updating this is optional.

### Step 3: Initial Run

Manually trigger the first chapter generation:

1. Go to **Actions** tab in your repository
2. Select **"Daily Gemini Werewolf Novel Chapter to Gist"** workflow
3. Click **"Run workflow"** button
4. Select the branch (likely `main` or your PR branch)
5. Click **"Run workflow"**

### Step 4: Verify Success

After the workflow completes:

1. Check the **Actions** tab for the workflow run status
2. Visit your new Gist URL: `https://gist.github.com/[username]/[WEREWOLF_GIST_ID]`
3. You should see these files created:
   - `chapter_001.md` - The first chapter
   - `series_bible.md` - Character and world information
   - `outline.md` - Story structure (25 chapters)
   - `summaries.md` - Chapter 1 summary
   - `continuity_log.txt` - Chapter 1 log entry
   - `chapters.json` - Chapter index for UI

### Step 5: Check the UI

1. Visit your deployed site (or run locally with `npm run dev`)
2. You should see THREE novels on the home page:
   - "The Weight of Promises" (Dostoevsky-style)
   - "The Indifferent Shore" (Camus-style)
   - "Moonbound Devotion" (Werewolf romance) **← NEW**
3. Click on "Moonbound Devotion" to read the first chapter

## Schedule

The new novel generates on a different schedule than existing novels:

- **The Weight of Promises**: Daily at 10:00 UTC
- **The Indifferent Shore**: Daily at 11:00 UTC
- **Moonbound Devotion**: Daily at 12:00 UTC **← NEW**

This prevents conflicts and ensures all novels can generate independently.

## Novel Details

### Genre & Style
- **Genre**: Paranormal Romance / Fantasy Romance / Werewolf Romance
- **Style**: Contemporary romance voice with fantasy elements
- **Target Audience**: Readers who love Wattpad-style werewolf romances
- **Length**: ~25 chapters, approximately 500-600 pages

### Themes
- Ancient werewolf kingdoms and supernatural bonds
- Complete devotion (Alpha King devoted to his human mate)
- Forbidden love between human and werewolf
- Fated mates chosen by destiny
- Strong heroine discovering her power
- Fantasy world-building with magic system
- Passionate romance with emotional depth

### Main Characters
- **Lyra Moonwhisper**: Human girl captured by werewolves, discovers she's the Alpha's fated mate
- **Kael Nightshade**: Alpha King of the Silverclaw Kingdom, fiercely protective and devoted
- **Seraphina Bloodmoon**: Rival werewolf princess, antagonist
- **Marcus Stormfang**: Kael's loyal Beta (second-in-command)
- **Mother Willow**: Ancient Oracle who reveals prophecies

## File Structure

### New Files Created

```
docs/werewolf-novel/
├── README.md              # Novel-specific documentation
├── series_bible.md        # Characters, setting, themes, world-building
├── outline.md             # Story structure (25 chapters)
├── summaries.md           # Chapter summaries (auto-generated)
├── continuity_log.txt     # Generation log (auto-generated)
└── chapters.json          # Chapter index (auto-generated)

scripts/werewolf-novel/
├── werewolf_novel_daily_to_gist.py  # Main generation script
├── requirements.txt       # Python dependencies
└── prompts/
    ├── chapter_prompt.txt # Romance fantasy chapter prompt
    └── summary_prompt.txt # Summary generation prompt

.github/workflows/
└── daily-werewolf-novel.yml  # Workflow for new novel
```

### Modified Files

```
config.js                  # Added moonbound_devotion configuration
src/config.js             # Added moonbound_devotion configuration
```

## Differences from Other Novels

| Aspect | Weight of Promises | Indifferent Shore | Moonbound Devotion |
|--------|-------------------|-------------------|-------------------|
| **Style** | Dostoevsky psychological | Camus existentialist | Contemporary romance |
| **Tone** | Introspective, philosophical | Detached, sparse | Passionate, emotionally intense |
| **Themes** | Debt, mercy, obligation | Absurdism, alienation | Love, devotion, fantasy |
| **POV** | Third-person omniscient | First-person present | Third-person limited (alternating) |
| **Genre** | Literary fiction | Literary fiction | Paranormal romance |
| **Chapter Count** | Open-ended | ~18-20 chapters | 25 chapters |
| **Target Pages** | Open-ended | ~200 pages | 500-600 pages |
| **Gist ID** | `51893c25959355bda1884804375ec3d8` | `b12ff3b5ea6e9f42a7becfc2cc1aeece` | Your new Gist ID |
| **Workflow Schedule** | 10:00 UTC | 11:00 UTC | 12:00 UTC |
| **Secret Name** | `GIST_ID` | `STRANGER_GIST_ID` | `WEREWOLF_GIST_ID` |

## Customization

### Changing the Novel's Theme

Edit `scripts/werewolf-novel/werewolf_novel_daily_to_gist.py`:

```python
THEME = "Your new theme here"
```

Also update `docs/werewolf-novel/series_bible.md` to reflect changes.

### Modifying the Schedule

Edit `.github/workflows/daily-werewolf-novel.yml`:

```yaml
schedule:
  - cron: '0 12 * * *'  # Change this cron expression
```

### Adjusting Chapter Length or Style

Edit the prompt templates:
- `scripts/werewolf-novel/prompts/chapter_prompt.txt` - Chapter generation
- `scripts/werewolf-novel/prompts/summary_prompt.txt` - Summary generation

## Troubleshooting

### Workflow Fails: "ERROR: WEREWOLF_GIST_ID environment variable not set"

**Solution**: Ensure you added the `WEREWOLF_GIST_ID` secret in repository settings with the correct Gist ID.

### Third Novel Not Showing in UI

**Possible causes**:
1. Gist ID not configured in `config.js`
2. Gist ID is empty or invalid
3. No chapters generated yet (will show "0 Chapters Available")

**Solution**: 
- Check `config.js` and `src/config.js` have the correct structure
- Run the workflow manually to generate Chapter 1
- Clear browser cache and reload

### All Novels Using Same Gist

**Problem**: Each novel should use a different Gist.

**Solution**: 
- Verify `WEREWOLF_GIST_ID` secret is different from `GIST_ID` and `STRANGER_GIST_ID`
- Check the workflow logs to confirm it's using the correct Gist ID

### Chapter Generation Fails

Check these common issues:
1. Gemini API key is valid and has quota
2. Gist token has correct permissions
3. Gist is public (not secret)
4. Series bible and outline files exist

## Testing Locally

To test the novel generation locally:

```bash
# Set environment variables
export GEMINI_API_KEY="your-key"
export GIST_TOKEN="your-token"
export WEREWOLF_GIST_ID="your-gist-id"

# Run the script
python3 scripts/werewolf-novel/werewolf_novel_daily_to_gist.py
```

To test the UI locally:

```bash
# Navigate to repository
cd /path/to/rabbit

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

You should see all three novels on the home page.

## API Costs

All novels share the same Gemini API key, so costs accumulate:

- **Per novel**: ~2 API calls per day (chapter + summary)
- **All three novels**: ~6 API calls per day
- **Monthly**: ~180 API calls (for all novels)

Chapters are longer for this novel (2,500-3,000 words vs ~2,000 words), which may use slightly more tokens.

Check [Google AI pricing](https://ai.google.dev/pricing) for current rates.

## Novel Completion

When the novel reaches Chapter 25 and is complete:

1. **Update chapters.json**: Set the `completed` field to `true` in:
   - `docs/werewolf-novel/chapters.json`
   
2. **Disable the Cron Job**: Update `.github/workflows/daily-werewolf-novel.yml`:
   ```yaml
   on:
     # schedule:
     #   - cron: '0 12 * * *'
     workflow_dispatch:  # Keep manual trigger for debugging
   ```

3. **Effects**:
   - A "— The End —" indicator will appear at the end of the final chapter
   - No more chapters will be generated automatically

## Support

For issues or questions:
1. Check the Actions log for detailed error messages
2. Review the troubleshooting section above
3. Verify all secrets are correctly configured
4. Ensure the Gist is public and accessible
5. Open an issue in the repository if problems persist

## Summary

- ✅ One new secret: `WEREWOLF_GIST_ID`
- ✅ Two reused secrets: `GEMINI_API_KEY`, `GIST_TOKEN`
- ✅ New workflow runs at 12:00 UTC daily
- ✅ Separate Gist for separate novel content
- ✅ All three novels appear in the same UI
- ✅ Click a novel card to read chapters
- ✅ 25 chapters total (~500-600 pages)
- ✅ Contemporary romance style with fantasy elements
- ✅ Passionate werewolf romance with complete devotion
