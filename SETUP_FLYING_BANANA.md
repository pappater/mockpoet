# Setup Guide: Flying Banana Short Story Collection

This guide walks through setting up the Flying Banana short story collection feature.

## Overview

**Flying Banana** is a collection of AI-generated short stories, each written in the distinctive style of a randomly selected modern classic author. Each day, a new 5,000-7,500 word story is published to a GitHub Gist, emulating authors like Hemingway, Camus, García Márquez, and 22 others.

## Prerequisites

Before starting, ensure you have:
- A GitHub account
- A Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
- A GitHub Personal Access Token with `gist` scope

## Setup Steps

### 1. Create a New GitHub Gist

1. Go to [gist.github.com](https://gist.github.com)
2. Click "Create a new gist"
3. For the filename, enter: `README.md`
4. For the content, add:
   ```markdown
   # Flying Banana - Short Story Collection
   
   A collection of AI-generated short stories in the styles of modern classic authors.
   
   Stories generated daily by the mockpoet platform.
   ```
5. Make sure it's set to **Public** (not Secret)
6. Click "Create public gist"
7. Copy the Gist ID from the URL
   - URL format: `https://gist.github.com/username/abc123def456`
   - Copy the ID part: `abc123def456`

### 2. Add GitHub Secret

1. Go to your repository's Settings
2. Navigate to **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `FLYING_BANANA_GIST_ID`
5. Value: Paste the Gist ID you copied
6. Click **Add secret**

### 3. Verify Other Required Secrets

Ensure these secrets are also set:
- `GEMINI_API_KEY` - Your Google Gemini API key
- `GIST_TOKEN` - GitHub Personal Access Token with gist scope

### 4. Update Configuration (Optional)

The Flying Banana configuration files can be customized:

#### Author List (`scripts/flying-banana/authors.json`)

To add or remove authors:
```json
{
  "authors": [
    "Ernest Hemingway",
    "Albert Camus",
    "Your New Author Here"
  ]
}
```

#### Word Count Range (`scripts/flying-banana/config.json`)

To adjust story length:
```json
{
  "min_word_count": 5000,
  "max_word_count": 7500
}
```

### 5. Trigger Initial Story Generation

1. Go to the **Actions** tab in your repository
2. Select **"Daily Flying Banana Short Story to Gist"** workflow
3. Click **"Run workflow"**
4. Select the branch and click **"Run workflow"**

This will:
- Generate the first short story
- Select a random author style
- Publish to your Gist
- Update `chapters.json`
- Update config files with the Gist ID

### 6. Verify the Setup

1. Check the Actions run completed successfully
2. Visit your Gist to see the first story:
   - `https://gist.github.com/username/YOUR_GIST_ID`
3. Look for files:
   - `story_001.md` - First short story
   - `chapters.json` - Story metadata

### 7. Check the UI

1. Visit your deployed site or run locally: `npm run dev`
2. The home page should show "Flying Banana" with "1 Short Story Available"
3. Click on Flying Banana to read the story

## Daily Generation Schedule

Once set up, the workflow runs automatically:
- **Frequency**: Daily at 13:00 UTC
- **Workflow**: `.github/workflows/daily-flying-banana.yml`
- **Action**: Generates and publishes one new short story

## File Structure

```
mockpoet/
├── .github/workflows/
│   └── daily-flying-banana.yml      # Daily workflow
├── docs/flying-banana/
│   ├── README.md                     # Documentation
│   └── chapters.json                 # Story metadata
├── public/docs/flying-banana/
│   └── chapters.json                 # Deployed metadata
└── scripts/flying-banana/
    ├── authors.json                  # Author list (configurable)
    ├── config.json                   # Word count config
    ├── flying_banana_daily_to_gist.py # Generation script
    ├── requirements.txt              # Python dependencies
    └── prompts/
        └── story_prompt.txt          # AI prompt template
```

## Configuration Details

### Authors List

25 modern classic authors are available by default:

- Ernest Hemingway
- Albert Camus
- William Faulkner
- Gabriel García Márquez
- Toni Morrison
- John Steinbeck
- Hermann Hesse
- T.S. Eliot
- Samuel Beckett
- Pablo Neruda
- José Saramago
- Doris Lessing
- Kazuo Ishiguro
- Thomas Mann
- Naguib Mahfouz
- W. B. Yeats
- V. S. Naipaul
- Aleksandr Solzhenitsyn
- Alice Munro
- Knut Hamsun
- Rabindranath Tagore
- Gao Xingjian
- Wole Soyinka
- Czesław Miłosz
- J. M. Coetzee

### Story Specifications

- **Length**: 5,000-7,500 words per story
- **Style**: Varies by randomly selected author
- **Format**: Complete standalone narratives
- **Metadata**: Each story includes:
  - Story title
  - Author style attribution
  - Publication date and time (UTC)

### chapters.json Format

```json
{
  "novel_title": "Flying Banana",
  "total_chapters": 3,
  "last_updated": "2025-11-05 16:00:00 UTC",
  "gist_id": "abc123def456",
  "completed": false,
  "chapters": [
    {
      "chapter": 1,
      "filename": "story_001.md",
      "url": "https://gist.githubusercontent.com/.../story_001.md",
      "gist_url": "https://gist.github.com/abc123def456#story_001.md",
      "chapter_name": "The Last Sunset",
      "published_date": "2025-11-05 13:00:00 UTC"
    }
  ]
}
```

## Testing Locally

To test the story generator locally:

```bash
# Set environment variables
export GEMINI_API_KEY="your-gemini-api-key"
export GEMINI_MODEL="gemini-2.5-flash"
export GIST_TOKEN="your-github-token"
export FLYING_BANANA_GIST_ID="your-gist-id"

# Install dependencies
pip install -r scripts/flying-banana/requirements.txt

# Run the generator
python3 scripts/flying-banana/flying_banana_daily_to_gist.py
```

## Customization Ideas

### Adding New Authors

1. Edit `scripts/flying-banana/authors.json`
2. Add author names to the array
3. Commit and push changes
4. New authors will be included in random selection

### Adjusting Story Length

1. Edit `scripts/flying-banana/config.json`
2. Modify `min_word_count` and `max_word_count`
3. Commit and push changes
4. Future stories will use the new length range

### Changing Generation Schedule

1. Edit `.github/workflows/daily-flying-banana.yml`
2. Modify the cron schedule:
   ```yaml
   schedule:
     - cron: '0 13 * * *'  # 13:00 UTC daily
   ```
3. Commit and push changes

## Troubleshooting

### Story Not Generated

Check the workflow logs:
1. Go to Actions tab
2. Click the failed workflow run
3. Review error messages

Common issues:
- Missing or invalid `FLYING_BANANA_GIST_ID`
- Invalid `GEMINI_API_KEY` or quota exceeded
- Gist is set to secret instead of public

### UI Not Showing Flying Banana

1. Verify `chapters.json` exists in `docs/flying-banana/`
2. Check that the Gist ID is set in `config.js` and `src/config.js`
3. Ensure the Gist is public
4. Clear browser cache and reload

### Author Style Not Working Well

The AI attempts to emulate author styles, but results may vary. If stories don't match expectations:
- Try running again (different stories may be better)
- Consider adjusting the prompt template in `scripts/flying-banana/prompts/story_prompt.txt`
- Some authors' styles may be more challenging for AI to replicate

## Maintenance

### Disabling Daily Generation

To pause automatic story generation:

1. Edit `.github/workflows/daily-flying-banana.yml`
2. Comment out the schedule:
   ```yaml
   on:
     # schedule:
     #   - cron: '0 13 * * *'
     workflow_dispatch:  # Keep manual trigger
   ```
3. Commit and push

Stories can still be generated manually via workflow dispatch.

### Backing Up Stories

All stories are stored in the GitHub Gist and automatically backed up by GitHub. For additional backup:
- Fork or clone the Gist
- Download stories manually from the Gist
- The local `docs/flying-banana/chapters.json` tracks all story metadata

## Next Steps

After setup is complete:
1. Monitor the first few daily runs to ensure everything works
2. Read and enjoy the generated stories
3. Customize author list or word count as desired
4. Share the collection with readers

## Resources

- [Flying Banana README](docs/flying-banana/README.md) - Detailed documentation
- [Environment Variables Guide](ENVIRONMENT_VARIABLES.md) - Secret configuration
- [Main README](README.md) - Overall project documentation

## Support

If you encounter issues not covered in this guide:
1. Check the Actions workflow logs for errors
2. Review the [Troubleshooting](#troubleshooting) section
3. Verify all environment variables are set correctly
4. Ensure Python dependencies are installed
