import { Link } from 'react-router-dom';
import TumblrIcon from './TumblrIcon';
import './Header.css';

const NAV_SECTIONS = [
  { id: 'section-novel', label: 'Novels' },
  { id: 'section-short_stories', label: 'Short Stories' },
  { id: 'section-poems', label: 'Poetry' },
  { id: 'section-essays', label: 'Essays' },
  { id: 'section-drama', label: 'Drama' },
  { id: 'section-quotes', label: 'Quotes' },
];

export default function Header({
  theme = 'light',
  user = null,
  onOpenSettings,
  onThemeToggle,
  showBack = false,
  showMenu = false,
  onMenuToggle,
}) {
  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="floating-header">
      <div className="floating-header-inner">
        <div className="floating-header-left">
          <Link to="/" className="floating-title">mockpoet</Link>
        </div>

        {!showBack && (
          <nav className="header-nav" aria-label="Literary sections">
            {NAV_SECTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="header-nav-link"
                onClick={() => scrollToSection(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}

        <div className="floating-header-right">
          {showBack && (
            <Link to="/" className="back-link" aria-label="Back to Home">
              ← Library
            </Link>
          )}
          {!showBack && <TumblrIcon />}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="settings-trigger-btn"
              aria-label="Open settings"
              title="Settings, Google Sign-In, Gist Sync & Notifications"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'Account'} className="header-user-avatar" referrerPolicy="no-referrer" />
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              )}
              <span className="settings-trigger-label">{user ? 'Account' : 'Settings'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onThemeToggle}
            className="theme-toggle"
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to Warm Paper theme' : 'Switch to Deep Ink theme'}
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          {showMenu && (
            <button
              type="button"
              onClick={onMenuToggle}
              className="hamburger-menu"
              aria-label="Toggle chapter list"
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
