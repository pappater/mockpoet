import { CONFIG } from '../config';

// Get the base path from Vite's BASE_URL environment variable
const BASE_PATH = import.meta.env.BASE_URL;

/**
 * Get novel configuration by key
 * @param {string} novelKey - The novel key
 * @returns {Object} Novel configuration
 */
function getNovelConfig(novelKey) {
  if (CONFIG.novels && CONFIG.novels[novelKey]) {
    return CONFIG.novels[novelKey];
  }
  // Fallback to legacy config
  return {
    title: "The Weight of Promises",
    gist: CONFIG.gist,
    localPath: CONFIG.localPath
  };
}

/**
 * Get book type by key
 * @param {string} novelKey - The novel key
 * @returns {string} Book type (novel, poems, short_stories)
 */
export function getBookType(novelKey) {
  const novel = getNovelConfig(novelKey);
  return novel.type || 'novel';
}

/**
 * Get all available novels
 * @returns {Array} Array of novel objects with key, title, and type
 */
export function getAvailableNovels() {
  if (!CONFIG.novels) {
    return [{
      key: 'weight_of_promises',
      title: 'The Weight of Promises'
    }];
  }
  return Object.keys(CONFIG.novels).map(key => ({
    key: key,
    title: CONFIG.novels[key].title,
    type: CONFIG.novels[key].type || 'novel'
  }));
}

/**
 * Fetch chapters metadata from the gist
 * @param {string} novelKey - Novel key
 * @returns {Promise<Object>} The chapters data
 */
export async function fetchChaptersData(novelKey) {
  const novel = getNovelConfig(novelKey);
  const GIST_BASE_URL = `https://gist.githubusercontent.com/${novel.gist.username}/${novel.gist.id}/raw`;
  const CHAPTERS_JSON_URL = `${GIST_BASE_URL}/chapters.json`;
  const LOCAL_CHAPTERS_JSON_URL = `${BASE_PATH}${novel.localPath}/chapters.json`;
  
  try {
    // Try fetching from gist first
    try {
      const response = await fetch(CHAPTERS_JSON_URL);
      if (response.ok) {
        return await response.json();
      }
    } catch (gistError) {
      console.log('Gist fetch failed, trying local file:', gistError);
    }

    // Fallback to local file
    const response = await fetch(LOCAL_CHAPTERS_JSON_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch chapters: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching chapters data:', error);
    throw error;
  }
}

/**
 * Fetch chapter content from the gist
 * @param {string} url - The URL of the chapter content
 * @param {string} filename - The filename of the chapter
 * @param {string} novelKey - Novel key
 * @returns {Promise<string>} The chapter content as markdown
 */
export async function fetchChapterContent(url, filename, novelKey) {
  const novel = getNovelConfig(novelKey);
  
  try {
    // Try fetching from gist first
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.text();
      }
    } catch (gistError) {
      console.log('Gist fetch failed for chapter, trying local file:', gistError);
    }

    // Fallback to local file
    const localUrl = `${BASE_PATH}${novel.localPath}/${filename}`;
    const response = await fetch(localUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch chapter content: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error fetching chapter content:', error);
    throw error;
  }
}

/**
 * Parse markdown to HTML (simple parser for common markdown elements)
 * @param {string} markdown - The markdown content
 * @returns {string} HTML content
 */
export function parseMarkdown(markdown) {
  let html = markdown;

  // Headers (process most specific first)
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold (process before italic to avoid conflicts)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Italic (process after bold)
  html = html.replace(/\*([^*]+?)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+?)_/g, '<em>$1</em>');

  // Line breaks and paragraphs
  const lines = html.split('\n');
  const processedLines = [];
  let inParagraph = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === '') {
      if (inParagraph) {
        processedLines.push('</p>');
        inParagraph = false;
      }
    } else if (line.startsWith('<h') || line.startsWith('<ul') || line.startsWith('<ol')) {
      if (inParagraph) {
        processedLines.push('</p>');
        inParagraph = false;
      }
      processedLines.push(line);
    } else {
      if (!inParagraph) {
        processedLines.push('<p>');
        inParagraph = true;
      }
      processedLines.push(line);
    }
  }

  if (inParagraph) {
    processedLines.push('</p>');
  }

  return processedLines.join('\n');
}
