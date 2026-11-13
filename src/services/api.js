import { CONFIG } from '../config';

const BASE_PATH = import.meta.env.BASE_URL || '/';

function joinBasePath(relativePath) {
  const cleanBase = BASE_PATH.endsWith('/') ? BASE_PATH : `${BASE_PATH}/`;
  const cleanRel = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${cleanBase}${cleanRel}`;
}

function isHtmlFallback(text) {
  const trimmed = (text || '').trimStart().toLowerCase();
  return trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html');
}

/**
 * Get novel configuration by key
 * @param {string} novelKey - The novel key
 * @returns {Object} Novel configuration
 */
export function getNovelConfig(novelKey) {
  if (CONFIG.novels && CONFIG.novels[novelKey]) {
    return CONFIG.novels[novelKey];
  }
  return {
    title: 'The Weight of Promises',
    gist: CONFIG.gist,
    localPath: CONFIG.localPath,
    type: 'novel',
  };
}

/**
 * Get book type by key
 * @param {string} novelKey - The novel key
 * @returns {string} Book type (novel, poems, short_stories, essays, drama)
 */
export function getBookType(novelKey) {
  const novel = getNovelConfig(novelKey);
  return novel.type || 'novel';
}

/**
 * Get all available works
 * @returns {Array} Array of work metadata objects
 */
export function getAvailableNovels() {
  if (!CONFIG.novels) {
    return [{
      key: 'weight_of_promises',
      title: 'The Weight of Promises',
      type: 'novel',
    }];
  }
  return Object.keys(CONFIG.novels).map(key => ({
    key,
    title: CONFIG.novels[key].title,
    description: CONFIG.novels[key].description || '',
    type: CONFIG.novels[key].type || 'novel',
    language: CONFIG.novels[key].language || 'English',
  }));
}

/**
 * Fetch chapters metadata (local-first for reliability, with live Gist sync for ongoing series)
 * @param {string} novelKey - Work key
 * @returns {Promise<Object>} The chapters data
 */
export async function fetchChaptersData(novelKey) {
  const novel = getNovelConfig(novelKey);
  const localUrl = joinBasePath(`${novel.localPath}/chapters.json`);
  const hasGistId = Boolean(novel.gist?.id && novel.gist.id.trim().length > 0);
  const gistUrl = hasGistId
    ? `https://gist.githubusercontent.com/${novel.gist.username}/${novel.gist.id}/raw/chapters.json`
    : null;

  let localData = null;
  try {
    const localRes = await fetch(localUrl);
    if (localRes.ok) {
      const text = await localRes.text();
      if (!isHtmlFallback(text)) {
        localData = JSON.parse(text);
      }
    }
  } catch (err) {
    console.warn(`Local chapters.json load failed for ${novelKey}:`, err);
  }

  // If ongoing and has a Gist ID, check Gist for newer published entries
  if (localData && !localData.completed && gistUrl) {
    try {
      const gistRes = await fetch(gistUrl);
      if (gistRes.ok) {
        const gistData = await gistRes.json();
        if ((gistData.total_chapters || 0) > (localData.total_chapters || 0)) {
          return {
            ...localData,
            ...gistData,
            genre: localData.genre || gistData.genre,
            subgenre: localData.subgenre || gistData.subgenre,
            difficulty: localData.difficulty || gistData.difficulty,
            update_frequency: localData.update_frequency || gistData.update_frequency,
          };
        }
      }
    } catch {
      // Keep localData cleanly
    }
  }

  if (localData) {
    return localData;
  }

  if (gistUrl) {
    const response = await fetch(gistUrl);
    if (response.ok) {
      return await response.json();
    }
  }

  throw new Error(`Failed to load metadata for ${novelKey}`);
}

/**
 * Fetch chapter content (checks local static docs first, then remote Gist raw URL)
 * @param {string} url - Remote Gist raw URL
 * @param {string} filename - Local filename
 * @param {string} novelKey - Work key
 * @returns {Promise<string>} Markdown content
 */
export async function fetchChapterContent(url, filename, novelKey) {
  const novel = getNovelConfig(novelKey);
  const localUrl = joinBasePath(`${novel.localPath}/${filename}`);

  // Try local copy first when available (instant & avoids rate-limits)
  try {
    const localRes = await fetch(localUrl);
    if (localRes.ok) {
      const text = await localRes.text();
      if (!isHtmlFallback(text) && text.trim().length > 0) {
        return text;
      }
    }
  } catch {
    // Fall through to remote URL
  }

  if (url && url.trim().length > 0) {
    const remoteRes = await fetch(url);
    if (remoteRes.ok) {
      return await remoteRes.text();
    }
    throw new Error(`Failed to fetch content (${remoteRes.status})`);
  }

  throw new Error(`Content unavailable for ${filename}`);
}

/**
 * Estimate word count and reading time from markdown/HTML
 */
export function getTextStats(text) {
  const plain = (text || '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_`>[\]]/g, ' ')
    .trim();
  if (!plain) return { words: 0, minutes: 1 };
  const words = plain.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 210));
  return { words, minutes };
}

/**
 * Parse markdown to clean editorial HTML
 * @param {string} markdown - The markdown content
 * @param {string} bookType - Optional book type for drama formatting
 * @returns {string} HTML content
 */
export function parseMarkdown(markdown, bookType = 'novel') {
  if (!markdown) return '';
  let text = markdown.replace(/<!--[\s\S]*?-->/g, '').trim();

  // Remove the first H1 heading (chapter title) to avoid duplication with header
  text = text.replace(/^# .*$/m, '').trim();

  const escapeHtml = (str) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const formatInline = (line) => {
    let out = escapeHtml(line);
    out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/__(.+?)__/g, '<strong>$1</strong>');
    out = out.replace(/\*([^*]+?)\*/g, '<em>$1</em>');
    out = out.replace(/(^|\s)_([^_]+?)_/g, '$1<em>$2</em>');
    if (bookType === 'drama') {
      out = out.replace(/\[([^\]]+)\]/g, '<span class="stage-direction">[$1]</span>');
    }
    return out;
  };

  const lines = text.split('\n');
  const html = [];
  let paragraphLines = [];
  let inList = false;

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      const joined = bookType === 'poems'
        ? paragraphLines.map(formatInline).join('<br />')
        : paragraphLines.map(formatInline).join(' ');
      html.push(`<p>${joined}</p>`);
      paragraphLines = [];
    }
  };

  const closeList = () => {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line) {
      flushParagraph();
      closeList();
      continue;
    }

    if (/^---+$/.test(line)) {
      flushParagraph();
      closeList();
      html.push('<hr class="editorial-rule" />');
      continue;
    }

    if (line.startsWith('### ')) {
      flushParagraph();
      closeList();
      html.push(`<h3>${formatInline(line.slice(4))}</h3>`);
      continue;
    }

    if (line.startsWith('## ')) {
      flushParagraph();
      closeList();
      html.push(`<h2>${formatInline(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith('# ')) {
      flushParagraph();
      closeList();
      html.push(`<h1>${formatInline(line.slice(2))}</h1>`);
      continue;
    }

    if (line.startsWith('> ')) {
      flushParagraph();
      closeList();
      html.push(`<blockquote><p>${formatInline(line.slice(2))}</p></blockquote>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${formatInline(line.replace(/^[-*]\s+/, ''))}</li>`);
      continue;
    }

    if (bookType === 'drama' && /^[A-Z][A-Z\s.'-]{1,28}$/.test(line) && !line.endsWith('.')) {
      flushParagraph();
      closeList();
      html.push(`<p class="drama-speaker">${escapeHtml(line)}</p>`);
      continue;
    }

    closeList();
    paragraphLines.push(line);
  }

  flushParagraph();
  closeList();

  return html.join('\n');
}
