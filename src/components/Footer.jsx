import { useState, useEffect } from 'react';
import './Footer.css';
import { getRandomGenreSubgenrePair } from '../data/genres';

export default function Footer({ isReaderPage = false }) {
  const [currentGenre, setCurrentGenre] = useState({ genre: '', subgenre: '' });
  const [key, setKey] = useState(0);

  useEffect(() => {
    const initial = getRandomGenreSubgenrePair();
    setCurrentGenre(initial);

    const interval = setInterval(() => {
      const newGenre = getRandomGenreSubgenrePair();
      setCurrentGenre(newGenre);
      setKey(prev => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (isReaderPage) {
    return null;
  }

  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-brand-col">
          <div className="footer-wordmark">mockpoet</div>
          <p className="footer-tagline">
            An archival reading room of completed novels, daily short fiction, English &amp; Tamil poetry, leveled essays, and serialized dramas.
          </p>
        </div>

        <div className="footer-meta-col">
          <div className="genre-container">
            <span className="genre-prefix">Exploring:</span>
            <span key={key} className="genre-text roll-in">
              {currentGenre.subgenre}, {currentGenre.genre}
            </span>
          </div>
          <p className="footer-links-row">
            <span>Mocking a poem every hour on Tumblr:</span>{' '}
            <a
              href="https://mockpoet.tumblr.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              @mockpoet
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
