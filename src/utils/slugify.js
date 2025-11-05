/**
 * Convert a chapter name to a URL-friendly slug
 * @param {string} text - The chapter name
 * @returns {string} URL-friendly slug
 */
export function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')           // Replace spaces with _
    .replace(/[^\w-]+/g, '')        // Remove all non-word chars
    .replace(/__+/g, '_')           // Replace multiple _ with single _
    .replace(/^-+/, '')             // Trim _ from start of text
    .replace(/-+$/, '');            // Trim _ from end of text
}

/**
 * Find a chapter by its slug
 * @param {Array} chapters - Array of chapter objects
 * @param {string} slug - The URL slug
 * @returns {Object|null} The matching chapter object or null
 */
export function findChapterBySlug(chapters, slug) {
  if (!slug || !chapters) return null;
  
  return chapters.find(chapter => {
    if (!chapter.chapter_name) return false;
    return slugify(chapter.chapter_name) === slug;
  });
}
