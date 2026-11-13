import { fetchChaptersData, fetchChapterContent } from './api';

const SOURCE_MAP = {
  quotes: [
    { key: 'pocket_wisdom', language: 'both' },
  ],
  poems: [
    { key: 'tamil_poetry', language: 'tamil' },
    { key: 'salt_and_amber', language: 'english' },
    { key: 'hydrogen_jukebox', language: 'english' },
    { key: 'of_old_man', language: 'english' },
  ],
  short_stories: [
    { key: 'paper_lantern', language: 'english' },
    { key: 'flying_banana', language: 'english' },
  ],
  essays: [
    { key: 'curious_ledger', language: 'english' },
  ],
};

function extractQuoteFromMarkdown(markdown, fallbackTitle) {
  if (!markdown) return fallbackTitle || 'Quiet reflection from mockpoet.';

  // Check explicit quote comment metadata first
  const commentMatch = markdown.match(/<!--\s*Quote:\s*(.+?)\s*-->/);
  if (commentMatch && commentMatch[1]) {
    return commentMatch[1].trim();
  }

  // Check blockquote line
  const lines = markdown
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const bq = lines.find((l) => l.startsWith('> '));
  if (bq) {
    return bq.replace(/^>\s*/, '').replace(/^["“]|["”]$/g, '').trim();
  }

  // Otherwise pick first 1-2 crisp lines after H1
  const bodyLines = lines.filter((l) => !l.startsWith('#') && !l.startsWith('---'));
  const snippet = bodyLines.slice(0, 2).join(' ').replace(/[*_`]/g, '').trim();
  if (!snippet) return fallbackTitle || 'A fresh reading awaits on mockpoet.';
  return snippet.length > 180 ? `${snippet.slice(0, 177).trim()}…` : snippet;
}

/**
 * Fetch a real short quote / stanza / story gist matching the user's language and content preferences
 */
export async function getQuoteForNotification({
  language = 'both',
  contentTypes = ['quotes', 'poems', 'short_stories', 'essays'],
} = {}) {
  const activeTypes = contentTypes.length > 0 ? contentTypes : ['quotes', 'poems'];
  let candidates = [];

  for (const type of activeTypes) {
    const sources = SOURCE_MAP[type] || [];
    for (const src of sources) {
      if (language === 'tamil' && src.language === 'english') continue;
      if (language === 'english' && src.language === 'tamil') continue;
      candidates.push({ ...src, type });
    }
  }

  if (candidates.length === 0) {
    candidates = [{ key: 'pocket_wisdom', language: 'both', type: 'quotes' }];
  }

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  const meta = await fetchChaptersData(chosen.key);
  let chapters = meta.chapters || [];

  // Filter bilingual Pocket Wisdom by exact selected language
  if (chosen.key === 'pocket_wisdom' && language !== 'both') {
    const filtered = chapters.filter(
      (c) => (c.language || '').toLowerCase() === language.toLowerCase()
    );
    if (filtered.length > 0) chapters = filtered;
  }

  if (chapters.length === 0) {
    return {
      title: meta.novel_title || 'mockpoet',
      body: 'A new literary edition is waiting in your reading room.',
      novelKey: chosen.key,
    };
  }

  const entry = chapters[Math.floor(Math.random() * chapters.length)];
  let quoteText = entry.quote || '';
  if (!quoteText) {
    const md = await fetchChapterContent(entry.url, entry.filename, chosen.key);
    quoteText = extractQuoteFromMarkdown(md, entry.chapter_name);
  }

  return {
    title: `${meta.novel_title} · ${entry.chapter_name || `Entry ${entry.chapter}`}`,
    body: quoteText,
    novelKey: chosen.key,
    chapter: entry,
  };
}

/**
 * Build today's daily digest (latest short story gist + daily quote) for email notifications
 */
export async function buildDailyEmailDigestContent({ language = 'both' } = {}) {
  let storyTitle = 'Daily Short Fiction';
  let storyGist = 'Explore today’s literary short story on mockpoet.';

  try {
    const storyMeta = await fetchChaptersData('paper_lantern');
    const latestStory = storyMeta.chapters?.[storyMeta.chapters.length - 1];
    if (latestStory) {
      storyTitle = latestStory.chapter_name || storyTitle;
      const md = await fetchChapterContent(latestStory.url, latestStory.filename, 'paper_lantern');
      const cleaned = md
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/^#.*$/gm, '')
        .replace(/[*_`>#]/g, '')
        .trim();
      storyGist = cleaned.slice(0, 420).trim() + (cleaned.length > 420 ? '…' : '');
    }
  } catch {
    // fallback already set
  }

  const quote = await getQuoteForNotification({
    language,
    contentTypes: ['quotes', 'poems'],
  });

  const siteUrl = 'https://pappater.github.io/mockpoet/';
  const subject = `mockpoet Digest: ${storyTitle}`;
  const plainText = [
    `SHORT STORY GIST — ${storyTitle}`,
    storyGist,
    '',
    `QUOTE OF THE MOMENT (${quote.title})`,
    `"${quote.body}"`,
    '',
    `Read full editions: ${siteUrl}`,
  ].join('\n');

  const htmlBody = `
    <div style="font-family: Georgia, serif; background:#FBF9F5; color:#1C1917; padding:24px;">
      <div style="max-width:600px; margin:0 auto; background:#FFFFFF; border:1px solid #E3DDD3; border-radius:8px; padding:24px;">
        <p style="font-family:monospace; font-size:12px; color:#9A3412; text-transform:uppercase; margin:0 0 8px;">
          mockpoet · Literary Digest
        </p>
        <h2 style="margin:0 0 12px; font-size:22px;">Short Story Gist: ${storyTitle}</h2>
        <p style="line-height:1.65; color:#292524;">${storyGist}</p>
        <hr style="border:none; border-top:1px solid #E3DDD3; margin:20px 0;" />
        <p style="font-family:monospace; font-size:11px; color:#6B655E; text-transform:uppercase; margin:0 0 6px;">
          ${quote.title}
        </p>
        <blockquote style="margin:0 0 16px; padding-left:14px; border-left:2px solid #9A3412; font-style:italic; font-size:16px;">
          ${quote.body}
        </blockquote>
        <p style="margin-top:20px;">
          <a href="${siteUrl}" style="color:#9A3412; font-weight:bold;">Open mockpoet Reading Room →</a>
        </p>
      </div>
    </div>
  `;

  return { subject, plainText, htmlBody, storyTitle, storyGist, quote };
}
