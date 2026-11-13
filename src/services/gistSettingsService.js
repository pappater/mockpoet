import {
  getReadingProgress,
  getBookmarks,
  getAppreciations,
  getReadingStreak,
  getReaderPrefs,
  saveReaderPrefs,
} from '../utils/readingState';

const SETTINGS_STORAGE_PREFIX = 'mockpoet_user_settings_v1';
const GIST_LINK_PREFIX = 'mockpoet_user_gist_link_v1';

// GitHub PAT is stored in memory by default for security
let inMemoryGithubToken = '';

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

export function getUserSettings(user = null) {
  const key = `${SETTINGS_STORAGE_PREFIX}_${getProfileSuffix(user)}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
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
  const key = `${SETTINGS_STORAGE_PREFIX}_${getProfileSuffix(user)}`;
  try {
    localStorage.setItem(key, JSON.stringify(settings));
  } catch {
    // ignore quota
  }
  window.dispatchEvent(new CustomEvent('mockpoetSettingsChanged', { detail: settings }));
}

export function getLinkedGistId(user = null) {
  const key = `${GIST_LINK_PREFIX}_${getProfileSuffix(user)}`;
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

export function setLinkedGistId(gistId, user = null) {
  const key = `${GIST_LINK_PREFIX}_${getProfileSuffix(user)}`;
  try {
    if (gistId) {
      localStorage.setItem(key, gistId.trim());
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

export function setMemoryGithubToken(token) {
  inMemoryGithubToken = (token || '').trim();
}

export function getMemoryGithubToken() {
  return inMemoryGithubToken;
}

export function buildGistPayload(user, settings) {
  return {
    schema: 'mockpoet.user_settings.v1',
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
    readingProgress: getReadingProgress(),
    streak: getReadingStreak(),
  };
}

export function applyGistPayload(payload, user = null) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid settings payload.');
  }
  if (payload.settings) {
    saveUserSettings(payload.settings, user);
  }
  if (payload.readerPrefs) {
    saveReaderPrefs(payload.readerPrefs);
  }
  if (Array.isArray(payload.bookmarks)) {
    localStorage.setItem('mockpoet_bookmarks_v1', JSON.stringify(payload.bookmarks));
  }
  if (payload.appreciations && typeof payload.appreciations === 'object') {
    localStorage.setItem('mockpoet_appreciation_v1', JSON.stringify(payload.appreciations));
  }
  if (payload.readingProgress && typeof payload.readingProgress === 'object') {
    localStorage.setItem('mockpoet_reading_progress_v1', JSON.stringify(payload.readingProgress));
  }
  if (payload.streak && typeof payload.streak === 'object') {
    localStorage.setItem('mockpoet_reading_streak_v1', JSON.stringify(payload.streak));
  }
}

const SETTINGS_FILENAME = 'mockpoet_user_settings.json';

/**
 * Load settings from an existing GitHub Gist (public or secret Gist ID; token optional for public/secret Gist URLs)
 */
export async function loadSettingsFromGist(gistId, githubToken = '') {
  const cleanId = (gistId || '').trim().split('/').pop();
  if (!cleanId) throw new Error('Please provide a valid Gist ID.');

  const headers = { Accept: 'application/vnd.github+json' };
  const token = (githubToken || inMemoryGithubToken).trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`https://api.github.com/gists/${cleanId}`, { headers });
  if (!res.ok) {
    throw new Error(`Could not load Gist (${res.status}). Check Gist ID or token.`);
  }
  const gist = await res.json();
  const fileObj =
    gist.files?.[SETTINGS_FILENAME] ||
    Object.values(gist.files || {}).find((f) => f.filename?.endsWith('.json'));

  if (!fileObj?.content) {
    throw new Error('No mockpoet settings JSON found inside this Gist.');
  }
  return {
    gistId: gist.id,
    payload: JSON.parse(fileObj.content),
  };
}

/**
 * Save user settings & reading state into a GitHub Gist (creates a new secret Gist if gistId is empty)
 */
export async function saveSettingsToGist({ gistId = '', githubToken = '', user = null, settings }) {
  const token = (githubToken || inMemoryGithubToken).trim();
  if (!token) {
    throw new Error('Enter a GitHub Personal Access Token (with gist scope) to save directly to Gist.');
  }

  const payload = buildGistPayload(user, settings);
  const cleanId = (gistId || '').trim().split('/').pop();

  const endpoint = cleanId
    ? `https://api.github.com/gists/${cleanId}`
    : 'https://api.github.com/gists';

  const body = {
    description: `mockpoet Personal Reader Settings (${user?.email || 'Reader'})`,
    files: {
      [SETTINGS_FILENAME]: {
        content: JSON.stringify(payload, null, 2),
      },
    },
  };
  if (!cleanId) {
    body.public = false;
  }

  const res = await fetch(endpoint, {
    method: cleanId ? 'PATCH' : 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`GitHub Gist save failed (${res.status}): ${msg}`);
  }

  const data = await res.json();
  setLinkedGistId(data.id, user);
  return { gistId: data.id, htmlUrl: data.html_url, payload };
}
