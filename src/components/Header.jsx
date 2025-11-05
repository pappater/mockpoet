import { Link } from 'react-router-dom';
import './Header.css';

export default function Header({ onThemeToggle, showBack = false, showMenu = false, onMenuToggle }) {
  return (
    <div className="floating-header">
      <div className="floating-header-left">
        {showBack ? (
          <span className="floating-title">rabbit</span>
        ) : (
          <Link to="/" className="floating-title">rabbit</Link>
        )}
      </div>
      <div className="floating-header-right">
        {showBack && (
          <Link to="/" className="back-icon" aria-label="Back to Home">←</Link>
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
