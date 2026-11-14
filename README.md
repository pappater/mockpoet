# mockpoet

**Live Reading Room (GitHub Pages):** [https://pappater.github.io/mockpoet/](https://pappater.github.io/mockpoet/)

An archival literary reading room hosting completed novels, daily short fiction, English & Tamil poetry, leveled essays, serialized dramas, and bilingual quotes—powered by **Google Gemini (`gemini-4-hydrogen`)** and **GitHub Pages**.

---

## Features

- **Six Literary Sections**: Novels, Short Stories, Poetry Collections (English & Tamil), Essays (Low / Medium / High difficulty), Serialized Stage Dramas, and Bilingual Quotes & Micro-Reflections.
- **Kindle & Tamil E-Reader Downloads**: Download any complete book or collection as a standards-compliant **Kindle `.epub`**, **UTF-8 HTML**, or **PDF** (with native Unicode print-to-PDF support for Tamil script).
- **Google Sign-In**: Single Sign in with Google keeps your notification preferences, bookmarks, highlights, margin notes, and reading streak saved privately to your account.
- **macOS & Windows Desktop Notifications**: Opt into native OS notifications delivering curated English or Tamil quotes, Kurals, poetry stanzas, and short reflections on your chosen cadence.
- **Daily Email Digests**: Opt into daily short-story gist + quote email digests via signed-in Gmail or automated GitHub Actions Gmail SMTP.
- **Interactive Reading Studio**: Four paper tones (Warm Paper, Sepia, Slate Soft, Midnight Ink), Scroll & Book Pages modes, interactive paragraph highlights & margin notes, drama cast spotlight, slide-over table of contents, and sentence-synced audio narration.

---

## Library Catalog

### 1. Novels (Completed Editions)
| Title | Style / Genre | Chapters | Status |
|---|---|---|---|
| **The Weight of Promises** | Philosophical Fiction (Dostoevskian) | 31 | Completed |
| **The Indifferent Shore** | Existential Fiction (Camusian) | 28 | Completed |
| **Moonbound Devotion** | Paranormal Romance | 45 | Completed |
| **The Sun Also Rises Again** | Post-war Literary Prose | 25 | Completed |
| **Clueless Mind** | Psychological Chronicle | 67 | Completed |
| **The Bureaucratic Odyssey** | Corporate Satire | 31 | Completed |

### 2. Short Stories
- **The Paper Lantern** *(Ongoing · Daily at 13:00 UTC)* — Daily literary short stories inspired by classic world storytellers.
- **Flying Banana** *(Completed · 297 Stories)* — Complete archive of short stories inspired by modern classic authors.

### 3. Poetry Collections (English & Tamil)
- **Salt & Amber** *(Ongoing · Daily at 14:00 UTC)* — Daily English poetry across lyric and formal traditions.
- **காற்றில் கலந்த கவிதை (Tamil Poetry)** *(Ongoing · Daily at 15:00 UTC)* — Daily Tamil poetry spanning Sangam landscapes, Bharathiyar style, Venba couplets, and modern Pudukkavithai.
- **Hydrogen Jukebox** *(Completed · 298 Poems)*
- **Of Old Man** *(Completed · 297 Poems)*
- **Wandering Minstrel** *(Completed · 298 Ballads)*
- **Tumblr Poem Bot** *(Active · Hourly)* — Posts original poems to [@mockpoet on Tumblr](https://mockpoet.tumblr.com/).

### 4. Essays
- **The Curious Ledger** *(Ongoing · Daily at 16:00 UTC)* — Daily essays with a randomly selected reading difficulty of **Low**, **Medium**, or **High**.

### 5. Drama
- **The Clockmaker's Alibi** *(Ongoing · Daily at 17:00 UTC)* — 3-act chamber mystery (12 planned scenes; auto-completes upon finale).
- **Glass Houses on Monsoon Street** *(Ongoing · Daily at 18:00 UTC)* — 3-act courtyard tragicomedy (12 planned scenes; auto-completes upon finale).
- **The Absurd Ascent** *(Completed · 14 Scenes across 3 Acts)* — Completed theatrical farce.

### 6. Quotes & Micro-Reflections
- **Pocket Wisdom & Kurals** *(Ongoing · Daily at 14:30 UTC)* — Bilingual English aphorisms & Tamil couplets built for quick reading, desktop alerts, and email digests.

---

## Automated GitHub Actions & Secrets

All daily generators use the free-tier **`gemini-4-hydrogen`** model via the `google-genai` Python SDK.

### Required Repository Secrets
- `GEMINI_API_KEY` — Google Gemini API key
- `GIST_TOKEN` — GitHub Personal Access Token with `gist` scope
- Collection Gist IDs: `PAPER_LANTERN_GIST_ID`, `SALT_AND_AMBER_GIST_ID`, `TAMIL_POETRY_GIST_ID`, `CURIOUS_LEDGER_GIST_ID`, `CLOCKMAKERS_ALIBI_GIST_ID`, `MONSOON_STREET_GIST_ID`, `POCKET_WISDOM_GIST_ID`
- Optional Free Daily Email Digest Secrets: `GMAIL_ADDRESS`, `GMAIL_APP_PASSWORD`, `SUBSCRIBERS_GIST_ID`
- Tumblr Bot Secrets (untouched): `TUMBLR_CONSUMER_KEY`, `TUMBLR_CONSUMER_SECRET`, `TUMBLR_OAUTH_TOKEN`, `TUMBLR_OAUTH_SECRET`, `TUMBLR_BLOG_NAME`

---

## Local Development & Deployment

```bash
# Install dependencies
npm install

# Run local development server (port 3000)
npm run dev

# Run tests
npm test

# Lint & build for GitHub Pages
npm run lint
VITE_BASE_PATH=/mockpoet/ npm run build
```

Pushing changes to the `main` branch automatically triggers `.github/workflows/deploy.yml` to build and publish the site to [https://pappater.github.io/mockpoet/](https://pappater.github.io/mockpoet/).

## Technology

- **Frontend**: React 19, React Router 7, Vite 7, JSZip (Kindle `.epub`), jsPDF
- **Authentication & Gmail**: Firebase Auth (Google Sign-In) & Gmail API (zero-cost OAuth)
- **AI Generation**: Google Gemini (`gemini-4-hydrogen`) via `google-genai`
- **Persistence & Hosting**: GitHub Gists + GitHub Pages + GitHub Actions