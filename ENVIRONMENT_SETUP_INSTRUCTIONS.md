# Environment Variables Setup Instructions

This document provides comprehensive instructions for setting up all environment variables and GitHub secrets needed to run the mockpoet novel platform with all three novels.

## Overview

The mockpoet platform hosts multiple AI-generated novels, each with its own Gist for content storage. All novels share common API keys but use separate Gist IDs.

## Required Secrets

You need to configure **5 secrets** in your GitHub repository:

### 1. GEMINI_API_KEY (Shared)
**Purpose**: Google Gemini AI API key for generating novel chapters  
**Used by**: All novels  
**How to get**:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key" or use an existing key
4. Copy the API key (starts with something like `AIza...`)

**Add to GitHub**:
- Settings → Secrets and variables → Actions → New repository secret
- Name: `GEMINI_API_KEY`
- Value: Your API key

### 2. GIST_TOKEN (Shared)
**Purpose**: GitHub Personal Access Token for reading/writing to Gists  
**Used by**: All novels  
**How to get**:
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Mockpoet Novel Gist Access")
4. Set expiration (recommend "No expiration" or long duration)
5. Select scopes: **gist** (required - allows creating and editing gists)
6. Click "Generate token"
7. Copy the token immediately (you won't be able to see it again)

**Add to GitHub**:
- Settings → Secrets and variables → Actions → New repository secret
- Name: `GIST_TOKEN`
- Value: Your personal access token

### 3. GIST_ID (Novel-specific)
**Purpose**: Gist ID for "The Weight of Promises" novel  
**Used by**: The Weight of Promises workflow only  
**How to get**:
1. Go to [gist.github.com](https://gist.github.com)
2. Click "+" to create a new gist
3. Make sure it's set to **Public** (not Secret)
4. Add a placeholder file (e.g., filename: `README.md`, content: `Placeholder for The Weight of Promises`)
5. Click "Create public gist"
6. Look at the URL: `https://gist.github.com/username/abc123xyz789`
7. Copy the ID part: `abc123xyz789`

**Add to GitHub**:
- Settings → Secrets and variables → Actions → New repository secret
- Name: `GIST_ID`
- Value: Your Gist ID (just the ID, not the full URL)

**Note**: This may already be configured if you're continuing from an existing setup.

### 4. STRANGER_GIST_ID (Novel-specific)
**Purpose**: Gist ID for "The Indifferent Shore" novel  
**Used by**: The Indifferent Shore workflow only  
**How to get**:
1. Create another **new public Gist** (different from GIST_ID)
2. Placeholder content: `Placeholder for The Indifferent Shore`
3. Copy the Gist ID from the URL

**Add to GitHub**:
- Settings → Secrets and variables → Actions → New repository secret
- Name: `STRANGER_GIST_ID`
- Value: Your new Gist ID

**Important**: This MUST be different from `GIST_ID`

### 5. WEREWOLF_GIST_ID (Novel-specific) ⭐ NEW
**Purpose**: Gist ID for "Moonbound Devotion" novel  
**Used by**: Moonbound Devotion workflow only  
**How to get**:
1. Create another **new public Gist** (different from GIST_ID and STRANGER_GIST_ID)
2. Placeholder content: `Placeholder for Moonbound Devotion`
3. Copy the Gist ID from the URL

**Add to GitHub**:
- Settings → Secrets and variables → Actions → New repository secret
- Name: `WEREWOLF_GIST_ID`
- Value: Your new Gist ID

**Important**: This MUST be different from both `GIST_ID` and `STRANGER_GIST_ID`

## Summary Table

| Secret Name | Shared/Specific | Purpose | Example Value |
|-------------|----------------|---------|---------------|
| `GEMINI_API_KEY` | Shared | Google Gemini API | `AIza...` |
| `GIST_TOKEN` | Shared | GitHub PAT for Gists | `ghp_...` |
| `GIST_ID` | Weight of Promises | Gist for novel 1 | `51893c25959355bda1884804375ec3d8` |
| `STRANGER_GIST_ID` | Indifferent Shore | Gist for novel 2 | `b12ff3b5ea6e9f42a7becfc2cc1aeece` |
| `WEREWOLF_GIST_ID` | Moonbound Devotion | Gist for novel 3 | Your new Gist ID |

## Novel-to-Secret Mapping

```
┌─────────────────────────────┬──────────────────────┬─────────────────┐
│ Novel                       │ Workflow File        │ Gist Secret     │
├─────────────────────────────┼──────────────────────┼─────────────────┤
│ The Weight of Promises      │ daily-novel-gist.yml │ GIST_ID         │
│ The Indifferent Shore       │ daily-stranger-novel │ STRANGER_GIST_ID│
│ Moonbound Devotion          │ daily-werewolf-novel │ WEREWOLF_GIST_ID│
└─────────────────────────────┴──────────────────────┴─────────────────┘

All novels also use: GEMINI_API_KEY, GIST_TOKEN
```

## Verification Checklist

After setting up all secrets:

- [ ] `GEMINI_API_KEY` - Check Google AI Studio for valid key
- [ ] `GIST_TOKEN` - Verify it has `gist` scope
- [ ] `GIST_ID` - Verify Gist is public and accessible
- [ ] `STRANGER_GIST_ID` - Verify Gist is public and accessible
- [ ] `WEREWOLF_GIST_ID` - Verify Gist is public and accessible
- [ ] All three Gist IDs are **different** from each other
- [ ] All secrets are added to: Settings → Secrets and variables → Actions

## Testing the Setup

### Test Each Novel Workflow

1. Go to the **Actions** tab in your GitHub repository
2. You should see three novel workflows:
   - "Daily Gemini Novel Chapter to Gist" (Weight of Promises)
   - "Daily Gemini Stranger Novel Chapter to Gist" (Indifferent Shore)
   - "Daily Gemini Werewolf Novel Chapter to Gist" (Moonbound Devotion)

3. For each workflow:
   - Click on the workflow name
   - Click "Run workflow" button
   - Select the branch (usually `main`)
   - Click "Run workflow"

4. Wait for the workflow to complete (usually 2-5 minutes)

5. Check the results:
   - Visit the corresponding Gist URL
   - Verify chapter files are created
   - Check that `chapters.json` is present

### Verify in UI

1. Visit your deployed site or run locally:
   ```bash
   npm install
   npm run dev
   ```

2. Open the site in a browser

3. You should see **three novel cards** on the home page:
   - The Weight of Promises
   - The Indifferent Shore
   - Moonbound Devotion

4. Click on each novel to verify:
   - Chapters load correctly
   - Content displays properly
   - Navigation works

## Troubleshooting

### Error: "GEMINI_API_KEY environment variable not set"
**Solution**: Add the `GEMINI_API_KEY` secret in repository settings

### Error: "GIST_TOKEN environment variable not set"
**Solution**: Add the `GIST_TOKEN` secret in repository settings

### Error: "WEREWOLF_GIST_ID environment variable not set"
**Solution**: Add the `WEREWOLF_GIST_ID` secret in repository settings

### Error: "Failed to authenticate to GitHub"
**Solution**: 
- Check that `GIST_TOKEN` has the `gist` scope
- Generate a new token if needed
- Update the secret with the new token

### Error: "Gist not found" or "404"
**Solution**:
- Verify the Gist ID is correct
- Ensure the Gist is **Public** (not Secret)
- Check that you can access the Gist in a browser

### Novel Not Showing in UI
**Solutions**:
1. Check that the Gist ID is set in `config.js`
2. Verify the Gist has `chapters.json` file
3. Run the workflow to generate initial chapter
4. Clear browser cache and reload

### All Novels Use Same Content
**Problem**: All three novels should use different Gists
**Solution**:
- Verify each secret (`GIST_ID`, `STRANGER_GIST_ID`, `WEREWOLF_GIST_ID`) has a different value
- Check workflow logs to confirm correct Gist ID is being used
- Update the secrets if they're the same

### API Rate Limits or Costs
All three novels share the same `GEMINI_API_KEY`:
- **Daily API calls**: ~6 calls (2 per novel: chapter + summary)
- **Monthly API calls**: ~180 calls
- Check [Google AI pricing](https://ai.google.dev/pricing) for current rates
- Gemini Flash models are generally free for moderate usage

## Schedule Reference

Each novel generates on a different schedule to avoid conflicts:

| Novel | Schedule | UTC Time | Your Local Time |
|-------|----------|----------|-----------------|
| The Weight of Promises | Daily | 10:00 UTC | Convert from UTC |
| The Indifferent Shore | Daily | 11:00 UTC | Convert from UTC |
| Moonbound Devotion | Daily | 12:00 UTC | Convert from UTC |

Use [WorldTimeBuddy](https://www.worldtimebuddy.com/) to convert UTC to your timezone.

## Local Development

For local testing without GitHub Actions:

```bash
# Set environment variables
export GEMINI_API_KEY="your-api-key"
export GIST_TOKEN="your-token"

# Test Weight of Promises
export GIST_ID="your-gist-id"
python3 scripts/novel/novel_daily_to_gist.py

# Test Indifferent Shore
export STRANGER_GIST_ID="your-stranger-gist-id"
python3 scripts/stranger-novel/stranger_novel_daily_to_gist.py

# Test Moonbound Devotion
export WEREWOLF_GIST_ID="your-werewolf-gist-id"
python3 scripts/werewolf-novel/werewolf_novel_daily_to_gist.py
```

## Security Notes

- Never commit secrets to the repository
- Never share API keys publicly
- Rotate tokens periodically for security
- Use repository secrets (not environment variables in workflows)
- Make sure Gists are public (so readers can access them) but tokens are private

## Support

For detailed setup instructions for each novel:
- [SETUP_STRANGER_NOVEL.md](SETUP_STRANGER_NOVEL.md) - The Indifferent Shore
- [SETUP_WEREWOLF_NOVEL.md](SETUP_WEREWOLF_NOVEL.md) - Moonbound Devotion
- [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) - Original documentation

## Quick Setup Checklist

Complete these steps in order:

1. [ ] Generate Google Gemini API key
2. [ ] Generate GitHub Personal Access Token with `gist` scope
3. [ ] Create first public Gist (for Weight of Promises)
4. [ ] Create second public Gist (for Indifferent Shore)
5. [ ] Create third public Gist (for Moonbound Devotion)
6. [ ] Add all 5 secrets to GitHub repository
7. [ ] Manually run each workflow once
8. [ ] Verify all three novels appear in UI
9. [ ] Check that content loads correctly
10. [ ] Confirm scheduled runs are working

## Done!

Once all secrets are configured and workflows run successfully, your mockpoet platform will automatically generate new chapters daily for all three novels. Each novel operates independently with its own content, theme, and schedule.
