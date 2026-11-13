import { getUserSettings } from './gistSettingsService';
import { getQuoteForNotification } from './quoteService';

const NOTIFICATION_PERMISSION_KEY = 'mockpoet_notification_permission_requested';
const NOTIFICATION_ENABLED_KEY = 'mockpoet_notifications_enabled';
const LAST_NOTIFICATION_KEY = 'mockpoet_last_notification_time';

let pollingTimerId = null;

export function supportsNotifications() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function isFirstVisit() {
  return !localStorage.getItem(NOTIFICATION_PERMISSION_KEY);
}

function markPermissionRequested() {
  localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');
}

export function markPromptDismissed() {
  markPermissionRequested();
  localStorage.setItem(NOTIFICATION_ENABLED_KEY, 'false');
}

export function areNotificationsEnabled() {
  const settings = getUserSettings();
  return (
    supportsNotifications() &&
    (localStorage.getItem(NOTIFICATION_ENABLED_KEY) === 'true' || settings.notifications?.enabled) &&
    Notification.permission === 'granted'
  );
}

export async function requestNotificationPermission() {
  if (!supportsNotifications()) {
    return false;
  }

  markPermissionRequested();

  try {
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    localStorage.setItem(NOTIFICATION_ENABLED_KEY, granted ? 'true' : 'false');
    return granted;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    localStorage.setItem(NOTIFICATION_ENABLED_KEY, 'false');
    return false;
  }
}

export function sendPoemNotification(data = {}) {
  if (!supportsNotifications() || Notification.permission !== 'granted') {
    return false;
  }

  const title = data.title || 'mockpoet · Daily Quote';
  const body =
    data.body ||
    'Fresh stories, Tamil & English poetry, leveled essays, and new drama scenes are ready to read.';

  try {
    const notification = new Notification(title, {
      body,
      tag: 'mockpoet-quote',
      requireInteraction: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    localStorage.setItem(LAST_NOTIFICATION_KEY, Date.now().toString());
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

export async function triggerQuoteNotification(settingsOverride = null) {
  if (!supportsNotifications() || Notification.permission !== 'granted') {
    return { sent: false, reason: 'Notification permission not granted' };
  }

  const settings = settingsOverride || getUserSettings();
  const notifCfg = settings.notifications || {};
  const quote = await getQuoteForNotification({
    language: notifCfg.language || 'both',
    contentTypes: notifCfg.contentTypes || ['quotes', 'poems', 'short_stories', 'essays'],
  });

  const sent = sendPoemNotification({
    title: quote.title,
    body: quote.body,
  });

  return { sent, quote };
}

export function getHoursSinceLastNotification() {
  const lastTime = localStorage.getItem(LAST_NOTIFICATION_KEY);
  if (!lastTime) return Infinity;
  return (Date.now() - parseInt(lastTime, 10)) / (1000 * 60 * 60);
}

export function shouldSendNotification() {
  const settings = getUserSettings();
  const intervalHours = Math.max(0.25, (settings.notifications?.intervalMinutes || 120) / 60);
  return areNotificationsEnabled() && getHoursSinceLastNotification() >= intervalHours;
}

export function initializeNotificationPolling() {
  if (pollingTimerId) {
    clearInterval(pollingTimerId);
    pollingTimerId = null;
  }

  if (!areNotificationsEnabled()) {
    return;
  }

  if (shouldSendNotification()) {
    triggerQuoteNotification().catch(() => {});
  }

  const settings = getUserSettings();
  const intervalMs = Math.max(15, settings.notifications?.intervalMinutes || 120) * 60 * 1000;
  pollingTimerId = setInterval(() => {
    if (areNotificationsEnabled()) {
      triggerQuoteNotification().catch(() => {});
    }
  }, intervalMs);
}
