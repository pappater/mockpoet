# Twitter Bot Quick Start Guide

## 🚀 Quick Setup Checklist

Follow these steps to get your Twitter Poem Bot running:

### Step 1: Get Twitter Developer Access ✅
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Sign in and apply for Developer Account
3. Create a new App in the Developer Portal
4. Set app permissions to **"Read and write"**

### Step 2: Generate Twitter Credentials ✅
In your app's dashboard:
1. Go to **Keys and tokens** tab
2. Copy the following 5 credentials:
   - ✓ API Key (Consumer Key)
   - ✓ API Key Secret (Consumer Secret)  
   - ✓ Access Token
   - ✓ Access Token Secret
   - ✓ Bearer Token

### Step 3: Add GitHub Secrets ✅
Go to your repo: **Settings → Secrets and variables → Actions**

Add these 6 secrets:
```
TWITTER_API_KEY              = [Your API Key]
TWITTER_API_SECRET           = [Your API Secret]
TWITTER_ACCESS_TOKEN         = [Your Access Token]
TWITTER_ACCESS_TOKEN_SECRET  = [Your Access Token Secret]
TWITTER_BEARER_TOKEN         = [Your Bearer Token]
GEMINI_API_KEY              = [Your Gemini API Key]*
```
*If GEMINI_API_KEY doesn't exist, get it from https://aistudio.google.com/app/apikey

### Step 4: Test the Bot ✅
1. Go to **Actions** tab in your repo
2. Click **Twitter Poem Bot** workflow
3. Click **Run workflow** → **Run workflow**
4. Wait ~2-3 minutes for completion
5. Check your Twitter/X account for the posted poem! 🎉

### Step 5: Monitor ✅
- Check **Actions** tab for workflow runs (every 15 minutes)
- View posted poems on your Twitter/X profile
- Monitor rate limits (see below)

## 📊 Current Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| **Posting Frequency** | Every 15 minutes | 96 poems per day |
| **Character Limit** | 280 characters | Enforced by script |
| **Poetry Types** | 96 unique types | Randomly selected |
| **Schedule** | `*/15 * * * *` | GitHub Actions cron |

## ⚙️ Adjusting Posting Frequency

The default 15-minute schedule is **very aggressive** (96 posts/day). Consider adjusting:

### Edit `.github/workflows/twitter-poem-bot.yml`

Change this line:
```yaml
- cron: '*/15 * * * *'  # Every 15 minutes (96/day)
```

To one of these:
```yaml
- cron: '*/30 * * * *'      # Every 30 minutes (48/day)
- cron: '0 * * * *'         # Every hour (24/day) ⭐ RECOMMENDED
- cron: '0 */2 * * *'       # Every 2 hours (12/day)
- cron: '0 */3 * * *'       # Every 3 hours (8/day)
- cron: '0 9,15,21 * * *'   # 3 times a day (3/day)
```

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **SETUP_TWITTER_BOT.md** | Detailed setup guide with screenshots |
| **TWITTER_BOT_SUMMARY.md** | Complete implementation details |
| **ENVIRONMENT_VARIABLES.md** | All secrets and configuration |

## ⚠️ Important Notes

### Rate Limits
- **Twitter API**: Free tier limits apply (check Twitter docs)
- **Gemini API**: Monitor quota at https://aistudio.google.com
- **GitHub Actions**: 2,000 minutes/month for free accounts

### Best Practices
- ✅ Add "AI-generated poems" to your Twitter bio
- ✅ Start with less frequent posting (hourly recommended)
- ✅ Monitor audience engagement
- ✅ Check generated poems periodically for quality
- ✅ Follow Twitter's automation rules

### Rate Limit Warnings
If you exceed rate limits:
- Workflow will fail with API error
- Wait for rate limit reset (usually 15 minutes)
- Consider reducing posting frequency

## 🔧 Troubleshooting

### Bot Not Posting?
1. Check GitHub Actions logs for errors
2. Verify all 6 secrets are set correctly
3. Ensure Twitter app has "Read and write" permissions
4. Verify tokens were generated after setting permissions

### "401 Unauthorized" Error?
- Regenerate Access Token and Access Token Secret
- Make sure tokens are for the correct app
- Check API Key and Secret are correct

### "403 Forbidden" Error?
- Set app permissions to "Read and write"
- Regenerate Access Tokens after changing permissions

### Poems Too Long?
- Script automatically retries if poem > 280 chars
- Falls back to truncation if retry fails
- Usually not an issue with current prompt

## 🎯 Testing

### Manual Test
```bash
# Run locally (after setting environment variables)
cd scripts/twitter-poem-bot
python3 twitter_poem_bot.py
```

### Workflow Test
1. Actions → Twitter Poem Bot → Run workflow
2. Check workflow logs
3. Verify poem on Twitter

## 📞 Support

- **Setup Issues**: See SETUP_TWITTER_BOT.md
- **API Errors**: Check GitHub Actions logs
- **Questions**: Open an issue in the repo

## ✨ Features

✅ 96 unique poetry types
✅ Maintains authentic style for each type
✅ 280 character limit enforced
✅ Automatic retry on failure
✅ Configurable schedule
✅ Secure credential management

---

**Ready?** Start with Step 1 above! 🚀

*For detailed instructions, see SETUP_TWITTER_BOT.md*
