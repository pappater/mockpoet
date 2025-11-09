import { useState, useEffect } from 'react';
import { 
  isFirstVisit, 
  supportsNotifications, 
  requestNotificationPermission,
  initializeNotificationPolling
} from '../services/notificationService';
import './NotificationPrompt.css';

export default function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if we should show the prompt
    if (isFirstVisit() && supportsNotifications()) {
      // Delay showing the prompt slightly to not be too intrusive
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000); // Show after 2 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  const handleAllow = async () => {
    const granted = await requestNotificationPermission();
    setShowPrompt(false);
    
    if (granted) {
      // Initialize the polling for notifications
      initializeNotificationPolling();
    }
  };

  const handleDeny = () => {
    // Just close the prompt, permission is already marked as requested
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="notification-prompt-overlay">
      <div className="notification-prompt">
        <div className="notification-prompt-icon">
          <svg 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
        <h3 className="notification-prompt-title">Stay Updated with New Poems</h3>
        <p className="notification-prompt-message">
          Get notified every 2 hours when we post a new poem to Twitter (@mockpoet).
        </p>
        <div className="notification-prompt-buttons">
          <button 
            className="notification-btn notification-btn-allow" 
            onClick={handleAllow}
          >
            Allow Notifications
          </button>
          <button 
            className="notification-btn notification-btn-deny" 
            onClick={handleDeny}
          >
            No Thanks
          </button>
        </div>
      </div>
    </div>
  );
}
