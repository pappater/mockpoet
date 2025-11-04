# rabbit

A reading platform for AI-generated novels with daily chapter updates.

## Features

- **Multiple Novels**: Read different AI-generated novels in one platform
- **Daily Updates**: New chapters generated automatically every day
- **Clean UI**: Simple, elegant interface for reading
- **Mobile Responsive**: Read on any device
- **Theme Support**: Light and dark mode

## Available Novels

### The Weight of Promises
A Dostoevsky-inspired psychological novel exploring themes of debt, mercy, and moral obligation.
- **Style**: Rich, philosophical prose with deep character introspection
- **Chapters**: 5 available (ongoing)
- **Generated**: Daily at 10:00 UTC

### The Indifferent Shore
A Camus-inspired existentialist novel exploring themes of absurdism, alienation, and the indifference of the universe.
- **Style**: Sparse, declarative prose with focus on sensory detail
- **Chapters**: ~18-20 planned (~200 pages)
- **Generated**: Daily at 11:00 UTC

## Quick Start

1. Visit the [deployed site](#) or run locally:
   ```bash
   python3 -m http.server 8000
   ```

2. Browse available novels on the home page
3. Click a novel to start reading
4. Navigate between chapters using the sidebar

## Setup

For detailed setup instructions, see:
- [SETUP_STRANGER_NOVEL.md](SETUP_STRANGER_NOVEL.md) - Setup for "The Indifferent Shore"
- [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) - Environment variables reference
- [docs/novel-gist/README.md](docs/novel-gist/README.md) - Original novel documentation

## Repository Structure

```
rabbit/
├── .github/workflows/          # GitHub Actions workflows
│   ├── daily-novel-gist.yml   # The Weight of Promises
│   └── daily-stranger-novel.yml # The Indifferent Shore
├── components/                 # UI components
├── docs/
│   ├── novel-gist/            # The Weight of Promises files
│   └── stranger-novel/        # The Indifferent Shore files
├── scripts/
│   ├── novel/                 # Weight of Promises generation
│   ├── stranger-novel/        # Indifferent Shore generation
│   └── api.js, home.js, reader.js, theme.js
├── styles/                    # CSS files
├── config.js                  # Configuration
├── index.html                 # Home page
├── reader.html                # Reader page
└── README.md                  # This file
```

## Technology

- **Frontend**: Vanilla JavaScript, HTML, CSS
- **AI**: Google Gemini AI (gemini-2.5-flash)
- **Storage**: GitHub Gists
- **Automation**: GitHub Actions

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## License

[Add your license here]