# Environment Variables Reference

This document lists all required environment variables for the rabbit repository's novel generation system.

## GitHub Secrets (Repository Settings)

All these secrets should be added in: **Settings** → **Secrets and variables** → **Actions**

### Shared Secrets (Used by Both Novels)

| Secret Name | Description | Required | Example |
|-------------|-------------|----------|---------|
| `GEMINI_API_KEY` | Google Gemini API key from AI Studio | Yes | `AIza...` |
| `GIST_TOKEN` | GitHub Personal Access Token with `gist` scope | Yes | `ghp_...` |

### Novel-Specific Secrets

| Secret Name | Description | Novel | Required | Example |
|-------------|-------------|-------|----------|---------|
| `GIST_ID` | Gist ID for "The Weight of Promises" | Weight of Promises | Yes | `51893c25959355bda1884804375ec3d8` |
| `STRANGER_GIST_ID` | Gist ID for "The Indifferent Shore" | Indifferent Shore | Yes | `xyz789abc123` |

## Workflow Environment Variables

These are set in the workflow files and use the secrets above:

### For "The Weight of Promises" (.github/workflows/daily-novel-gist.yml)

```yaml
env:
  GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  GEMINI_MODEL: gemini-2.5-flash
  GIST_TOKEN: ${{ secrets.GIST_TOKEN }}
  GIST_ID: ${{ secrets.GIST_ID }}
```

### For "The Indifferent Shore" (.github/workflows/daily-stranger-novel.yml)

```yaml
env:
  GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  GEMINI_MODEL: gemini-2.5-flash
  GIST_TOKEN: ${{ secrets.GIST_TOKEN }}
  STRANGER_GIST_ID: ${{ secrets.STRANGER_GIST_ID }}
```

## Local Development

When running scripts locally, export these environment variables:

### For "The Weight of Promises"

```bash
export GEMINI_API_KEY="your-gemini-api-key"
export GEMINI_MODEL="gemini-2.5-flash"
export GIST_TOKEN="your-github-token"
export GIST_ID="51893c25959355bda1884804375ec3d8"

python3 scripts/novel/novel_daily_to_gist.py
```

### For "The Indifferent Shore"

```bash
export GEMINI_API_KEY="your-gemini-api-key"
export GEMINI_MODEL="gemini-2.5-flash"
export GIST_TOKEN="your-github-token"
export STRANGER_GIST_ID="your-stranger-gist-id"

python3 scripts/stranger-novel/stranger_novel_daily_to_gist.py
```

## How to Get Each Secret

### GEMINI_API_KEY

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key (starts with `AIza`)
5. **Important**: Keep this secret and never commit it to the repository

### GIST_TOKEN

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Rabbit Novel Gist Access")
4. Select scopes: Check ✅ **gist**
5. Set expiration as desired (or no expiration)
6. Click "Generate token"
7. Copy the token (starts with `ghp_`)
8. **Important**: Save it immediately - you won't see it again

### GIST_ID / STRANGER_GIST_ID

1. Go to [gist.github.com](https://gist.github.com)
2. Click "Create a new gist"
3. Add a filename and some placeholder content
4. Make sure it's set to **Public** (not Secret)
5. Click "Create public gist"
6. Copy the Gist ID from the URL:
   - URL: `https://gist.github.com/username/51893c25959355bda1884804375ec3d8`
   - ID: `51893c25959355bda1884804375ec3d8`

**Note**: Create separate Gists for each novel.

## Configuration File

The `config.js` file stores Gist IDs for the frontend:

```javascript
const CONFIG = {
  novels: {
    weight_of_promises: {
      title: "The Weight of Promises",
      gist: {
        username: 'pappater',
        id: '51893c25959355bda1884804375ec3d8'  // Update with your GIST_ID
      },
      localPath: 'docs/novel-gist'
    },
    indifferent_shore: {
      title: "The Indifferent Shore",
      gist: {
        username: 'pappater',
        id: ''  // Update with your STRANGER_GIST_ID
      },
      localPath: 'docs/stranger-novel'
    }
  }
};
```

**Note**: These IDs should match your GitHub secrets for the workflows to function correctly.

## Validation Checklist

Before running the workflows, verify:

- [ ] `GEMINI_API_KEY` is set and valid
- [ ] `GIST_TOKEN` is set with correct permissions
- [ ] `GIST_ID` is set (for Weight of Promises)
- [ ] `STRANGER_GIST_ID` is set (for Indifferent Shore)
- [ ] Both Gists are **public** (not secret)
- [ ] Gist IDs in `config.js` match the secrets
- [ ] All secrets are added in repository settings

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Use GitHub Secrets** for workflows
3. **Use environment variables** for local development
4. **Rotate tokens** periodically for security
5. **Use separate Gists** for different novels to isolate content
6. **Make Gists public** so the UI can fetch content without authentication

## Troubleshooting

### Error: "environment variable not set"

Check that the secret name in the workflow matches exactly (case-sensitive):
- ✅ `STRANGER_GIST_ID`
- ❌ `stranger_gist_id`
- ❌ `STRANGER_NOVEL_GIST_ID`

### Error: "Failed to fetch"

Check that:
1. Gist ID is correct (no typos)
2. Gist is public (not secret)
3. Gist exists and hasn't been deleted
4. GIST_TOKEN has correct permissions

### Error: "API key not valid"

Check that:
1. GEMINI_API_KEY is correct
2. API key hasn't expired
3. You have quota remaining on Google AI Studio

## Summary Table

| Variable | Scope | Novel | Type | Example |
|----------|-------|-------|------|---------|
| `GEMINI_API_KEY` | Both | Both | Secret | `AIza...` |
| `GIST_TOKEN` | Both | Both | Secret | `ghp_...` |
| `GEMINI_MODEL` | Both | Both | Config | `gemini-2.5-flash` |
| `GIST_ID` | Novel 1 | Weight of Promises | Secret | `51893c...` |
| `STRANGER_GIST_ID` | Novel 2 | Indifferent Shore | Secret | `xyz789...` |

## Quick Setup Commands

```bash
# 1. Add secrets via GitHub UI (Settings → Secrets and variables → Actions)

# 2. Trigger workflows manually to generate Chapter 1
# Go to Actions tab → Select workflow → Run workflow

# 3. Verify by checking your Gists
# https://gist.github.com/username/GIST_ID
# https://gist.github.com/username/STRANGER_GIST_ID

# 4. Check the UI
# Both novels should appear on the home page
```
