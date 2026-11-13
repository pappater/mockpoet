/**
 * Convert a chapter name to a URL-friendly slug (supports Unicode scripts like Tamil)
 * @param {string} text - The chapter name
 * @returns {string} URL-friendly slug
 */
export function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFC')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\p{L}\p{M}\p{N}_-]+/gu, '')
    .replace(/__+/g, '_')
    .replace(/^_+/, '')
    .replace(/_+$/, '');
}

/**
 * Get the canonical slug for a chapter object, falling back to chapter_<num> for non-slug titles
 * @param {Object} chapter
 * @returns {string}
 */
export function getChapterSlug(chapter) {
  if (!chapter) return '';
  const nameSlug = slugify(chapter.chapter_name);
  return nameSlug || `entry_${chapter.chapter}`;
}

/**
 * Find a chapter by its slug
 * @param {Array} chapters - Array of chapter objects
 * @param {string} slug - The URL slug
 * @returns {Object|null} The matching chapter object or null
 */
export function findChapterBySlug(chapters, slug) {
  if (!slug || !chapters) return null;
  let decodedSlug = slug;
  try {
    decodedSlug = decodeURIComponent(slug).normalize('NFC');
  } catch {
    decodedSlug = slug;
  }

  return chapters.find(chapter => {
    if (getChapterSlug(chapter) === decodedSlug) return true;
    if (!chapter.chapter_name) return false;
    return slugify(chapter.chapter_name) === decodedSlug;
  }) || null;
}
