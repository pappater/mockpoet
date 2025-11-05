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
- **Chapters**: 7 available (ongoing)
- **Generated**: Daily at 10:00 UTC

### The Indifferent Shore
A Camus-inspired existentialist novel exploring themes of absurdism, alienation, and the indifference of the universe.
- **Style**: Sparse, declarative prose with focus on sensory detail
- **Chapters**: ~18-20 planned (~200 pages)
- **Generated**: Daily at 11:00 UTC

### Moonbound Devotion
A contemporary werewolf fantasy romance in the style of popular Wattpad stories, featuring fated mates, complete devotion, and passionate love.
- **Style**: Emotional, contemporary romance with rich fantasy world-building
- **Chapters**: 25 planned (~500-600 pages)
- **Generated**: Daily at 12:00 UTC

## Quick Start

1. Visit the [deployed site](#) or run locally:
   ```bash
   npm install
   npm run dev
   ```

2. Browse available novels on the home page
3. Click a novel to start reading
4. Navigate between chapters using the sidebar

## Setup

For detailed setup instructions, see:
- [SETUP_STRANGER_NOVEL.md](SETUP_STRANGER_NOVEL.md) - Setup for "The Indifferent Shore"
- [SETUP_WEREWOLF_NOVEL.md](SETUP_WEREWOLF_NOVEL.md) - Setup for "Moonbound Devotion"
- [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) - Environment variables reference
- [docs/novel-gist/README.md](docs/novel-gist/README.md) - Original novel documentation

## Repository Structure

```
rabbit/
├── .github/workflows/          # GitHub Actions workflows
│   ├── daily-novel-gist.yml   # The Weight of Promises
│   ├── daily-stranger-novel.yml # The Indifferent Shore
│   ├── daily-werewolf-novel.yml # Moonbound Devotion
│   └── deploy.yml             # Deploy React app to GitHub Pages
├── docs/                       # Novel content files
│   ├── novel-gist/            # The Weight of Promises
│   ├── stranger-novel/        # The Indifferent Shore
│   └── werewolf-novel/        # Moonbound Devotion
├── public/                     # Static assets (copied to dist)
│   └── docs/                  # Novel content (symlinked)
├── scripts/                    # Backend scripts
│   ├── novel/                 # Weight of Promises generation
│   ├── stranger-novel/        # Indifferent Shore generation
│   └── werewolf-novel/        # Moonbound Devotion generation
├── src/                        # React source code
│   ├── components/            # Reusable React components
│   ├── pages/                 # Page components (Home, Reader)
│   ├── services/              # API service
│   ├── hooks/                 # Custom hooks (useTheme)
│   └── test/                  # Test setup
├── index.html                  # Vite entry point
├── vite.config.js             # Vite configuration
├── package.json               # Node.js dependencies
└── README.md                  # This file
```

## Technology

- **Frontend**: React 19, React Router, Vite 7
- **Testing**: Vitest, React Testing Library
- **AI**: Google Gemini AI (gemini-2.5-flash)
- **Storage**: GitHub Gists
- **Automation**: GitHub Actions

## Development

### Prerequisites
- Node.js 20 or higher
- npm

### Commands
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run linter
npm run lint
```

### Marking a Book as Complete

When a novel reaches its final chapter and is complete:

1. **Update chapters.json**: Set the `completed` field to `true` in the location:
   - `docs/[novel-folder]/chapters.json`
   
   Example:
   ```json
   {
     "novel_title": "The Weight of Promises",
     "total_chapters": 16,
     "completed": true,
     ...
   }
   ```

2. **Disable the Cron Job**: Update the corresponding workflow file in `.github/workflows/`:
   - For "The Weight of Promises": `.github/workflows/daily-novel-gist.yml`
   - For "The Indifferent Shore": `.github/workflows/daily-stranger-novel.yml`
   - For "Moonbound Devotion": `.github/workflows/daily-werewolf-novel.yml`
   
   Comment out or remove the `schedule` section:
   ```yaml
   on:
     # schedule:
     #   - cron: '0 10 * * *'
     workflow_dispatch:  # Keep manual trigger for debugging
   ```

3. **Effects of Completion**:
   - A "— The End —" indicator will appear at the end of the final chapter
   - No more chapters will be generated automatically
   - The manual workflow trigger remains available for maintenance

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## License

[Add your license here]