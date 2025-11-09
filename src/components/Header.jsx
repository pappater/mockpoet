import { Link } from 'react-router-dom';
import TumblrIcon from './TumblrIcon';
import TwitterIcon from './TwitterIcon';
import './Header.css';

export default function Header({ onThemeToggle, showBack = false, showMenu = false, onMenuToggle }) {
  return (
    <div className="floating-header">
      <div className="floating-header-left">
        {showBack ? (
          <span className="floating-title">mockpoet</span>
        ) : (
          <Link to="/" className="floating-title">mockpoet</Link>
        )}
      </div>
      <div className="floating-header-right">
        {showBack && (
          <Link to="/" className="back-icon" aria-label="Back to Home">←</Link>
        )}
        {!showBack && (
          <>
            <TumblrIcon />
            <TwitterIcon />
          </>
        )}
        <button 
          onClick={onThemeToggle} 
          className="theme-toggle" 
          aria-label="Toggle theme"
        >
          <span className="theme-icon">◐</span>
        </button>
        {showMenu && (
          <button 
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
  );
}
