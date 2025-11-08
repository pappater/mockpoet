# Hemingway Novel - Usage Instructions

## Quick Start

The Hemingway-style novel "The Sun Also Rises Again" has been added to the mockpoet platform. This document provides instructions for generating and using the novel.

## Novel Characteristics

- **Title**: The Sun Also Rises Again
- **Style**: Ernest Hemingway's minimalist prose
- **Length**: 25 chapters (~200-500 pages)
- **Generation**: All chapters at once (not daily)
- **Features**: 
  - Simple, direct sentences
  - Heavy use of dialogue (50%+ of content)
  - Understated emotion
  - Concrete, sensory details
  - Iceberg theory (much left unsaid)

## Setup Required

### 1. Create GitHub Gist

```bash
# Go to https://gist.github.com and create a new public gist
# Copy the Gist ID from the URL
```

### 2. Add GitHub Secret

```bash
# Repository Settings → Secrets and variables → Actions
# Add secret: HEMINGWAY_GIST_ID with your Gist ID
```

### 3. Update Configuration

Update both `config.js` and `src/config.js` with your actual Gist ID:

```javascript
sun_also_rises_again: {
  title: "The Sun Also Rises Again",
  gist: {
    username: 'pappater',
    id: 'your-actual-gist-id'  // Replace with HEMINGWAY_GIST_ID
  },
  localPath: 'docs/hemingway-novel'
}
```

## Generating the Novel

### Prerequisites

```bash
# Install Python dependencies
pip install -r scripts/hemingway-novel/requirements.txt

# Set environment variables
export GEMINI_API_KEY="your-gemini-api-key"
export GEMINI_MODEL="gemini-2.5-flash"
export GIST_TOKEN="your-github-token"
export HEMINGWAY_GIST_ID="your-gist-id"
```

### Run Generation

```bash
python3 scripts/hemingway-novel/hemingway_novel_to_gist.py
```

**Note**: This will take 1-2 hours to generate all 25 chapters.

### What Gets Generated

The script creates:
- `series_bible.md` - Characters, setting, themes
- `outline.md` - Complete chapter outline
- `chapter_001.md` through `chapter_025.md` - Novel chapters
- `summaries.md` - Chapter summaries
- `continuity_log.txt` - Generation log
- `chapters.json` - Metadata for UI

All files are uploaded to your GitHub Gist.

## Using the Novel in the UI

### Local Development

```bash
npm run dev
# Visit http://localhost:5173/mockpoet/
# The novel will appear on the home page
```

### Production Deployment

```bash
npm run build
# Deploy the dist/ directory to your hosting service
# The novel will be accessible via the deployed site
```

## File Locations

```
mockpoet/
├── docs/hemingway-novel/          # Local copies
│   ├── chapters.json              # Metadata
│   └── (other generated files)
├── public/docs/hemingway-novel/   # Public assets
│   └── chapters.json              # Deployed metadata
└── scripts/hemingway-novel/       # Generation scripts
    ├── hemingway_novel_to_gist.py
    ├── requirements.txt
    └── prompts/
```

## Customization Options

### Adjust Chapter Count

Edit `scripts/hemingway-novel/hemingway_novel_to_gist.py`:

```python
TOTAL_CHAPTERS = 30  # Change from 25
```

### Change Theme

Edit the same file:

```python
THEME = "Your new theme"
```

### Modify Writing Style

Edit prompt files in `scripts/hemingway-novel/prompts/`:
- `bible_prompt.txt` - Character/setting generation
- `outline_prompt.txt` - Story structure
- `chapter_prompt.txt` - Chapter generation style
- `summary_prompt.txt` - Summary format

## Troubleshooting

### Novel Not Showing in UI

1. Check `chapters.json` exists in `docs/hemingway-novel/`
2. Verify Gist ID in both config files
3. Ensure Gist is public (not secret)
4. Clear browser cache
5. Check browser console for errors

### Generation Failed

Common issues:
- Missing environment variable (HEMINGWAY_GIST_ID, GEMINI_API_KEY, GIST_TOKEN)
- Invalid API key or quota exceeded
- Gist is secret instead of public
- Network connectivity problems

### Style Issues

If the generated style doesn't match expectations:
- Adjust prompts in `scripts/hemingway-novel/prompts/`
- Regenerate specific chapters
- Consider reducing complexity in prompt requirements

## Maintenance

### Regenerate Novel

```bash
# Back up existing content if needed
# Then run generation script again
python3 scripts/hemingway-novel/hemingway_novel_to_gist.py

# New content will overwrite old content in Gist
```

### Update Local Files

After regeneration, copy files from Gist to local:

```bash
# Download chapters.json and update local copies
# Commit changes to repository
git add docs/hemingway-novel/ public/docs/hemingway-novel/
git commit -m "Update Hemingway novel content"
git push
```

## API Endpoints

The novel is accessible via these endpoints:

### Gist URL
```
https://gist.githubusercontent.com/pappater/{GIST_ID}/raw/chapters.json
https://gist.githubusercontent.com/pappater/{GIST_ID}/raw/chapter_001.md
```

### Local URL
```
/mockpoet/docs/hemingway-novel/chapters.json
```

## Integration with UI

The novel integrates automatically with the existing UI:

1. **Home Page**: Shows novel card with chapter count
2. **Reader Page**: Displays chapters with navigation
3. **API Service**: Fetches from Gist or local fallback
4. **No Code Changes**: Uses existing BookCard and Reader components

## Performance Considerations

### Generation Time

- 25 chapters: ~1-2 hours
- 30 chapters: ~2-3 hours
- 50 chapters: ~4-5 hours

### API Rate Limits

Gemini API has rate limits:
- Free tier: ~60 requests per minute
- Consider paid tier for faster generation
- Script handles rate limiting automatically

### Storage

- Each chapter: ~2-3 KB
- Total novel: ~50-75 KB
- Gist size limit: 100 MB (plenty of room)

## Security Notes

- Never commit secrets to repository
- Use environment variables for sensitive data
- Keep Gists public for UI access
- Rotate tokens periodically

## Support Resources

- [SETUP_HEMINGWAY_NOVEL.md](SETUP_HEMINGWAY_NOVEL.md) - Detailed setup guide
- [docs/hemingway-novel/README.md](docs/hemingway-novel/README.md) - Novel documentation
- [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) - Environment configuration
- [Hemingway's Writing Style](https://en.wikipedia.org/wiki/Ernest_Hemingway#Writing_style) - Style reference

## Example Workflow

### Complete Setup and Generation

```bash
# 1. Create Gist and get ID
HEMINGWAY_GIST_ID="abc123def456"

# 2. Add to GitHub Secrets
# Settings → Secrets → HEMINGWAY_GIST_ID

# 3. Update configs
# Edit config.js and src/config.js

# 4. Set local environment
export GEMINI_API_KEY="your-key"
export GEMINI_MODEL="gemini-2.5-flash"
export GIST_TOKEN="your-token"
export HEMINGWAY_GIST_ID="abc123def456"

# 5. Install dependencies
pip install -r scripts/hemingway-novel/requirements.txt

# 6. Generate novel
python3 scripts/hemingway-novel/hemingway_novel_to_gist.py

# 7. Test locally
npm run dev

# 8. Build for production
npm run build

# 9. Deploy
# Upload dist/ to your hosting service
```

## Future Enhancements

Possible improvements:
- Add workflow for automatic generation
- Support for multiple Hemingway-style novels
- Interactive chapter regeneration
- Style customization UI
- Export to PDF/EPUB

## Comparison with Other Novels

| Feature | Weight of Promises | Hemingway Novel |
|---------|-------------------|-----------------|
| Style | Dostoevsky | Hemingway |
| Generation | Daily | All at once |
| Chapters | Variable | Fixed (25) |
| Dialogue | Some | Heavy (50%+) |
| Sentences | Complex | Simple |
| Emotion | Explicit | Understated |

## Questions?

If you encounter issues or have questions:

1. Check troubleshooting section
2. Review setup documentation
3. Verify environment variables
4. Check script output for errors
5. Consult example workflow

---

**Last Updated**: 2025-11-07
**Version**: 1.0
**Status**: Ready for use
