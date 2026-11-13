import { useState, useEffect } from 'react';
import {
  isFirstVisit,
  supportsNotifications,
  requestNotificationPermission,
  initializeNotificationPolling,
  markPromptDismissed,
} from '../services/notificationService';
import './NotificationPrompt.css';

export default function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!isFirstVisit() || !supportsNotifications()) {
      return;
    }

    let interacted = false;
    let dwellElapsed = false;

    const tryShow = () => {
      if (interacted && dwellElapsed && isFirstVisit()) {
        setShowPrompt(true);
      }
    };

    const onInteract = () => {
      interacted = true;
      tryShow();
    };

    const timer = setTimeout(() => {
      dwellElapsed = true;
      tryShow();
    }, 15000);

    window.addEventListener('scroll', onInteract, { once: true, passive: true });
    window.addEventListener('click', onInteract, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onInteract);
      window.removeEventListener('click', onInteract);
    };
  }, []);

  const handleAllow = async () => {
    const granted = await requestNotificationPermission();
    setShowPrompt(false);
    if (granted) {
      initializeNotificationPolling();
    }
  };

  const handleDeny = () => {
    markPromptDismissed();
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <aside className="notification-banner" role="dialog" aria-label="Daily reading reminders">
      <div className="notification-banner-content">
        <strong className="notification-banner-title">Daily Reading Editions</strong>
        <p className="notification-banner-message">
          Enable subtle reminders for new daily short stories, Tamil &amp; English poetry, essays, and drama scenes.
        </p>
      </div>
      <div className="notification-banner-actions">
        <button type="button" className="notification-btn notification-btn-allow" onClick={handleAllow}>
          Enable
        </button>
        <button type="button" className="notification-btn notification-btn-deny" onClick={handleDeny}>
          Dismiss
        </button>
      </div>
    </aside>
  );
}
