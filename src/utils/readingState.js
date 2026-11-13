const PROGRESS_KEY = 'mockpoet_reading_progress_v1';
const BOOKMARKS_KEY = 'mockpoet_bookmarks_v1';
const APPRECIATION_KEY = 'mockpoet_appreciation_v1';
const STREAK_KEY = 'mockpoet_reading_streak_v1';
const PREFS_KEY = 'mockpoet_reader_prefs_v1';

function safeParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSave(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota issues
  }
}

export function getReadingProgress() {
  return safeParse(PROGRESS_KEY, {});
}

export function recordReadingProgress({ novelKey, bookTitle, chapterNum, chapterName, bookType, totalChapters }) {
  if (!novelKey || !chapterNum) return;
  const all = getReadingProgress();
  const prev = all[novelKey] || {};
  const visitedChapters = Array.isArray(prev.visitedChapters) ? prev.visitedChapters : [];
  if (!visitedChapters.includes(chapterNum)) {
    visitedChapters.push(chapterNum);
  }
  all[novelKey] = {
    novelKey,
    bookTitle: bookTitle || prev.bookTitle || novelKey,
    chapterNum,
    chapterName: chapterName || `Entry ${chapterNum}`,
    bookType: bookType || prev.bookType || 'novel',
    totalChapters: totalChapters || prev.totalChapters || 1,
    visitedChapters,
    updatedAt: Date.now(),
  };
  safeSave(PROGRESS_KEY, all);
  updateReadingStreak();
}

export function getMostRecentRead() {
  const all = getReadingProgress();
  const entries = Object.values(all);
  if (!entries.length) return null;
  entries.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return entries[0];
}

export function getBookmarks() {
  return safeParse(BOOKMARKS_KEY, []);
}

export function isBookmarked(novelKey, chapterNum) {
  return getBookmarks().some(b => b.novelKey === novelKey && b.chapterNum === chapterNum);
}

export function toggleBookmark({ novelKey, bookTitle, chapterNum, chapterName, bookType }) {
  const list = getBookmarks();
  const exists = list.some(b => b.novelKey === novelKey && b.chapterNum === chapterNum);
  const next = exists
    ? list.filter(b => !(b.novelKey === novelKey && b.chapterNum === chapterNum))
    : [{ novelKey, bookTitle, chapterNum, chapterName, bookType, savedAt: Date.now() }, ...list];
  safeSave(BOOKMARKS_KEY, next);
  return !exists;
}

export function getAppreciations() {
  return safeParse(APPRECIATION_KEY, {});
}

export function isAppreciated(novelKey, chapterNum) {
  const map = getAppreciations();
  return Boolean(map[`${novelKey}:${chapterNum}`]);
}

export function toggleAppreciation(novelKey, chapterNum) {
  const map = getAppreciations();
  const key = `${novelKey}:${chapterNum}`;
  const nextVal = !map[key];
  if (nextVal) {
    map[key] = true;
  } else {
    delete map[key];
  }
  safeSave(APPRECIATION_KEY, map);
  return nextVal;
}

export function getReadingStreak() {
  return safeParse(STREAK_KEY, { days: 0, lastDate: null, totalEntriesRead: 0 });
}

function updateReadingStreak() {
  const today = new Date().toISOString().slice(0, 10);
  const current = getReadingStreak();
  const progress = getReadingProgress();
  const totalEntriesRead = Object.values(progress).reduce(
    (sum, item) => sum + (Array.isArray(item.visitedChapters) ? item.visitedChapters.length : 0),
    0
  );

  if (current.lastDate === today) {
    safeSave(STREAK_KEY, { ...current, totalEntriesRead });
    return;
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const nextDays = current.lastDate === yesterday ? current.days + 1 : 1;
  safeSave(STREAK_KEY, { days: nextDays, lastDate: today, totalEntriesRead });
}

export function getReaderPrefs() {
  return safeParse(PREFS_KEY, {
    fontSize: 18,
    fontFamily: 'serif',
    measure: 'standard',
  });
}

export function saveReaderPrefs(prefs) {
  safeSave(PREFS_KEY, prefs);
}
