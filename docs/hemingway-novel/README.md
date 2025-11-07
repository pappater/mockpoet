# The Sun Also Rises Again - Hemingway-Style Novel

This directory contains a complete novel written in the style of Ernest Hemingway, generated using Google Gemini AI.

## Overview

The system generates a complete, long-form novel with the following characteristics:
- **Title**: The Sun Also Rises Again
- **Theme**: Love, loss, and the search for meaning in post-war America
- **Style**: Hemingway-influenced minimalist prose
- **Length**: Approximately 200-500 pages (25 chapters)
- **Characteristics**: 
  - Simple, direct sentences
  - Heavy use of dialogue
  - Understated emotion
  - "Iceberg theory" - much left unsaid
  - Focus on concrete details and action

## How It Works

Unlike the daily novel generation scripts, this novel is generated all at once:

1. **Complete Generation**: The script generates all chapters in a single run
2. **Series Bible**: First creates character descriptions, setting, and themes
3. **Outline**: Generates a complete chapter-by-chapter outline
4. **Chapter Generation**: Each chapter is generated sequentially with:
   - Series bible for consistency
   - Story outline for structure
   - Previous chapter summaries for continuity
5. **Publication**: All chapters are uploaded to a single public GitHub Gist

## Directory Structure

```
docs/hemingway-novel/
├── README.md              # This file
├── series_bible.md        # Character descriptions, setting, themes
├── outline.md             # Complete story structure
├── summaries.md           # Chapter-by-chapter summaries
├── continuity_log.txt     # Timestamped generation log
├── chapters.json          # Chapter metadata with Gist URLs for UI
└── chapter_001.md through chapter_025.md  # Novel chapters

scripts/hemingway-novel/
├── hemingway_novel_to_gist.py  # Main generation script
├── requirements.txt            # Python dependencies
└── prompts/
    ├── bible_prompt.txt        # Template for series bible
    ├── outline_prompt.txt      # Template for outline
    ├── chapter_prompt.txt      # Template for chapter generation
    └── summary_prompt.txt      # Template for summary generation
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
   - Create a new **public** gist with placeholder content
   - Copy the Gist ID from the URL

### Configuration Steps

1. **Add Repository Secret**
   
   Navigate to your repository on GitHub:
   - Settings → Secrets and variables → Actions → New repository secret
   
   Add this secret:
   - **Name**: `HEMINGWAY_GIST_ID`  
     **Value**: Your public Gist ID

2. **Ensure Other Required Secrets**
   
   - `GEMINI_API_KEY` - Your Google AI Studio API key
   - `GIST_TOKEN` - Your GitHub Personal Access Token

3. **Run the Generator**
   
   Run the script locally or via workflow:
   
   ```bash
   export GEMINI_API_KEY="your-gemini-api-key"
   export GEMINI_MODEL="gemini-2.5-flash"
   export GIST_TOKEN="your-github-token"
   export HEMINGWAY_GIST_ID="your-gist-id"
   
   python3 scripts/hemingway-novel/hemingway_novel_to_gist.py
   ```

4. **Verify Success**
   
   - Check the script output for completion status
   - Visit your Gist URL
   - You should see:
     - All 25 chapters (chapter_001.md through chapter_025.md)
     - series_bible.md
     - outline.md
     - summaries.md
     - continuity_log.txt
     - chapters.json

5. **Check the UI**
   
   - Visit your deployed site or run locally: `npm run dev`
   - The home page should show "The Sun Also Rises Again"
   - Click to read the complete novel

## Novel Specifications

### Style Characteristics

The novel follows Hemingway's distinctive writing style:

- **Short, Direct Sentences**: No complex clauses
- **Simple Words**: Prefer common, concrete words
- **Heavy Dialogue**: At least 50% of each chapter
- **Understated Emotion**: Show through action, not description
- **Iceberg Theory**: Much implied, little explained
- **Concrete Details**: Specific sensory observations
- **Minimal Adjectives**: Let nouns and verbs do the work

### Structure

- **25 Chapters**: Each 2000-3000 words (8-12 pages)
- **Linear Narrative**: Clear, chronological progression
- **Complete Story**: Beginning, middle, and end
- **All Chapters at Once**: Not generated daily

### chapters.json Format

```json
{
  "novel_title": "The Sun Also Rises Again",
  "total_chapters": 25,
  "last_updated": "2025-11-07 12:00:00 UTC",
  "gist_id": "your-gist-id",
  "completed": true,
  "chapters": [
    {
      "chapter": 1,
      "filename": "chapter_001.md",
      "url": "https://gist.githubusercontent.com/.../chapter_001.md",
      "gist_url": "https://gist.github.com/your-gist-id#chapter_001.md",
      "chapter_name": "Paris"
    }
  ]
}
```

## Testing Locally

To test the generator locally:

```bash
# Install dependencies
pip install -r scripts/hemingway-novel/requirements.txt

# Set environment variables
export GEMINI_API_KEY="your-gemini-api-key"
export GEMINI_MODEL="gemini-2.5-flash"
export GIST_TOKEN="your-github-token"
export HEMINGWAY_GIST_ID="your-gist-id"

# Run the generator
python3 scripts/hemingway-novel/hemingway_novel_to_gist.py
```

**Note**: Generating 25 chapters will take significant time (approximately 1-2 hours depending on API speed).

## Customization

### Adjusting Chapter Count

Edit `scripts/hemingway-novel/hemingway_novel_to_gist.py`:

```python
TOTAL_CHAPTERS = 30  # Change from 25 to desired number
```

### Modifying Theme

Edit the same file:

```python
THEME = "Your new theme here"
```

### Adjusting Style Prompts

Edit the prompt files in `scripts/hemingway-novel/prompts/`:
- `bible_prompt.txt` - Character and setting generation
- `outline_prompt.txt` - Story structure
- `chapter_prompt.txt` - Individual chapter generation
- `summary_prompt.txt` - Chapter summaries

## Troubleshooting

### Novel Not Generated

Common issues:
- Missing or invalid `HEMINGWAY_GIST_ID`
- Invalid `GEMINI_API_KEY` or quota exceeded
- Gist is set to secret instead of public
- Script timeout (too many chapters)

### UI Not Showing Novel

1. Verify `chapters.json` exists in `docs/hemingway-novel/`
2. Check that the Gist ID is set in `config.js` and `src/config.js`
3. Ensure the Gist is public
4. Clear browser cache and reload

### Style Not Matching Hemingway

The AI attempts to emulate Hemingway's style but results may vary:
- Prompts emphasize key characteristics
- Some variation is expected
- Consider regenerating specific chapters
- Adjust prompts in `scripts/hemingway-novel/prompts/` if needed

## Differences from Daily Novels

Unlike the daily novel generation scripts:

1. **Complete at Once**: All chapters generated in one run
2. **No Cron Job**: Manual execution, not scheduled
3. **Marked as Complete**: `completed: true` in chapters.json
4. **Different Style**: Hemingway instead of Dostoevsky
5. **Fixed Length**: 25 chapters predetermined

## Maintenance

### Regenerating the Novel

To regenerate the entire novel:

1. Delete or backup existing Gist files
2. Run the script again with same environment variables
3. All chapters will be regenerated with new content

### Updating Config

After generation, ensure `config.js` and `src/config.js` have correct Gist ID:

```javascript
sun_also_rises_again: {
  title: "The Sun Also Rises Again",
  gist: {
    username: 'pappater',
    id: 'your-actual-gist-id'
  },
  localPath: 'docs/hemingway-novel'
}
```

## Resources

- [ENVIRONMENT_VARIABLES.md](../../ENVIRONMENT_VARIABLES.md) - Secret configuration
- [Main README](../../README.md) - Overall project documentation
- [Hemingway's Writing Style](https://en.wikipedia.org/wiki/Ernest_Hemingway#Writing_style) - Reference

## Support

If you encounter issues:
1. Check the script output for specific error messages
2. Review the [Troubleshooting](#troubleshooting) section
3. Verify all environment variables are set correctly
4. Ensure Python dependencies are installed
5. Check Gemini API quota and rate limits
