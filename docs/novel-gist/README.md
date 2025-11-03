# Daily Gemini Novel to Public Gist

This directory contains the seed files and documentation for an automated daily novel-writing pipeline that uses Google Gemini AI to generate one chapter per day in a Dostoevsky-like literary style.

## Overview

The system generates a continuous, long-form novel with the following characteristics:
- **Theme**: Debt, mercy, and the burden of promises
- **Style**: Dostoevsky-influenced psychological realism
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
5. **Automatic Completion**: When the final chapter is generated:
   - The script appends "**THE END**" to the last chapter
   - A completion marker file (`.novel_complete`) is created
   - Future cron jobs will exit early without generating new chapters

## Directory Structure

```
docs/novel-gist/
├── README.md              # This file
├── series_bible.md        # Character descriptions, setting, themes
├── outline.md             # Story structure and planned chapters
├── summaries.md           # Chapter-by-chapter summaries
├── continuity_log.txt     # Timestamped log of chapter generation
└── chapters.json          # Chapter mapping with Gist URLs for UI display

scripts/novel/
├── novel_daily_to_gist.py # Main script
├── requirements.txt       # Python dependencies
└── prompts/
    ├── chapter_prompt.txt # Template for chapter generation
    └── summary_prompt.txt # Template for summary generation

.github/workflows/
└── daily-novel-gist.yml   # GitHub Actions workflow
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
   
   - **Name**: `GIST_ID`  
     **Value**: Your public Gist ID

2. **Initial Run**
   
   After adding the secrets, manually trigger the first run:
   - Go to Actions tab in your repository
   - Select "Daily Gemini Novel Chapter to Gist" workflow
   - Click "Run workflow" button
   - Select the branch and click "Run workflow"

3. **Verify Success**
   
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
- The workflow will run automatically every day at 10:00 UTC
- Each run generates the next chapter in sequence
- All files are updated in the same Gist
- No manual intervention is required

You can also trigger runs manually at any time from the Actions tab.

## Customization

### Modifying the Story

You can customize the novel by editing these seed files:

- **series_bible.md**: Change characters, setting, or themes
- **outline.md**: Adjust the story structure and planned chapters
- **prompts/chapter_prompt.txt**: Modify the AI generation instructions
- **prompts/summary_prompt.txt**: Adjust summary generation

After making changes, commit them to the repository. The next workflow run will use the updated files.

### Changing the Schedule

Edit `.github/workflows/daily-novel-gist.yml` and modify the `cron` schedule:

```yaml
schedule:
  - cron: '0 10 * * *'  # Daily at 10:00 UTC
```

### Setting the Total Number of Chapters

The novel is configured to generate a specific number of chapters (default: 16). To change this:

Edit `.github/workflows/daily-novel-gist.yml` and modify the `TOTAL_CHAPTERS` environment variable:

```yaml
env:
  TOTAL_CHAPTERS: 16  # Change to your desired total
```

Or set it as a repository secret for more flexibility.

When the script generates the final chapter:
- It will automatically append "**THE END**" to the chapter
- A completion marker file will be created
- Future runs will exit early without generating new content

### Theme and Style

To change the novel's theme, edit the `THEME` variable in `scripts/novel/novel_daily_to_gist.py`:

```python
THEME = "Your new theme here"
```

Also update the series bible and prompts to reflect the new theme.

## Troubleshooting

### Workflow Fails with "ERROR: GEMINI_API_KEY environment variable not set"
- Verify that you added the `GEMINI_API_KEY` secret in repository settings
- Check that the secret name is exactly `GEMINI_API_KEY` (case-sensitive)

### Workflow Fails with "ERROR: GIST_TOKEN environment variable not set"
- Verify that you added the `GIST_TOKEN` secret
- Ensure your Personal Access Token has the `gist` scope

### Workflow Fails with "ERROR: GIST_ID environment variable not set"
- Verify that you added the `GIST_ID` secret
- Double-check that the Gist ID is correct

### Chapter Generation Fails
- Check the Actions log for specific error messages
- Verify that your Gemini API key is valid and has quota remaining
- Ensure the Gist is public (not secret)

### Continuity Issues
- The system maintains continuity through summaries and the continuity log
- If you need to regenerate a chapter, you may need to manually update the summaries file
- The chapter number is determined by checking what chapter files exist in the Gist
- If you delete all gist files, the next run will generate Chapter 1

### Novel Completion
- Once the final chapter is generated, a `.novel_complete` marker file is created
- The workflow will continue to run on schedule but will exit immediately
- To restart or extend the novel:
  - Delete the `.novel_complete` file from `docs/novel-gist/`
  - Increase the `TOTAL_CHAPTERS` value in the workflow
  - The next run will generate the next chapter
- The completion marker prevents accidental generation of extra chapters

### Using chapters.json for UI Integration
- The `chapters.json` file is automatically generated and updated with each chapter
- It contains a complete index of all chapters with their Gist URLs
- Perfect for displaying a table of contents in a UI
- Structure:
  ```json
  {
    "novel_title": "The Weight of Promises",
    "total_chapters": 3,
    "last_updated": "2025-11-02 21:56:30 UTC",
    "gist_id": "your-gist-id",
    "chapters": [
      {
        "chapter": 1,
        "filename": "chapter_001.md",
        "url": "https://gist.githubusercontent.com/.../chapter_001.md",
        "gist_url": "https://gist.github.com/your-gist-id#chapter_001.md"
      }
    ]
  }
  ```

## API Costs

- **Google Gemini API**: Check [Google AI pricing](https://ai.google.dev/pricing) for current rates
  - The script uses `gemini-pro` model
  - Each chapter generation makes 2 API calls (chapter + summary)
  - Estimated cost per chapter: varies by model pricing
- **GitHub Gist API**: Free for public gists

## Security Notes

- Never commit API keys or tokens directly to the repository
- Always use GitHub Secrets for sensitive credentials
- The Gist must be public for this workflow (secret gists require different authentication)
- Regularly rotate your API keys and tokens as a security best practice

## License

This novel generation system is part of the rabbit repository. The generated novel content is created by AI and may have its own considerations for use and attribution.

## Support

For issues or questions:
1. Check the Actions log for detailed error messages
2. Verify all secrets are correctly configured
3. Review the troubleshooting section above
4. Open an issue in the repository if problems persist
