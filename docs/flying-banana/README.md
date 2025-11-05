# Flying Banana - Short Story Collection

A collection of short stories written in the styles of modern classic authors.

## Overview

**Flying Banana** is a unique short story series where each story is written in the distinctive style of a randomly selected modern classic author. The stories range from 5,000 to 7,500 words and are generated daily using AI that carefully emulates the author's literary voice, themes, and techniques.

## Features

- **Daily Short Stories**: New story published every day at 13:00 UTC
- **Author Style Emulation**: Each story captures the essence of a great modern classic author
- **Standalone Stories**: Each story is complete and independent
- **Never-Ending Series**: This collection continues indefinitely
- **Literary Quality**: Serious, thoughtful stories exploring human experience

## Featured Authors

Each story is written in the style of one of these modern classic authors:

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

## Story Specifications

- **Length**: 5,000 - 7,500 words per story
- **Frequency**: One story per day
- **Format**: Complete standalone narratives
- **Style**: Varies based on selected author
- **Theme**: Literary, serious, exploring human condition

## Configuration

The collection is configurable through two files:

### authors.json
Lists all authors whose styles can be emulated. Can be updated to add or remove authors.

### config.json
```json
{
  "min_word_count": 5000,
  "max_word_count": 7500
}
```

## Technical Details

- **Generation**: Daily at 13:00 UTC via GitHub Actions
- **AI Model**: Google Gemini 2.5 Flash
- **Storage**: Published to GitHub Gist
- **Metadata**: Each story includes publish date/time and author style

## How It Works

1. **Daily Trigger**: GitHub Actions workflow runs once per day
2. **Author Selection**: Random author is selected from the authors list
3. **Story Generation**: AI generates a complete short story in that author's style
4. **Publication**: Story is published to GitHub Gist with metadata
5. **Update**: chapters.json is updated with the new story information

## Story Metadata

Each story includes:
- Story title (in the author's style)
- Complete narrative text
- Author style attribution
- Publication date and time (UTC)

## Reading Experience

Stories are presented chronologically and can be read in any order since each is standalone. The reader interface shows:
- Total number of stories available
- Story titles
- Publication dates
- Author style for each story

## Development

### Local Testing

```bash
# Set environment variables
export GEMINI_API_KEY="your-key"
export GIST_TOKEN="your-token"
export FLYING_BANANA_GIST_ID="your-gist-id"

# Run the generator
python scripts/flying-banana/flying_banana_daily_to_gist.py
```

### Adding Authors

To add new authors to the pool:

1. Edit `scripts/flying-banana/authors.json`
2. Add author name to the "authors" array
3. Commit and push changes

### Adjusting Word Count

To change story length:

1. Edit `scripts/flying-banana/config.json`
2. Adjust "min_word_count" and "max_word_count"
3. Commit and push changes

## Future Enhancements

Possible improvements:
- Author statistics (how often each author's style is used)
- Theme categories
- Reader favorites/ratings
- Search by author style
- Anthology compilation features
