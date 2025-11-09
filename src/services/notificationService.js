/**
 * Notification service for mockpoet
 * Handles requesting permission and sending notifications for new Twitter poems
 */

const NOTIFICATION_PERMISSION_KEY = 'mockpoet_notification_permission_requested';
const NOTIFICATION_ENABLED_KEY = 'mockpoet_notifications_enabled';
const LAST_NOTIFICATION_KEY = 'mockpoet_last_notification_time';

/**
 * Check if browser supports notifications
 */
export function supportsNotifications() {
  return 'Notification' in window;
}

/**
 * Check if this is the user's first visit
 */
export function isFirstVisit() {
  return !localStorage.getItem(NOTIFICATION_PERMISSION_KEY);
}

/**
 * Mark that we've requested permission
 */
function markPermissionRequested() {
  localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');
}

/**
 * Check if notifications are enabled
 */
export function areNotificationsEnabled() {
  return localStorage.getItem(NOTIFICATION_ENABLED_KEY) === 'true' && 
         Notification.permission === 'granted';
}

/**
 * Request notification permission from user
 * @returns {Promise<boolean>} True if permission granted
 */
export async function requestNotificationPermission() {
  if (!supportsNotifications()) {
    console.log('Notifications not supported');
    return false;
  }

  markPermissionRequested();

  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      localStorage.setItem(NOTIFICATION_ENABLED_KEY, 'true');
      return true;
    } else {
      localStorage.setItem(NOTIFICATION_ENABLED_KEY, 'false');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    localStorage.setItem(NOTIFICATION_ENABLED_KEY, 'false');
    return false;
  }
}

/**
 * Send a notification about a new Twitter poem
 * @param {Object} poemData - The poem data
 */
export function sendPoemNotification(poemData = {}) {
  if (!areNotificationsEnabled()) {
    return;
  }

  const title = poemData.title || 'New Poem Posted!';
  const body = poemData.body || 'A new poem has been posted to @mockpoet';
  const icon = poemData.icon || '/mockpoet/favicon.ico';

  try {
    const notification = new Notification(title, {
      body,
      icon,
      badge: icon,
      tag: 'mockpoet-poem',
      renotify: true,
      requireInteraction: false
    });

    notification.onclick = () => {
      window.open('https://x.com/mockpoet', '_blank');
      notification.close();
    };

    // Update last notification time
    localStorage.setItem(LAST_NOTIFICATION_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

/**
 * Get time since last notification in hours
 */
export function getHoursSinceLastNotification() {
  const lastTime = localStorage.getItem(LAST_NOTIFICATION_KEY);
  if (!lastTime) {
    return Infinity;
  }
  
  const now = Date.now();
  const diff = now - parseInt(lastTime, 10);
  return diff / (1000 * 60 * 60); // Convert to hours
}

/**
 * Check if it's time to send a notification (every 2 hours)
 */
export function shouldSendNotification() {
  return areNotificationsEnabled() && getHoursSinceLastNotification() >= 2;
}

/**
 * Initialize notification polling
 * This would typically check a backend API for new poems
 * For now, we'll simulate with a timer
 */
export function initializeNotificationPolling() {
  if (!areNotificationsEnabled()) {
    return;
  }

  // Check every 30 minutes if we should send a notification
  const checkInterval = 30 * 60 * 1000; // 30 minutes in ms
  
  setInterval(() => {
    if (shouldSendNotification()) {
      // In a real implementation, you would fetch from an API
      // For now, we'll send a generic notification
      sendPoemNotification({
        title: '📝 New Poem at @mockpoet',
        body: 'A new poem has been posted! Check it out on Twitter.'
      });
    }
  }, checkInterval);

  // Also check immediately
  if (shouldSendNotification()) {
    sendPoemNotification({
      title: '📝 New Poem at @mockpoet',
      body: 'A new poem has been posted! Check it out on Twitter.'
    });
  }
}
