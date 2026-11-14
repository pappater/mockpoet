import {
  getReadingProgress,
  getBookmarks,
  getAppreciations,
  getReadingStreak,
  getReaderPrefs,
  saveReaderPrefs,
  getHighlights,
  getMarginNotes,
} from '../utils/readingState';

const SETTINGS_STORAGE_PREFIX = 'mockpoet_user_settings_v1';
const PROFILE_STORE_PREFIX = 'mockpoet_private_profile_v1';

export const DEFAULT_USER_SETTINGS = {
  notifications: {
    enabled: false,
    language: 'both', // 'english' | 'tamil' | 'both'
    contentTypes: ['quotes', 'poems', 'short_stories', 'essays'],
    intervalMinutes: 120,
  },
  emailDigest: {
    optedIn: false,
    email: '',
    frequency: 'daily',
    language: 'both',
    includeShortStoryGist: true,
    includeQuote: true,
  },
};

function getProfileSuffix(user) {
  if (!user?.email) return 'guest';
  return user.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

export function buildPrivateProfilePayload(user, settings) {
  return {
    schema: 'mockpoet.user_settings.v2',
    updatedAt: new Date().toISOString(),
    profile: user
      ? {
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
        }
      : { email: 'guest' },
    settings,
    readerPrefs: getReaderPrefs(),
    bookmarks: getBookmarks(),
    appreciations: getAppreciations(),
    highlights: getHighlights(),
    marginNotes: getMarginNotes(),
    readingProgress: getReadingProgress(),
    streak: getReadingStreak(),
  };
}

export function getUserSettings(user = null) {
  const key = `${SETTINGS_STORAGE_PREFIX}_${getProfileSuffix(user)}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      // If signed in and guest had preferences configured, seed from guest once
      if (user?.email) {
        const guestRaw = localStorage.getItem(`${SETTINGS_STORAGE_PREFIX}_guest`);
        if (guestRaw) {
          const guestParsed = JSON.parse(guestRaw);
          return {
            notifications: { ...DEFAULT_USER_SETTINGS.notifications, ...(guestParsed.notifications || {}) },
            emailDigest: {
              ...DEFAULT_USER_SETTINGS.emailDigest,
              ...(guestParsed.emailDigest || {}),
              email: guestParsed.emailDigest?.email || user.email,
            },
          };
        }
      }
      return {
        ...DEFAULT_USER_SETTINGS,
        emailDigest: {
          ...DEFAULT_USER_SETTINGS.emailDigest,
          email: user?.email || '',
        },
      };
    }
    const parsed = JSON.parse(raw);
    return {
      notifications: { ...DEFAULT_USER_SETTINGS.notifications, ...(parsed.notifications || {}) },
      emailDigest: {
        ...DEFAULT_USER_SETTINGS.emailDigest,
        ...(parsed.emailDigest || {}),
        email: parsed.emailDigest?.email || user?.email || '',
      },
    };
  } catch {
    return DEFAULT_USER_SETTINGS;
  }
}

export function saveUserSettings(settings, user = null) {
  const suffix = getProfileSuffix(user);
  const key = `${SETTINGS_STORAGE_PREFIX}_${suffix}`;
  try {
    localStorage.setItem(key, JSON.stringify(settings));
    const snapshot = buildPrivateProfilePayload(user, settings);
    localStorage.setItem(`${PROFILE_STORE_PREFIX}_${suffix}`, JSON.stringify(snapshot));
  } catch {
    // ignore storage quota errors
  }
  window.dispatchEvent(new CustomEvent('mockpoetSettingsChanged', { detail: settings }));
}

export function restorePrivateProfile(user) {
  if (!user?.email) return getUserSettings(null);
  const suffix = getProfileSuffix(user);
  try {
    const raw = localStorage.getItem(`${PROFILE_STORE_PREFIX}_${suffix}`);
    if (raw) {
      const payload = JSON.parse(raw);
      if (payload.readerPrefs) saveReaderPrefs(payload.readerPrefs);
      if (Array.isArray(payload.bookmarks)) {
        localStorage.setItem('mockpoet_bookmarks_v1', JSON.stringify(payload.bookmarks));
      }
      if (payload.appreciations) {
        localStorage.setItem('mockpoet_appreciation_v1', JSON.stringify(payload.appreciations));
      }
      if (payload.highlights) {
        localStorage.setItem('mockpoet_highlights_v1', JSON.stringify(payload.highlights));
      }
      if (payload.marginNotes) {
        localStorage.setItem('mockpoet_margin_notes_v1', JSON.stringify(payload.marginNotes));
      }
      if (payload.settings) {
        localStorage.setItem(`${SETTINGS_STORAGE_PREFIX}_${suffix}`, JSON.stringify(payload.settings));
      }
    }
  } catch {
    // fallback cleanly
  }
  return getUserSettings(user);
}
