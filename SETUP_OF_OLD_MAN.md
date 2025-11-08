# Setup Guide: Of Old Man Poetry Collection

This guide covers the setup process for the "Of Old Man" poetry collection, which generates poems twice daily in various poetry forms.

## Overview

"Of Old Man" is a poetry collection that:
- Generates **two poems per day** (at 10:00 UTC and 22:00 UTC)
- Randomly selects from **91 different poetry types** for each poem
- Uses Google Gemini AI for poem generation
- Stores poems in a GitHub Gist
- Never completes - continues indefinitely

## Prerequisites

Before setting up, ensure you have:
1. A GitHub account
2. A Google Cloud account with Gemini API access
3. GitHub repository secrets configured

## Step 1: Create a GitHub Gist

1. Go to https://gist.github.com
2. Create a new **public** gist
3. Give it a description: "Of Old Man - Poem Collection"
4. Add an initial file (e.g., `README.md`) with some content
5. Save the gist
6. Copy the **Gist ID** from the URL (the long alphanumeric string)

## Step 2: Add Repository Secrets

Add the following secrets to your GitHub repository:

### Required Secrets

1. **OF_OLD_MAN_GIST_ID**
   - Value: The Gist ID from Step 1
   - Used to: Identify which gist to update with new poems

2. **GEMINI_API_KEY** (if not already set)
   - Value: Your Google Gemini API key
   - Used to: Generate poems using AI
   - Get it from: https://aistudio.google.com/app/apikey

3. **GIST_TOKEN** (if not already set)
   - Value: GitHub Personal Access Token with `gist` scope
   - Used to: Update gists programmatically
   - Create at: https://github.com/settings/tokens

### How to Add Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with its name and value
5. Click **Add secret**

## Step 3: Verify Configuration

The configuration files should already be set up in the repository:

### Config Files
- `config.js` - Contains empty gist ID (will be filled by workflow)
- `src/config.js` - Contains empty gist ID (will be filled by workflow)
- `scripts/of-old-man/poetry_types.json` - List of 91 poetry types
- `scripts/of-old-man/config.json` - Generation configuration

### Workflow File
- `.github/workflows/hourly-of-old-man.yml` - Runs twice daily (10:00 UTC and 22:00 UTC)

## Step 4: Manual First Run (Optional)

To test the setup before waiting for the scheduled cron:

1. Go to **Actions** tab in your repository
2. Select **Twice Daily Of Old Man Poem to Gist** workflow
3. Click **Run workflow** → **Run workflow**
4. Wait for the workflow to complete
5. Check the gist to see the first poem

## Step 5: Verify Setup

After the first run (manual or automatic), verify:

1. **Gist contains**:
   - `poem_001.md` - First generated poem
   - `chapters.json` - Index of all poems

2. **Repository contains**:
   - Updated `config.js` with gist ID
   - Updated `src/config.js` with gist ID
   - Updated `docs/of-old-man/chapters.json`
   - Updated `public/docs/of-old-man/chapters.json`

3. **Website displays**:
   - "Of Old Man" on the home page
   - Correct poem count
   - Poems can be read

## Poetry Types

The collection uses 91 different poetry types, including:

### Classical Forms
- Sonnet, Haiku, Villanelle, Sestina, Ballad, Ode, Elegy, Epic

### Modern Styles
- Free verse, Slam poetry, Spoken word, Performance poem, Confessional poem

### Specialized Forms
- Ghazal, Pantoum, Terza rima, Rondeau, Tanka, Senryu, Sijo

### All 91 Types
See `scripts/of-old-man/poetry_types.json` for the complete list.

## Workflow Schedule

The workflow runs:
- **Schedule**: Twice daily (cron: `0 10,22 * * *`) at 10:00 UTC and 22:00 UTC
- **Manual**: Can be triggered via workflow_dispatch

### Expected Generation Times
- Two poems per day
- 14 poems per week
- ~60 poems per month

## File Structure

```
mockpoet/
├── .github/workflows/
│   └── hourly-of-old-man.yml      # Twice daily workflow
├── docs/of-old-man/
│   ├── README.md                   # Collection documentation
│   └── chapters.json               # Poem index
├── public/docs/of-old-man/
│   └── chapters.json               # Public copy for deployment
├── scripts/of-old-man/
│   ├── of_old_man_daily_to_gist.py # Generation script
│   ├── poetry_types.json           # List of poetry types
│   ├── config.json                 # Configuration
│   ├── requirements.txt            # Python dependencies
│   └── prompts/
│       └── poem_prompt.txt         # Prompt template
└── SETUP_OF_OLD_MAN.md            # This file
```

## Customization

### Modifying Poetry Types

To add or remove poetry types:

1. Edit `scripts/of-old-man/poetry_types.json`
2. Add/remove poetry types from the `poetry_types` array
3. Commit and push changes
4. New poems will use the updated list

### Changing Generation Prompt

To modify how poems are generated:

1. Edit `scripts/of-old-man/prompts/poem_prompt.txt`
2. Update the prompt template
3. Commit and push changes
4. New poems will use the updated prompt

### Adjusting Schedule

To change the generation frequency:

1. Edit `.github/workflows/hourly-of-old-man.yml`
2. Modify the cron schedule (e.g., `0 10 * * *` for daily at 10:00 UTC, or `0 */6 * * *` for every 6 hours)
3. Commit and push changes

## Troubleshooting

### No Poems Generated

- Check GitHub Actions workflow runs for errors
- Verify all secrets are correctly set
- Check API quotas for Gemini API

### Gist Not Updating

- Verify GIST_TOKEN has correct permissions
- Check OF_OLD_MAN_GIST_ID is correct
- Ensure gist is public

### Config Files Not Updated

- The workflow automatically updates config files on first run
- If missing, manually add the gist ID to config.js files

## Maintenance

### Monitoring
- Check GitHub Actions for workflow status
- Review gist regularly for new poems
- Monitor API usage for Gemini API

### Backups
- Poems are stored in GitHub Gist (backed up by GitHub)
- `chapters.json` is versioned in the repository
- No additional backups needed

## Support

For issues or questions:
1. Check GitHub Actions logs
2. Review this setup guide
3. Open an issue in the repository

## Related Documentation

- [Main README](README.md) - Project overview
- [Environment Variables](ENVIRONMENT_VARIABLES.md) - All environment variables
- [docs/of-old-man/README.md](docs/of-old-man/README.md) - Collection details
