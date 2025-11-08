# Setup Guide: Twitter Poem Bot

This guide covers the setup process for the Twitter Poem Bot, which posts short poems to Twitter/X every 15 minutes.

## Overview

The Twitter Poem Bot:
- Posts poems **every 15 minutes** to Twitter/X
- Randomly selects from **100 different poetry types** for each poem
- Generates poems with **max 280 characters** (Twitter limit)
- Uses Google Gemini AI for poem generation
- Posts directly to your Twitter/X account

## Prerequisites

Before setting up, ensure you have:
1. A GitHub account with this repository
2. A Google Cloud account with Gemini API access
3. A Twitter/X account (for posting poems)
4. Twitter/X Developer account with API access

## Step 1: Obtain Twitter/X API Credentials

### 1.1 Create a Twitter Developer Account

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Sign in with your Twitter/X account
3. Click **Sign up for Free Account** (if you don't have one)
4. Fill out the application form:
   - **What is your use case?** Building a bot/automation
   - **Describe your use case:** Creating an automated poetry bot that posts original AI-generated poems
5. Agree to the Terms of Service
6. Verify your email address

### 1.2 Create a Twitter App

1. In the Developer Portal, click **Projects & Apps** → **Overview**
2. Click **+ Create App** (or **+ Create Project** if prompted)
3. Give your app a name (e.g., "MockPoet Twitter Bot")
4. Save the **API Key** and **API Key Secret** that are displayed (you'll need these later)

### 1.3 Configure App Permissions

1. In your app's dashboard, click the **Settings** tab
2. Scroll down to **User authentication settings**
3. Click **Set up**
4. Configure the following:
   - **App permissions:** Select **Read and write**
   - **Type of App:** Select **Web App, Automated App or Bot**
   - **Callback URI:** Enter any valid URL (e.g., `https://github.com/pappater/mockpoet`)
   - **Website URL:** Enter your repository URL (e.g., `https://github.com/pappater/mockpoet`)
5. Click **Save**

### 1.4 Generate Access Tokens

1. In your app's dashboard, click the **Keys and tokens** tab
2. Under **Authentication Tokens**, locate **Access Token and Secret**
3. Click **Generate** (or **Regenerate** if already generated)
4. Save the **Access Token** and **Access Token Secret** (you'll need these later)
5. Under **Bearer Token**, copy the **Bearer Token** (you'll need this too)

### Summary of Twitter Credentials

You should now have the following 5 credentials:
- ✓ **API Key** (also called Consumer Key)
- ✓ **API Key Secret** (also called Consumer Secret)
- ✓ **Access Token**
- ✓ **Access Token Secret**
- ✓ **Bearer Token**

## Step 2: Get Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Select a Google Cloud project (or create a new one)
5. Copy the **API Key** that is generated

## Step 3: Add GitHub Repository Secrets

Add the following secrets to your GitHub repository:

### 3.1 Navigate to Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### 3.2 Add Required Secrets

Add each of the following secrets:

1. **GEMINI_API_KEY**
   - Value: Your Google Gemini API key from Step 2
   - Used to: Generate poems using AI

2. **TWITTER_API_KEY**
   - Value: Your Twitter API Key (Consumer Key) from Step 1.4
   - Used to: Authenticate with Twitter API

3. **TWITTER_API_SECRET**
   - Value: Your Twitter API Key Secret (Consumer Secret) from Step 1.4
   - Used to: Authenticate with Twitter API

4. **TWITTER_ACCESS_TOKEN**
   - Value: Your Twitter Access Token from Step 1.4
   - Used to: Post tweets on behalf of your account

5. **TWITTER_ACCESS_TOKEN_SECRET**
   - Value: Your Twitter Access Token Secret from Step 1.4
   - Used to: Post tweets on behalf of your account

6. **TWITTER_BEARER_TOKEN**
   - Value: Your Twitter Bearer Token from Step 1.4
   - Used to: Authenticate with Twitter API v2

### 3.3 Verify Secrets

After adding all secrets, you should have **6 repository secrets** configured:
- ✓ GEMINI_API_KEY
- ✓ TWITTER_API_KEY
- ✓ TWITTER_API_SECRET
- ✓ TWITTER_ACCESS_TOKEN
- ✓ TWITTER_ACCESS_TOKEN_SECRET
- ✓ TWITTER_BEARER_TOKEN

## Step 4: Verify Configuration

The configuration files are already set up in the repository:

### Config Files
- `scripts/twitter-poem-bot/poetry_types.json` - List of 100 poetry types
- `scripts/twitter-poem-bot/config.json` - Bot configuration
- `scripts/twitter-poem-bot/prompts/poem_prompt.txt` - Poem generation prompt
- `scripts/twitter-poem-bot/requirements.txt` - Python dependencies

### Workflow File
- `.github/workflows/twitter-poem-bot.yml` - Runs every 15 minutes (cron: `*/15 * * * *`)

## Step 5: Test the Bot (Manual Run)

To test the setup before waiting for the scheduled run:

1. Go to the **Actions** tab in your repository
2. Select **Twitter Poem Bot** workflow
3. Click **Run workflow** → **Run workflow**
4. Wait for the workflow to complete
5. Check your Twitter/X account to see the posted poem

## Step 6: Monitor the Bot

After the first successful run:

### Verify Bot is Working
1. Check GitHub Actions for workflow runs (should run every 15 minutes)
2. Check your Twitter/X profile for new poems
3. Verify poems are under 280 characters
4. Confirm different poetry types are being used

### Expected Posting Frequency
- **Every 15 minutes** (96 poems per day)
- 672 poems per week
- ~2,880 poems per month

**Note:** This is a high-frequency bot. Consider adjusting the schedule if this is too frequent.

## Poetry Types

The bot uses 100 different poetry types, including:

### Classical Forms (1-20)
Sonnet, Haiku, Limerick, Free verse, Blank verse, Villanelle, Ballad, Ode, Elegy, Epic, Narrative poem, Lyric poem, Pastoral, Acrostic, Cinquain, Tanka, Sestina, Pantoum, Ghazal, Shape poem (Concrete poem)

### Additional Forms (21-40)
Couplet, Quatrain, Rondeau, Triolet, Rondel, Terza rima, Clerihew, Epigram, Epitaph, Found poem, Prose poem, Slam poetry, Spoken word, Visual poetry, Ekphrastic poem, Allegory poem, Catalog poem, Chant poem, Dramatic monologue, Epistle (letter poem)

### More Forms (41-60)
Ars Poetica, Hymn, Chant royal, Rubaiyat, Kyrielle, Renga, Senryu, Than-Bauk, Sijo, Monorhyme, ABC poem, Blitz poem, Etheree, Fib poem, Diamante, Palindrome poem, Tetractys, Minute poem, Nonet, Septet

### Advanced Forms (61-80)
Octave, Rondelet, Lai, Ballade, Double dactyl, Paradelle, Heroic couplet, Epithalamium, Madrigal, List poem, Imagist poem, Light verse, Occasional poem, Petrarchan sonnet, Shakespearean sonnet, Spenserian sonnet, Curtal sonnet, Chain verse, Cycle poem, Dirge

### Contemporary Forms (81-100)
Dramatic verse, Mock epic, Parody poem, Concrete poetry, Visual poem, Sequence poem, Found poetry, Shape poem, Occasional verse, Confessional poem, Performance poem, Epistolary poem, Mythic poem, Political poem, Satirical poem, Love poem

### All 100 Types
See `scripts/twitter-poem-bot/poetry_types.json` for the complete list.

## Workflow Schedule

The workflow runs:
- **Schedule**: Every 15 minutes (cron: `*/15 * * * *`)
- **Manual**: Can be triggered via workflow_dispatch

### Adjusting the Schedule

If you want to change the posting frequency, edit `.github/workflows/twitter-poem-bot.yml`:

```yaml
# Examples:
schedule:
  - cron: '*/30 * * * *'  # Every 30 minutes
  - cron: '0 * * * *'      # Every hour at the top of the hour
  - cron: '0 */2 * * *'    # Every 2 hours
  - cron: '0 9,15,21 * * *' # Three times a day (9:00, 15:00, 21:00 UTC)
```

## File Structure

```
mockpoet/
├── .github/workflows/
│   └── twitter-poem-bot.yml          # Every 15 minutes workflow
├── scripts/twitter-poem-bot/
│   ├── twitter_poem_bot.py           # Main bot script
│   ├── poetry_types.json             # List of 100 poetry types
│   ├── config.json                   # Configuration
│   ├── requirements.txt              # Python dependencies
│   └── prompts/
│       └── poem_prompt.txt           # Prompt template for short poems
└── SETUP_TWITTER_BOT.md             # This file
```

## Customization

### Modifying Poetry Types

To add or remove poetry types:

1. Edit `scripts/twitter-poem-bot/poetry_types.json`
2. Add/remove poetry types from the `poetry_types` array
3. Commit and push changes
4. New poems will use the updated list

### Changing Generation Prompt

To modify how poems are generated:

1. Edit `scripts/twitter-poem-bot/prompts/poem_prompt.txt`
2. Update the prompt template (keep the 280 character limit instruction)
3. Commit and push changes
4. New poems will use the updated prompt

### Adjusting Character Limit

The 280 character limit is enforced in the script. To change it:

1. Edit `scripts/twitter-poem-bot/twitter_poem_bot.py`
2. Modify the `TWITTER_CHAR_LIMIT` constant
3. Update the prompt to reflect the new limit
4. Test thoroughly before deploying

## Troubleshooting

### No Poems Posted

- Check GitHub Actions workflow runs for errors
- Verify all 6 Twitter secrets are correctly set
- Check API quotas for Gemini API
- Verify Twitter API access level (should be "Elevated" or have write permissions)

### Twitter API Errors

- **403 Forbidden**: Check app permissions (should be "Read and write")
- **401 Unauthorized**: Verify all tokens and secrets are correct
- **429 Rate Limited**: Twitter API rate limit exceeded (wait and try again)

### Poems Too Long

- The script attempts to regenerate if poem exceeds 280 characters
- If generation fails repeatedly, it truncates the poem
- Consider adjusting the prompt for shorter poems

### Workflow Not Running

- GitHub Actions has limits on free accounts (2,000 minutes/month)
- Verify the workflow is enabled in the Actions tab
- Check if the repository is private (may have fewer free minutes)

## Important Notes

### Rate Limits

- **Twitter API**: Free tier has rate limits (read Twitter's documentation)
- **Gemini API**: Check your quota at [Google AI Studio](https://aistudio.google.com)
- **GitHub Actions**: 2,000 minutes/month for free accounts

### Recommendations

1. **Start with less frequent posting** (e.g., hourly) to avoid rate limits
2. **Monitor Twitter engagement** to ensure poems are well-received
3. **Check API quotas regularly** to avoid unexpected outages
4. **Have a backup plan** if rate limits are reached

### Ethical Considerations

- **Disclose that poems are AI-generated** (add to Twitter bio)
- **Respect Twitter's automation rules**
- **Don't spam or over-post** (15 min = 96 posts/day is aggressive)
- **Monitor for inappropriate content** (review generated poems periodically)

## Maintenance

### Monitoring
- Check GitHub Actions for workflow status
- Review Twitter profile regularly for new poems
- Monitor API usage for both Gemini and Twitter

### Updates
- Keep dependencies up to date (`requirements.txt`)
- Review Twitter API changes and updates
- Monitor Gemini API model availability

## Support

For issues or questions:
1. Check GitHub Actions logs for error messages
2. Review Twitter Developer Portal for API status
3. Verify all secrets are correctly configured
4. Open an issue in the repository

## Related Documentation

- [Main README](README.md) - Project overview
- [Environment Variables](ENVIRONMENT_VARIABLES.md) - All environment variables
- [Twitter Developer Documentation](https://developer.twitter.com/en/docs)
- [Tweepy Documentation](https://docs.tweepy.org/)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
