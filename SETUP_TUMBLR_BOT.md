# Setup Guide: Tumblr Poem Bot

This guide covers the setup process for the Tumblr Poem Bot, which posts poems to Tumblr every 10 minutes.

## Overview

The Tumblr Poem Bot:
- Posts poems **every 10 minutes** to Tumblr
- Randomly selects from **100 different poetry types** for each poem
- Generates poems of appropriate length for the poetry type
- Uses Google Gemini AI for poem generation
- Posts directly to your Tumblr blog
- Includes relevant hashtags for better reach and discoverability

## Prerequisites

Before setting up, ensure you have:
1. A GitHub account with this repository
2. A Google Cloud account with Gemini API access
3. A Tumblr account (for posting poems)
4. Tumblr Developer account with API access

## Step 1: Obtain Tumblr API Credentials

### 1.1 Create a Tumblr Account

1. Go to [Tumblr](https://www.tumblr.com/)
2. Sign up for a new account or log in to your existing account
3. Create a blog for your poetry bot (e.g., "mockpoet")
   - Note: Your blog URL will be `your-blog-name.tumblr.com`
   - Save your blog name (without `.tumblr.com`) for later

### 1.2 Register a Tumblr Application

1. Go to [Tumblr Applications](https://www.tumblr.com/oauth/apps)
2. Click **Register application**
3. Fill out the application form:
   - **Application Name**: MockPoet Tumblr Bot (or your preferred name)
   - **Application Website**: Your repository URL (e.g., `https://github.com/pappater/mockpoet`)
   - **Application Description**: An automated poetry bot that posts original AI-generated poems
   - **Administrative contact email**: Your email address
   - **Default callback URL**: Your repository URL or any valid URL (e.g., `https://github.com/pappater/mockpoet`)
4. Click **Register**
5. You'll be redirected to your application's page

### 1.3 Get Your API Credentials

After registering your application, you'll see:

1. **OAuth Consumer Key** - Save this (also called Consumer Key)
2. **Secret Key** - Save this (also called Consumer Secret)

### 1.4 Generate OAuth Tokens

To post to Tumblr, you need OAuth access tokens. Here's how to get them:

#### Option 1: Using Tumblr's API Console (Easiest)

1. Go to your application page at [Tumblr Applications](https://www.tumblr.com/oauth/apps)
2. Click on your application name
3. Click **Explore the Tumblr API**
4. You'll see a pre-authenticated API console
5. Look for the authentication section to find your:
   - **OAuth Token**
   - **OAuth Token Secret**

#### Option 2: Using Python Script

If the API console doesn't show tokens, use this Python script:

```python
import pytumblr
import oauth2 as oauth

# Your application credentials
CONSUMER_KEY = 'your_consumer_key_here'
CONSUMER_SECRET = 'your_consumer_secret_here'

# OAuth flow
consumer = oauth.Consumer(CONSUMER_KEY, CONSUMER_SECRET)
client = oauth.Client(consumer)

# Step 1: Get request token
resp, content = client.request('https://www.tumblr.com/oauth/request_token', 'POST')
request_token = dict(urllib.parse.parse_qsl(content.decode('utf-8')))

# Step 2: Authorize (visit this URL in browser)
print('Visit this URL to authorize:')
print(f'https://www.tumblr.com/oauth/authorize?oauth_token={request_token["oauth_token"]}')

# After authorization, you'll get a verifier
oauth_verifier = input('Enter the verifier: ')

# Step 3: Get access token
token = oauth.Token(request_token['oauth_token'], request_token['oauth_token_secret'])
token.set_verifier(oauth_verifier)
client = oauth.Client(consumer, token)
resp, content = client.request('https://www.tumblr.com/oauth/access_token', 'POST')
access_token = dict(urllib.parse.parse_qsl(content.decode('utf-8')))

print(f'OAuth Token: {access_token["oauth_token"]}')
print(f'OAuth Token Secret: {access_token["oauth_token_secret"]}')
```

### Summary of Tumblr Credentials

You should now have the following 5 credentials:
- ✓ **Consumer Key** (OAuth Consumer Key)
- ✓ **Consumer Secret** (Secret Key)
- ✓ **OAuth Token**
- ✓ **OAuth Token Secret**
- ✓ **Blog Name** (e.g., "mockpoet" from mockpoet.tumblr.com)

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

2. **TUMBLR_CONSUMER_KEY**
   - Value: Your Tumblr OAuth Consumer Key from Step 1.3
   - Used to: Authenticate with Tumblr API

3. **TUMBLR_CONSUMER_SECRET**
   - Value: Your Tumblr Secret Key (Consumer Secret) from Step 1.3
   - Used to: Authenticate with Tumblr API

4. **TUMBLR_OAUTH_TOKEN**
   - Value: Your Tumblr OAuth Token from Step 1.4
   - Used to: Post to your Tumblr blog

5. **TUMBLR_OAUTH_SECRET**
   - Value: Your Tumblr OAuth Token Secret from Step 1.4
   - Used to: Post to your Tumblr blog

6. **TUMBLR_BLOG_NAME**
   - Value: Your blog name (e.g., "mockpoet" without ".tumblr.com")
   - Used to: Specify which blog to post to

### 3.3 Verify Secrets

After adding all secrets, you should have **6 repository secrets** configured:
- ✓ GEMINI_API_KEY
- ✓ TUMBLR_CONSUMER_KEY
- ✓ TUMBLR_CONSUMER_SECRET
- ✓ TUMBLR_OAUTH_TOKEN
- ✓ TUMBLR_OAUTH_SECRET
- ✓ TUMBLR_BLOG_NAME

## Step 4: Verify Configuration

The configuration files are already set up in the repository:

### Config Files
- `scripts/tumblr-poem-bot/poetry_types.json` - List of 100 poetry types
- `scripts/tumblr-poem-bot/config.json` - Bot configuration
- `scripts/tumblr-poem-bot/prompts/poem_prompt.txt` - Poem generation prompt
- `scripts/tumblr-poem-bot/requirements.txt` - Python dependencies

### Workflow File
- `.github/workflows/tumblr-poem-bot.yml` - Runs every 10 minutes (cron: `*/10 * * * *`)

## Step 5: Test the Bot (Manual Run)

To test the setup before waiting for the scheduled run:

1. Go to the **Actions** tab in your repository
2. Select **Tumblr Poem Bot** workflow
3. Click **Run workflow** → **Run workflow**
4. Wait for the workflow to complete
5. Check your Tumblr blog to see the posted poem

## Step 6: Monitor the Bot

After the first successful run:

### Verify Bot is Working
1. Check GitHub Actions for workflow runs (should run every 10 minutes)
2. Check your Tumblr blog for new poems
3. Verify hashtags are being added to posts
4. Confirm different poetry types are being used

### Expected Posting Frequency
- **Every 10 minutes** (144 poems per day)
- 1,008 poems per week
- ~4,320 poems per month

**Note:** This is a high-frequency bot. Consider adjusting the schedule if this is too frequent for your audience.

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
See `scripts/tumblr-poem-bot/poetry_types.json` for the complete list.

## Workflow Schedule

The workflow runs:
- **Schedule**: Every 10 minutes (cron: `*/10 * * * *`)
- **Manual**: Can be triggered via workflow_dispatch

### Adjusting the Schedule

If you want to change the posting frequency, edit `.github/workflows/tumblr-poem-bot.yml`:

```yaml
# Examples:
schedule:
  - cron: '*/15 * * * *'  # Every 15 minutes
  - cron: '*/30 * * * *'  # Every 30 minutes
  - cron: '0 * * * *'      # Every hour at the top of the hour
  - cron: '0 */2 * * *'    # Every 2 hours
  - cron: '0 9,15,21 * * *' # Three times a day (9:00, 15:00, 21:00 UTC)
```

## Hashtags

The bot automatically adds relevant hashtags to each poem post for better discoverability:

### Standard Poetry Hashtags
- poetry
- poem
- poet
- writing
- writersofinstagram
- poetsofinstagram
- poetrycommunity
- writerscommunity
- creativewriting
- spilledink
- wordporn
- poetryisnotdead
- instapoetry
- instapoet
- modernpoetry

Each post includes:
- 5 randomly selected general poetry hashtags
- Poetry type-specific hashtag (when applicable)

## File Structure

```
mockpoet/
├── .github/workflows/
│   └── tumblr-poem-bot.yml          # Every 10 minutes workflow
├── scripts/tumblr-poem-bot/
│   ├── tumblr_poem_bot.py           # Main bot script
│   ├── poetry_types.json            # List of 100 poetry types
│   ├── config.json                  # Configuration
│   ├── requirements.txt             # Python dependencies
│   └── prompts/
│       └── poem_prompt.txt          # Prompt template for poems
└── SETUP_TUMBLR_BOT.md             # This file
```

## Customization

### Modifying Poetry Types

To add or remove poetry types:

1. Edit `scripts/tumblr-poem-bot/poetry_types.json`
2. Add/remove poetry types from the `poetry_types` array
3. Commit and push changes
4. New poems will use the updated list

### Changing Generation Prompt

To modify how poems are generated:

1. Edit `scripts/tumblr-poem-bot/prompts/poem_prompt.txt`
2. Update the prompt template
3. Commit and push changes
4. New poems will use the updated prompt

### Customizing Hashtags

To modify the hashtags used:

1. Edit `scripts/tumblr-poem-bot/tumblr_poem_bot.py`
2. Modify the `POETRY_HASHTAGS` list
3. Adjust the hashtag selection logic in `generate_hashtags()`
4. Test thoroughly before deploying

## Troubleshooting

### No Poems Posted

- Check GitHub Actions workflow runs for errors
- Verify all 6 Tumblr secrets are correctly set
- Check API quotas for Gemini API
- Verify Tumblr API access and permissions

### Tumblr API Errors

- **401 Unauthorized**: Verify all tokens and secrets are correct
- **403 Forbidden**: Check blog permissions and API application status
- **404 Not Found**: Verify TUMBLR_BLOG_NAME is correct (without .tumblr.com)

### Workflow Not Running

- GitHub Actions has limits on free accounts (2,000 minutes/month)
- Verify the workflow is enabled in the Actions tab
- Check if the repository is private (may have fewer free minutes)

## Important Notes

### Rate Limits

- **Tumblr API**: Has rate limits (check Tumblr's documentation)
- **Gemini API**: Check your quota at [Google AI Studio](https://aistudio.google.com)
- **GitHub Actions**: 2,000 minutes/month for free accounts

### Recommendations

1. **Start with less frequent posting** (e.g., every 30 minutes or hourly) to avoid rate limits
2. **Monitor Tumblr engagement** to ensure poems are well-received
3. **Check API quotas regularly** to avoid unexpected outages
4. **Have a backup plan** if rate limits are reached

### Ethical Considerations

- **Disclose that poems are AI-generated** (add to Tumblr blog description)
- **Respect Tumblr's automation rules**
- **Don't spam or over-post** (10 min = 144 posts/day is aggressive)
- **Monitor for inappropriate content** (review generated poems periodically)

## Maintenance

### Monitoring
- Check GitHub Actions for workflow status
- Review Tumblr blog regularly for new poems
- Monitor API usage for both Gemini and Tumblr

### Updates
- Keep dependencies up to date (`requirements.txt`)
- Review Tumblr API changes and updates
- Monitor Gemini API model availability

## Support

For issues or questions:
1. Check GitHub Actions logs for error messages
2. Review Tumblr Developer Portal for API status
3. Verify all secrets are correctly configured
4. Open an issue in the repository

## Related Documentation

- [Main README](README.md) - Project overview
- [Environment Variables](ENVIRONMENT_VARIABLES.md) - All environment variables
- [Tumblr API Documentation](https://www.tumblr.com/docs/en/api/v2)
- [PyTumblr Documentation](https://github.com/tumblr/pytumblr)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
