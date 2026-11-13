import { useState, useEffect } from 'react';
import { googleSignIn, googleSignOut, getAccessToken, sendGmailDigest } from '../services/authService';
import {
  getUserSettings,
  saveUserSettings,
  getLinkedGistId,
  setLinkedGistId,
  getMemoryGithubToken,
  setMemoryGithubToken,
  loadSettingsFromGist,
  saveSettingsToGist,
  applyGistPayload,
  buildGistPayload,
} from '../services/gistSettingsService';
import {
  supportsNotifications,
  requestNotificationPermission,
  triggerQuoteNotification,
  initializeNotificationPolling,
} from '../services/notificationService';
import { buildDailyEmailDigestContent } from '../services/quoteService';
import './SettingsModal.css';

const CONTENT_TYPE_OPTIONS = [
  { key: 'quotes', label: 'Quotes & Tamil Kurals' },
  { key: 'poems', label: 'Poetry (English & Tamil)' },
  { key: 'short_stories', label: 'Short Story Snippets' },
  { key: 'essays', label: 'Essay Reflections' },
];

export default function SettingsModal({ isOpen, onClose, user }) {
  const [settings, setSettings] = useState(() => getUserSettings(user));
  const [gistId, setGistId] = useState(() => getLinkedGistId(user));
  const [githubToken, setGithubToken] = useState(() => getMemoryGithubToken());
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [emailPreview, setEmailPreview] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSettings(getUserSettings(user));
      setGistId(getLinkedGistId(user));
      setStatusMessage('');
      setErrorMessage('');
      setEmailPreview(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const updateSettings = (next) => {
    setSettings(next);
    saveUserSettings(next, user);
  };

  const handleSignIn = async () => {
    setBusyAction('auth');
    setErrorMessage('');
    setStatusMessage('');
    try {
      const res = await googleSignIn();
      if (res?.user) {
        const loaded = getUserSettings(res.user);
        setSettings(loaded);
        setGistId(getLinkedGistId(res.user));
        setStatusMessage(`Signed in as ${res.user.email}`);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Google Sign-In could not be completed.');
    } finally {
      setBusyAction('');
    }
  };

  const handleSignOut = async () => {
    setBusyAction('auth');
    setErrorMessage('');
    try {
      await googleSignOut();
      setStatusMessage('Signed out.');
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setBusyAction('');
    }
  };

  const handleToggleNotifications = async (checked) => {
    setErrorMessage('');
    setStatusMessage('');
    if (checked) {
      if (!supportsNotifications()) {
        setErrorMessage('Desktop notifications are not supported in this browser.');
        return;
      }
      const granted = await requestNotificationPermission();
      if (!granted) {
        setErrorMessage('Notification permission was declined by your browser/OS.');
        return;
      }
    }
    const next = {
      ...settings,
      notifications: { ...settings.notifications, enabled: checked },
    };
    updateSettings(next);
    if (checked) {
      initializeNotificationPolling();
      setStatusMessage('macOS / Windows quote notifications enabled.');
    } else {
      setStatusMessage('Desktop notifications paused.');
    }
  };

  const handleTestNotification = async () => {
    setBusyAction('test-notif');
    setErrorMessage('');
    setStatusMessage('');
    try {
      const granted = Notification.permission === 'granted' || (await requestNotificationPermission());
      if (!granted) {
        setErrorMessage('Please allow browser notifications to test macOS/Windows alerts.');
        return;
      }
      const res = await triggerQuoteNotification(settings);
      if (res.sent) {
        setStatusMessage(`Dispatched notification: "${res.quote.body.slice(0, 80)}${res.quote.body.length > 80 ? '…' : ''}"`);
      } else {
        setErrorMessage(res.reason || 'Could not dispatch notification.');
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setBusyAction('');
    }
  };

  const handleToggleContentType = (key) => {
    const current = settings.notifications.contentTypes || [];
    const nextList = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];
    updateSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        contentTypes: nextList.length > 0 ? nextList : ['quotes'],
      },
    });
  };

  const handleSaveGist = async () => {
    setBusyAction('save-gist');
    setErrorMessage('');
    setStatusMessage('');
    try {
      setMemoryGithubToken(githubToken);
      const res = await saveSettingsToGist({
        gistId,
        githubToken,
        user,
        settings,
      });
      setGistId(res.gistId);
      setStatusMessage(`Settings & bookmarks synced to Gist (${res.gistId}).`);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setBusyAction('');
    }
  };

  const handleLoadGist = async () => {
    setBusyAction('load-gist');
    setErrorMessage('');
    setStatusMessage('');
    try {
      setMemoryGithubToken(githubToken);
      const res = await loadSettingsFromGist(gistId, githubToken);
      applyGistPayload(res.payload, user);
      setLinkedGistId(res.gistId, user);
      setSettings(getUserSettings(user));
      setStatusMessage(`Restored personal settings from Gist (${res.gistId}).`);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setBusyAction('');
    }
  };

  const handleExportJson = () => {
    const payload = buildGistPayload(user, settings);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mockpoet_user_settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrepareEmailDigest = async () => {
    setBusyAction('prepare-email');
    setErrorMessage('');
    setStatusMessage('');
    try {
      const targetEmail = (settings.emailDigest.email || user?.email || '').trim();
      if (!targetEmail) {
        setErrorMessage('Please enter an email address or sign in with Google first.');
        return;
      }
      const digest = await buildDailyEmailDigestContent({
        language: settings.emailDigest.language || 'both',
      });
      setEmailPreview({ ...digest, toEmail: targetEmail });
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setBusyAction('');
    }
  };

  const handleConfirmSendEmail = async () => {
    if (!emailPreview) return;
    setBusyAction('send-email');
    setErrorMessage('');
    setStatusMessage('');
    try {
      let token = getAccessToken();
      if (!token) {
        const res = await googleSignIn();
        token = res?.accessToken;
      }
      await sendGmailDigest({
        accessToken: token,
        toEmail: emailPreview.toEmail,
        subject: emailPreview.subject,
        htmlBody: emailPreview.htmlBody,
        plainText: emailPreview.plainText,
      });
      setStatusMessage(`Digest email sent to ${emailPreview.toEmail} via Gmail.`);
      setEmailPreview(null);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setBusyAction('');
    }
  };

  return (
    <div className="settings-backdrop" onClick={onClose} role="presentation">
      <div
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Reader Settings"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-header">
          <div>
            <div className="settings-eyebrow">Personal Reading Room · Zero-Cost Storage</div>
            <h2 className="settings-title">Settings, Gist Sync &amp; Notifications</h2>
          </div>
          <button type="button" className="settings-close-btn" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        <div className="settings-body">
          {statusMessage && <div className="settings-banner success">{statusMessage}</div>}
          {errorMessage && <div className="settings-banner error">{errorMessage}</div>}

          {/* 1. Google Login & GitHub Gist Storage */}
          <section className="settings-section">
            <h3 className="settings-section-title">1. Google Profile &amp; GitHub Gist Settings</h3>
            <p className="settings-section-desc">
              Sign in with Google and save your preferences, bookmarks, and reading streak inside a free GitHub Gist JSON file—no database required.
            </p>

            {user ? (
              <div className="account-card">
                <div className="account-info">
                  {user.photoURL && (
                    <img src={user.photoURL} alt={user.displayName || 'Profile'} className="account-avatar" referrerPolicy="no-referrer" />
                  )}
                  <div>
                    <div className="account-name">{user.displayName || 'Google Reader'}</div>
                    <div className="account-email">{user.email}</div>
                  </div>
                </div>
                <button type="button" className="settings-btn-outline" onClick={handleSignOut} disabled={busyAction === 'auth'}>
                  Sign out
                </button>
              </div>
            ) : (
              <div className="gsi-wrap">
                <button type="button" className="gsi-material-button" onClick={handleSignIn} disabled={busyAction === 'auth'}>
                  <div className="gsi-material-button-state"></div>
                  <div className="gsi-material-button-content-wrapper">
                    <div className="gsi-material-button-icon">
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      </svg>
                    </div>
                    <span className="gsi-material-button-contents">
                      {busyAction === 'auth' ? 'Signing in…' : 'Sign in with Google'}
                    </span>
                  </div>
                </button>
              </div>
            )}

            <div className="settings-form-grid">
              <label className="settings-field">
                <span>Personal GitHub Gist ID (leave blank to create a new secret Gist)</span>
                <input
                  type="text"
                  value={gistId}
                  onChange={(e) => {
                    setGistId(e.target.value);
                    setLinkedGistId(e.target.value, user);
                  }}
                  placeholder="e.g. 51893c25959355bda1884804375ec3d8"
                />
              </label>
              <label className="settings-field">
                <span>GitHub Token (gist scope, held in memory only for saving)</span>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_... (needed only to write to Gist)"
                />
              </label>
            </div>

            <div className="settings-btn-row">
              <button type="button" className="settings-btn-primary" onClick={handleSaveGist} disabled={busyAction === 'save-gist'}>
                {busyAction === 'save-gist' ? 'Syncing…' : 'Save Settings to Gist'}
              </button>
              <button type="button" className="settings-btn-outline" onClick={handleLoadGist} disabled={busyAction === 'load-gist' || !gistId.trim()}>
                {busyAction === 'load-gist' ? 'Loading…' : 'Load from Gist'}
              </button>
              <button type="button" className="settings-btn-ghost" onClick={handleExportJson}>
                Download JSON Backup
              </button>
            </div>
          </section>

          {/* 2. macOS / Windows Desktop Notifications */}
          <section className="settings-section">
            <h3 className="settings-section-title">2. macOS &amp; Windows Quote Notifications</h3>
            <p className="settings-section-desc">
              Receive native OS notifications featuring short quotes, Tamil Kurals, poetry stanzas, and micro-reflections in your chosen language.
            </p>

            <label className="settings-toggle-row">
              <input
                type="checkbox"
                checked={settings.notifications.enabled}
                onChange={(e) => handleToggleNotifications(e.target.checked)}
              />
              <span>Enable Desktop Quote Notifications</span>
            </label>

            <div className="settings-form-grid">
              <label className="settings-field">
                <span>Notification Language</span>
                <select
                  value={settings.notifications.language}
                  onChange={(e) =>
                    updateSettings({
                      ...settings,
                      notifications: { ...settings.notifications, language: e.target.value },
                    })
                  }
                >
                  <option value="both">English &amp; Tamil (Both)</option>
                  <option value="english">English only</option>
                  <option value="tamil">Tamil (தமிழ்) only</option>
                </select>
              </label>

              <label className="settings-field">
                <span>Cadence</span>
                <select
                  value={settings.notifications.intervalMinutes}
                  onChange={(e) =>
                    updateSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        intervalMinutes: Number(e.target.value),
                      },
                    })
                  }
                >
                  <option value={30}>Every 30 minutes</option>
                  <option value={120}>Every 2 hours</option>
                  <option value={240}>Every 4 hours</option>
                  <option value={1440}>Once daily</option>
                </select>
              </label>
            </div>

            <div className="settings-checkbox-grid">
              {CONTENT_TYPE_OPTIONS.map((opt) => (
                <label key={opt.key} className="settings-checkbox-pill">
                  <input
                    type="checkbox"
                    checked={(settings.notifications.contentTypes || []).includes(opt.key)}
                    onChange={() => handleToggleContentType(opt.key)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            <div className="settings-btn-row">
              <button type="button" className="settings-btn-outline" onClick={handleTestNotification} disabled={busyAction === 'test-notif'}>
                {busyAction === 'test-notif' ? 'Sending…' : 'Send Test Quote Notification'}
              </button>
            </div>
          </section>

          {/* 3. Free Email Digest (Gmail + GitHub Actions) */}
          <section className="settings-section">
            <h3 className="settings-section-title">3. Free Email Digest (Short Story Gist &amp; Quotes)</h3>
            <p className="settings-section-desc">
              Opt into daily email digests with a concise short story gist and daily quote at zero cost—either sent directly via your signed-in Gmail or via the free GitHub Actions SMTP digest.
            </p>

            <label className="settings-toggle-row">
              <input
                type="checkbox"
                checked={settings.emailDigest.optedIn}
                onChange={(e) =>
                  updateSettings({
                    ...settings,
                    emailDigest: { ...settings.emailDigest, optedIn: e.target.checked },
                  })
                }
              />
              <span>Opt in to Daily Short Story Gist &amp; Quote Emails</span>
            </label>

            <div className="settings-form-grid">
              <label className="settings-field">
                <span>Recipient Email</span>
                <input
                  type="email"
                  value={settings.emailDigest.email}
                  onChange={(e) =>
                    updateSettings({
                      ...settings,
                      emailDigest: { ...settings.emailDigest, email: e.target.value },
                    })
                  }
                  placeholder="reader@example.com"
                />
              </label>

              <label className="settings-field">
                <span>Quote Language in Email</span>
                <select
                  value={settings.emailDigest.language}
                  onChange={(e) =>
                    updateSettings({
                      ...settings,
                      emailDigest: { ...settings.emailDigest, language: e.target.value },
                    })
                  }
                >
                  <option value="both">English &amp; Tamil</option>
                  <option value="english">English</option>
                  <option value="tamil">Tamil (தமிழ்)</option>
                </select>
              </label>
            </div>

            <div className="settings-btn-row">
              <button
                type="button"
                className="settings-btn-primary"
                onClick={handlePrepareEmailDigest}
                disabled={busyAction === 'prepare-email'}
              >
                {busyAction === 'prepare-email' ? 'Preparing Preview…' : 'Preview & Send Digest via Gmail'}
              </button>
            </div>

            {emailPreview && (
              <div className="email-confirm-box" role="region" aria-label="Confirm email send">
                <div className="email-confirm-header">Confirm Sending Email via Gmail</div>
                <p className="email-confirm-meta">
                  <strong>To:</strong> {emailPreview.toEmail}
                  <br />
                  <strong>Subject:</strong> {emailPreview.subject}
                </p>
                <div className="email-confirm-preview">
                  <p><strong>Short Story Gist:</strong> {emailPreview.storyGist}</p>
                  <p><strong>Quote:</strong> &ldquo;{emailPreview.quote.body}&rdquo;</p>
                </div>
                <div className="settings-btn-row">
                  <button
                    type="button"
                    className="settings-btn-primary"
                    onClick={handleConfirmSendEmail}
                    disabled={busyAction === 'send-email'}
                  >
                    {busyAction === 'send-email' ? 'Sending…' : 'Confirm & Send Email'}
                  </button>
                  <button
                    type="button"
                    className="settings-btn-outline"
                    onClick={() => setEmailPreview(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
