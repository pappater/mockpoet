import { useEffect, useRef } from 'react';
import './ChapterList.css';

export default function ChapterList({ chapters, currentChapter, onChapterSelect, isOpen, onClose }) {
  const listRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (window.innerWidth <= 768 && 
          isOpen && 
          listRef.current && 
          !listRef.current.contains(e.target) &&
          !e.target.closest('.hamburger-menu')) {
        onClose();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen, onClose]);

  const handleChapterClick = (chapterNum) => {
    onChapterSelect(chapterNum);
    if (window.innerWidth <= 768) {
      onClose();
    }
  };

  return (
    <aside 
      ref={listRef}
      className={`chapter-list ${isOpen ? 'open' : ''}`}
    >
      <div className="chapter-list-header">
        <h2 className="chapter-list-title">Chapters</h2>
      </div>
      <ul className="chapter-list-items">
        {chapters.map((chapter) => (
          <li
            key={chapter.chapter}
            className={`chapter-item ${chapter.chapter === currentChapter ? 'active' : ''}`}
            onClick={() => handleChapterClick(chapter.chapter)}
          >
            <span className="chapter-number">Ch. {chapter.chapter}</span>
            <span className="chapter-name">{chapter.chapter_name || `Chapter ${chapter.chapter}`}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
