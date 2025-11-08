# Deployment Checklist for "The Indifferent Shore"

Use this checklist to deploy the new Camus-inspired novel to production.

## Pre-Deployment Verification

- [x] Code committed to repository
- [x] All files created and in correct locations
- [x] Python syntax validated
- [x] JavaScript syntax validated
- [x] Code review passed with no issues
- [x] Security scan passed with no vulnerabilities
- [x] UI tested locally and working correctly
- [x] Documentation complete and reviewed

## Required Actions by User

### 1. Create New GitHub Gist

- [ ] Go to https://gist.github.com
- [ ] Click "Create a new gist"
- [ ] Add a filename: `README.md`
- [ ] Add placeholder content: `# The Indifferent Shore - Coming Soon`
- [ ] Ensure it's set to **Public** (NOT Secret)
- [ ] Click "Create public gist"
- [ ] Copy the Gist ID from the URL
  - Example URL: `https://gist.github.com/pappater/abc123def456`
  - Gist ID: `abc123def456`

### 2. Add Repository Secret

- [ ] Go to your repository: `https://github.com/pappater/mockpoet`
- [ ] Navigate to: **Settings** → **Secrets and variables** → **Actions**
- [ ] Click **"New repository secret"**
- [ ] Add the new secret:
  - **Name**: `STRANGER_GIST_ID`
  - **Value**: [Your Gist ID from step 1]
- [ ] Click **"Add secret"**

### 3. Update Config File (Optional but Recommended)

- [ ] Open `config.js` in the repository
- [ ] Find the `indifferent_shore` section
- [ ] Update the Gist ID:
  ```javascript
  indifferent_shore: {
    title: "The Indifferent Shore",
    gist: {
      username: 'pappater',
      id: 'YOUR_GIST_ID_HERE'  // Replace with your Gist ID
    },
    localPath: 'docs/stranger-novel'
  }
  ```
- [ ] Commit and push the change

### 4. Generate First Chapter

- [ ] Go to **Actions** tab in your repository
- [ ] Find workflow: **"Daily Gemini Stranger Novel Chapter to Gist"**
- [ ] Click on the workflow
- [ ] Click **"Run workflow"** button (top right)
- [ ] Select branch (usually `main`)
- [ ] Click **"Run workflow"** (green button)
- [ ] Wait for workflow to complete (~2-5 minutes)

### 5. Verify Deployment

After the workflow completes:

- [ ] Check workflow run status (should be green checkmark)
- [ ] Visit your Gist: `https://gist.github.com/pappater/[YOUR_GIST_ID]`
- [ ] Verify these files exist:
  - [ ] `chapter_001.md`
  - [ ] `chapters.json`
  - [ ] `series_bible.md`
  - [ ] `outline.md`
  - [ ] `summaries.md`
  - [ ] `continuity_log.txt`
- [ ] Check Chapter 1 content looks correct
- [ ] Check `chapters.json` has proper structure

### 6. Test UI

- [ ] Visit your deployed site (or run locally with `python3 -m http.server 8000`)
- [ ] Verify home page shows **TWO** novels:
  - [ ] "The Weight of Promises"
  - [ ] "The Indifferent Shore"
- [ ] Click on "The Indifferent Shore" card
- [ ] Verify:
  - [ ] Reader page loads
  - [ ] Page title shows "The Indifferent Shore"
  - [ ] Chapter 1 is listed in sidebar
  - [ ] Chapter 1 content displays correctly
  - [ ] Content matches Camus-inspired style
- [ ] Click "Back to Home" button
- [ ] Verify you return to home page with both novels

### 7. Monitor First Daily Run

- [ ] Wait for the first scheduled run (11:00 UTC the next day)
- [ ] Check Actions tab for workflow run
- [ ] Verify Chapter 2 is generated
- [ ] Check Gist is updated with Chapter 2
- [ ] Check UI shows "2 Chapters Available"

## Troubleshooting

### Workflow Fails: "STRANGER_GIST_ID not set"

**Cause**: Secret not added or misspelled  
**Fix**: 
1. Go to Settings → Secrets and variables → Actions
2. Verify `STRANGER_GIST_ID` exists (exact spelling, all caps)
3. If missing, add it
4. If exists, check the value is correct (just the ID, not full URL)

### Workflow Fails: "Failed to fetch"

**Cause**: Gist is Secret instead of Public  
**Fix**:
1. Go to your Gist
2. If it says "Secret", you need to recreate it as Public
3. GitHub doesn't allow changing Secret to Public
4. Create a new Public Gist and update `STRANGER_GIST_ID`

### UI Shows Only One Novel

**Cause**: Frontend config not updated or Gist empty  
**Fix**:
1. Update `config.js` with correct Gist ID
2. Clear browser cache
3. Ensure Chapter 1 was generated (check Actions log)
4. Check browser console for errors

### Chapter Generation Quality Issues

**Cause**: Prompts need adjustment  
**Fix**:
1. Edit `scripts/stranger-novel/prompts/chapter_prompt.txt`
2. Edit `scripts/stranger-novel/prompts/summary_prompt.txt`
3. Commit changes
4. Next run will use updated prompts

## Post-Deployment Monitoring

### Daily Checks (First Week)

- [ ] Day 1: Verify Chapter 2 generated at 11:00 UTC
- [ ] Day 2: Verify Chapter 3 generated
- [ ] Day 3: Verify Chapter 4 generated
- [ ] Day 4: Check generation time and quality
- [ ] Day 5: Review continuity between chapters
- [ ] Day 6: Check summaries are useful
- [ ] Day 7: Verify no workflow failures

### Weekly Checks (Ongoing)

- [ ] Review chapter quality and style consistency
- [ ] Check Gemini API usage and costs
- [ ] Verify no workflow failures
- [ ] Monitor chapter count progress
- [ ] Review user feedback (if any)

### Monthly Tasks

- [ ] Review overall novel progress
- [ ] Check if approaching planned chapter count (18-20)
- [ ] Consider adjustments to prompts if needed
- [ ] Review API costs
- [ ] Rotate GitHub token if needed

## Rollback Plan (If Needed)

If something goes wrong and you need to rollback:

1. **Disable Workflow**:
   - Go to Actions → Daily Gemini Stranger Novel Chapter to Gist
   - Click "..." → Disable workflow

2. **Revert Code**:
   ```bash
   git revert [commit-hash]
   git push
   ```

3. **Remove Secret**:
   - Settings → Secrets → Remove `STRANGER_GIST_ID`

4. **Clean Up**:
   - Delete the Gist if desired
   - Remove files from repository if needed

## Success Criteria

The deployment is successful when:

- ✅ Workflow runs without errors
- ✅ Chapter 1 is generated and visible in Gist
- ✅ Both novels appear on home page
- ✅ Clicking each novel works correctly
- ✅ Chapter content matches expected style
- ✅ Daily generation works for at least 3 consecutive days
- ✅ No security issues detected
- ✅ No performance degradation

## Support Resources

- **Setup Guide**: `SETUP_STRANGER_NOVEL.md`
- **Environment Variables**: `ENVIRONMENT_VARIABLES.md`
- **Technical Details**: `IMPLEMENTATION_SUMMARY.md`
- **Novel Documentation**: `docs/stranger-novel/README.md`
- **Main README**: `README.md`

## Contact

For issues or questions:
1. Check the Actions log for detailed error messages
2. Review troubleshooting sections in documentation
3. Verify all secrets are correctly configured
4. Open an issue in the repository

---

## Quick Command Reference

```bash
# Test locally
cd mockpoet
python3 -m http.server 8000
# Visit http://localhost:8000

# Check Python syntax
python3 -m py_compile scripts/stranger-novel/stranger_novel_daily_to_gist.py

# Check JavaScript syntax
node --check config.js
node --check scripts/api.js
node --check scripts/home.js
node --check scripts/reader.js

# Manual chapter generation (local testing)
export GEMINI_API_KEY="your-key"
export GIST_TOKEN="your-token"
export STRANGER_GIST_ID="your-gist-id"
python3 scripts/stranger-novel/stranger_novel_daily_to_gist.py
```

---

**Ready to deploy? Start with Step 1 above!**
