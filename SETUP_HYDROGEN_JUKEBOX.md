# Setup Guide: Hydrogen Jukebox Poetry Collection

This guide walks through setting up the Hydrogen Jukebox poetry collection feature.

## Overview

**Hydrogen Jukebox** is a collection of AI-generated poems, each written in the distinctive style of a randomly selected modern classic poet. Each day, a new poem is published to a GitHub Gist, emulating poets like W. B. Yeats, Robert Frost, T. S. Eliot, Sylvia Plath, and 25 others.

Unlike novels or short stories, poems follow the natural length and form of each poet's style - they can be short lyrics, long narratives, or anything in between.

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
   # Hydrogen Jukebox - Poetry Collection
   
   A collection of AI-generated poems in the styles of modern classic poets.
   
   Poems generated daily by the rabbit platform.
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
4. Name: `HYDROGEN_JUKEBOX_GIST_ID`
5. Value: Paste the Gist ID you copied
6. Click **Add secret**

### 3. Verify Other Required Secrets

Ensure these secrets are also set:
- `GEMINI_API_KEY` - Your Google Gemini API key
- `GIST_TOKEN` - GitHub Personal Access Token with gist scope

If these aren't set, see the main [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) guide.

### 4. Update Configuration Files (Optional)

The configuration files should already be updated with the new book entry. Verify:

**In `config.js` and `src/config.js`:**
```javascript
hydrogen_jukebox: {
  title: "Hydrogen Jukebox",
  gist: {
    username: 'pappater',
    id: ''  // Will be set via HYDROGEN_JUKEBOX_GIST_ID secret by GitHub Actions workflow
  },
  localPath: 'docs/hydrogen-jukebox',
  type: 'poems'  // Flag to indicate this is a poem collection
}
```

### 5. Run the Workflow Manually

1. Go to the **Actions** tab in your repository
2. Select **Daily Hydrogen Jukebox Poem to Gist** from the workflows list
3. Click **Run workflow**
4. Select the branch (usually `main`)
5. Click **Run workflow**

### 6. Verify the Results

After the workflow completes (usually 1-2 minutes):

1. Check your Gist at: `https://gist.github.com/username/GIST_ID`
   - You should see `poem_001.md` with the first poem
   - You should see `chapters.json` with metadata
2. Check the repository:
   - `docs/hydrogen-jukebox/chapters.json` should be updated
   - `public/docs/hydrogen-jukebox/chapters.json` should be synced
3. Visit your deployed site's home page
   - You should see "Hydrogen Jukebox" as a new book card
   - It should show "1 Poem Available"

## Poet List

The current list of poets (configurable in `scripts/hydrogen-jukebox/poets.json`):

- W. B. Yeats
- Robert Frost
- Rainer Maria Rilke
- Wallace Stevens
- William Carlos Williams
- Ezra Pound
- T. S. Eliot
- Edith Södergran
- E. E. Cummings
- Federico García Lorca
- Langston Hughes
- Pablo Neruda
- W. H. Auden
- Elizabeth Bishop
- Dylan Thomas
- Octavio Paz
- Gwendolyn Brooks
- Robert Lowell
- Philip Larkin
- Allen Ginsberg
- James Wright
- Maya Angelou
- Adrienne Rich
- Sylvia Plath
- Seamus Heaney
- Walt Whitman
- Jack Kerouac
- Bob Dylan (Musician/Lyricist)
- Rimbaud

### Adding or Removing Poets

To modify the poet list:

1. Edit `scripts/hydrogen-jukebox/poets.json`
2. Add or remove poets from the `"poets"` array
3. Commit and push your changes
4. Future poems will use the updated list

## Schedule

The workflow runs daily at **14:00 UTC** (2:00 PM UTC), avoiding conflicts with other book generation workflows.

To change the schedule:
1. Edit `.github/workflows/daily-hydrogen-jukebox.yml`
2. Modify the cron expression: `cron: '0 14 * * *'`
3. Commit and push

## Poem Structure

Each poem includes:
- Title (in the poet's style)
- Poem content (natural length for the poet's style)
- Metadata comments:
  - `<!-- Poet Style: [Poet Name] -->`
  - `<!-- Published: [Date and Time] -->`

Example in `chapters.json`:
```json
{
  "chapter": 1,
  "filename": "poem_001.md",
  "url": "https://gist.githubusercontent.com/...",
  "gist_url": "https://gist.github.com/...",
  "chapter_name": "The Title of the Poem",
  "published_date": "2025-11-05 14:00:00 UTC",
  "poet": "Robert Frost"
}
```

## Troubleshooting

### Workflow fails with "HYDROGEN_JUKEBOX_GIST_ID environment variable not set"

The secret isn't configured. Follow step 2 above to add it.

### Gist is created but not visible on the website

1. Verify the Gist is **Public** (not Secret)
2. Check that `chapters.json` was updated in both `docs/` and `public/docs/`
3. Rebuild and redeploy your site

### Poems seem too long or too short

This is expected! Poems naturally vary in length based on the poet's style:
- E. E. Cummings might write a brief, experimental piece
- Walt Whitman might write a long, sweeping narrative
- The AI adapts to each poet's characteristic form and length

### Want to generate a poem on-demand?

Use the manual workflow trigger:
1. Go to **Actions** → **Daily Hydrogen Jukebox Poem to Gist**
2. Click **Run workflow**
3. Select branch and run

## Integration with UI

The Hydrogen Jukebox collection integrates seamlessly with the existing UI:

- **Home Page**: Shows "N Poems Available" (instead of chapters or stories)
- **Reader Page**: Works with existing reader component (treats poems as "chapters")
- **Type Detection**: Automatically detected via `type: 'poems'` flag

## Local Development

To test poem generation locally:

```bash
# Set environment variables
export GEMINI_API_KEY="your-gemini-api-key"
export GEMINI_MODEL="gemini-2.5-flash"
export GIST_TOKEN="your-github-token"
export HYDROGEN_JUKEBOX_GIST_ID="your-hydrogen-jukebox-gist-id"

# Install Python dependencies
pip install -r scripts/hydrogen-jukebox/requirements.txt

# Run the script
python3 scripts/hydrogen-jukebox/hydrogen_jukebox_daily_to_gist.py
```

## What Makes It Different

**Hydrogen Jukebox** differs from other collections:

1. **Poems, not prose**: Each piece is poetry, not narrative fiction
2. **No word count limits**: Poems follow natural length for each poet's style
3. **Poet diversity**: 29 different poets with vastly different styles and techniques
4. **Never-ending series**: Like short stories, poems continue indefinitely
5. **Form variety**: Sonnets, free verse, haiku, odes, ballads, experimental forms
6. **Unique metadata**: Tracks which poet's style was used for each poem

## Support

For issues or questions:
- Check [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for configuration details
- Review workflow logs in the Actions tab
- Verify all secrets are correctly set

## Next Steps

Once set up:
- The workflow runs automatically every day at 14:00 UTC
- Each day adds a new poem to the collection
- The collection grows indefinitely
- Visitors can read all poems from the website

Enjoy your daily dose of AI-generated poetry! 📖✨
