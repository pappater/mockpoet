// API Module - Handles data fetching from GitHub Gist
const API = (() => {
  // Use configuration from config.js
  const GIST_BASE_URL = `https://gist.githubusercontent.com/${CONFIG.gist.username}/${CONFIG.gist.id}/raw`;
  const CHAPTERS_JSON_URL = `${GIST_BASE_URL}/chapters.json`;
  const LOCAL_CHAPTERS_JSON_URL = `${CONFIG.localPath}/chapters.json`;

  /**
   * Fetch chapters metadata from the gist
   * @returns {Promise<Object>} The chapters data
   */
  async function fetchChaptersData() {
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
   * @returns {Promise<string>} The chapter content as markdown
   */
  async function fetchChapterContent(url, filename) {
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
      const localUrl = `${CONFIG.localPath}/${filename}`;
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
  function parseMarkdown(markdown) {
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

  // Public API
  return {
    fetchChaptersData,
    fetchChapterContent,
    parseMarkdown
  };
})();
