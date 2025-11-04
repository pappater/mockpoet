# Daily Gemini Novel to Public Gist - The Indifferent Shore

This directory contains the seed files and documentation for an automated daily novel-writing pipeline that uses Google Gemini AI to generate one chapter per day in the style of Albert Camus' "The Stranger."

## Overview

The system generates a continuous, long-form novel with the following characteristics:
- **Theme**: Absurdism, existentialism, and the indifference of the universe
- **Style**: Camus-influenced existentialist prose with focus on sensory detail
- **Frequency**: One chapter per day
- **Output**: All chapters and canon files published to a single public GitHub Gist

## How It Works

1. **Daily Workflow**: A GitHub Actions workflow runs once per day (or can be triggered manually)
2. **Chapter Generation**: The script uses Google Gemini AI to generate a new chapter based on:
   - Series bible (characters, setting, themes)
   - Story outline
   - Previous chapter summaries
   - Continuity log
3. **Continuity Maintenance**: After generating each chapter, the script:
   - Creates a summary for continuity
   - Updates the continuity log
   - Updates the summaries file
4. **Publication**: All outputs are uploaded to a single public GitHub Gist for easy reading and sharing

## Directory Structure

```
docs/stranger-novel/
├── README.md              # This file
├── series_bible.md        # Character descriptions, setting, themes
├── outline.md             # Story structure and planned chapters
├── summaries.md           # Chapter-by-chapter summaries
├── continuity_log.txt     # Timestamped log of chapter generation
└── chapters.json          # Chapter mapping with Gist URLs for UI display

scripts/stranger-novel/
├── stranger_novel_daily_to_gist.py  # Main script
├── requirements.txt       # Python dependencies
└── prompts/
    ├── chapter_prompt.txt # Template for chapter generation
    └── summary_prompt.txt # Template for summary generation

.github/workflows/
└── daily-stranger-novel.yml   # GitHub Actions workflow
```

## Setup Instructions

### Prerequisites

1. **Google AI Studio API Key**
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

### Configuration Steps

1. **Add Repository Secrets**
   
   Navigate to your repository on GitHub:
   - Settings → Secrets and variables → Actions → New repository secret
   
   Add these three secrets:
   - **Name**: `GEMINI_API_KEY`  
     **Value**: Your Google AI Studio API key
   
   - **Name**: `GIST_TOKEN`  
     **Value**: Your GitHub Personal Access Token
   
   - **Name**: `STRANGER_GIST_ID`  
     **Value**: Your public Gist ID (different from the main novel's gist)

2. **Update config.js**
   
   Add configuration for the new novel in `config.js`:
   ```javascript
   novels: {
     weight_of_promises: {
       title: "The Weight of Promises",
       gistId: "51893c25959355bda1884804375ec3d8",
       localPath: "docs/novel-gist"
     },
     indifferent_shore: {
       title: "The Indifferent Shore",
       gistId: "YOUR_STRANGER_GIST_ID",
       localPath: "docs/stranger-novel"
     }
   }
   ```

3. **Initial Run**
   
   After adding the secrets, manually trigger the first run:
   - Go to Actions tab in your repository
   - Select "Daily Stranger Novel Chapter to Gist" workflow
   - Click "Run workflow" button
   - Select the branch and click "Run workflow"

4. **Verify Success**
   
   - Check the Actions tab for the workflow run status
   - Once complete, visit your Gist URL
   - You should see:
     - `chapter_001.md` (the first chapter)
     - `series_bible.md` (character and setting info)
     - `outline.md` (story structure)
     - `summaries.md` (updated with chapter 1 summary)
     - `continuity_log.txt` (updated with chapter 1 entry)
     - `chapters.json` (chapter index with URLs for UI integration)

### Ongoing Use

After the initial setup:
- The workflow will run automatically every day at 11:00 UTC (different from main novel)
- Each run generates the next chapter in sequence
- All files are updated in the same Gist
- No manual intervention is required

You can also trigger runs manually at any time from the Actions tab.

## Environment Variables Reference

For the Stranger Novel workflow, you need:
- `GEMINI_API_KEY`: Your Google Gemini API key (shared with other novel)
- `GEMINI_MODEL`: Model to use (default: gemini-2.5-flash) (shared)
- `GIST_TOKEN`: Your GitHub personal access token with gist scope (shared)
- `STRANGER_GIST_ID`: The Gist ID for The Indifferent Shore novel (unique to this novel)

## Customization

### Modifying the Story

You can customize the novel by editing these seed files:

- **series_bible.md**: Change characters, setting, or themes
- **outline.md**: Adjust the story structure and planned chapters
- **prompts/chapter_prompt.txt**: Modify the AI generation instructions
- **prompts/summary_prompt.txt**: Adjust summary generation

After making changes, commit them to the repository. The next workflow run will use the updated files.

### Changing the Schedule

Edit `.github/workflows/daily-stranger-novel.yml` and modify the `cron` schedule:

```yaml
schedule:
  - cron: '0 11 * * *'  # Daily at 11:00 UTC
```

### Theme and Style

To change the novel's theme, edit the `THEME` variable in `scripts/stranger-novel/stranger_novel_daily_to_gist.py`:

```python
THEME = "Absurdism, existentialism, and the indifference of the universe"
```

Also update the series bible and prompts to reflect the new theme.

## Differences from The Weight of Promises

This novel differs in:
- **Style**: Camus-inspired existentialism vs. Dostoevsky-inspired psychological realism
- **Tone**: Detached and observational vs. deeply introspective
- **Themes**: Absurdism and indifference vs. debt and moral obligation
- **Narrative Voice**: First-person present tense vs. third-person past tense
- **Prose Style**: Simple, declarative vs. rich, philosophical
- **Gist ID**: Separate gist for separation of content
- **Schedule**: Runs at different time (11:00 UTC vs 10:00 UTC)

## Troubleshooting

### Workflow Fails with "ERROR: STRANGER_GIST_ID environment variable not set"
- Verify that you added the `STRANGER_GIST_ID` secret in repository settings
- Check that the secret name is exactly `STRANGER_GIST_ID` (case-sensitive)
- Ensure it's a different Gist ID from the main novel

### Other Issues
See the main novel's README.md for common troubleshooting steps, as most issues are similar.

## License

This novel generation system is part of the rabbit repository. The generated novel content is created by AI and may have its own considerations for use and attribution.
