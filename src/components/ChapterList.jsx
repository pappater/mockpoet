import { useEffect, useRef, useState, useMemo } from 'react';
import DownloadButtons from './DownloadButtons';
import './ChapterList.css';

export default function ChapterList({
  chapters,
  currentChapter,
  onChapterSelect,
  isOpen,
  onClose,
  bookType = 'novel',
  bookTitle,
  allChaptersData,
  visitedChapters = [],
  onSelectRandom,
}) {
  const listRef = useRef(null);
  const [filterText, setFilterText] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        window.innerWidth <= 768 &&
        isOpen &&
        listRef.current &&
        !listRef.current.contains(e.target) &&
        !e.target.closest('.hamburger-menu')
      ) {
        onClose();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen, onClose]);

  const filteredChapters = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    return (chapters || []).filter((ch) => {
      if (bookType === 'essays' && difficultyFilter !== 'all') {
        if ((ch.difficulty || 'medium') !== difficultyFilter) return false;
      }
      if (!q) return true;
      const name = (ch.chapter_name || '').toLowerCase();
      const num = String(ch.chapter);
      const sub = (ch.poetry_type || ch.author_style || ch.topic || '').toLowerCase();
      return name.includes(q) || num.includes(q) || sub.includes(q);
    });
  }, [chapters, filterText, difficultyFilter, bookType]);

  const handleChapterClick = (chapterNum) => {
    onChapterSelect(chapterNum);
    if (window.innerWidth <= 768) {
      onClose();
    }
  };

  const getIndexPrefix = (chapterNum) => {
    if (bookType === 'drama') return `${chapterNum}`;
    if (bookType === 'novel') return `Ch. ${chapterNum}`;
    return `#${chapterNum}`;
  };

  const getDefaultName = (chapterNum) => {
    if (bookType === 'drama') return `Scene ${chapterNum}`;
    if (bookType === 'novel') return `Chapter ${chapterNum}`;
    return `Entry ${chapterNum}`;
  };

  return (
    <aside ref={listRef} className={`chapter-list ${isOpen ? 'open' : ''}`}>
      <div className="chapter-list-header">
        <div className="chapter-list-title-row">
          <h2 className="chapter-list-title">Chapters</h2>
          {allChaptersData && (
            <DownloadButtons bookTitle={bookTitle || 'Book'} chapters={allChaptersData} />
          )}
        </div>

        <div className="chapter-filter-box">
          <input
            type="search"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder={`Filter ${chapters?.length || 0} entries…`}
            aria-label="Filter chapters"
            className="chapter-search-input"
          />
          {onSelectRandom && (chapters?.length || 0) > 1 && (
            <button
              type="button"
              className="chapter-random-btn"
              onClick={onSelectRandom}
              title="Open a random entry"
            >
              Random
            </button>
          )}
        </div>

        {bookType === 'essays' && (
          <div className="sidebar-difficulty-tabs" role="group" aria-label="Essay difficulty filter">
            {['all', 'low', 'medium', 'high'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                className={`sidebar-diff-tab ${difficultyFilter === lvl ? 'active' : ''}`}
                onClick={() => setDifficultyFilter(lvl)}
              >
                {lvl === 'all' ? 'All' : lvl.charAt(0).toUpperCase() + lvl.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      <ul className="chapter-list-items">
        {filteredChapters.map((chapter) => {
          const isActive = chapter.chapter === currentChapter;
          const isVisited = visitedChapters.includes(chapter.chapter);
          return (
            <li
              key={chapter.chapter}
              className={`chapter-item ${isActive ? 'active' : ''} ${isVisited ? 'visited' : ''}`}
              onClick={() => handleChapterClick(chapter.chapter)}
            >
              <div className="chapter-item-top">
                <span className="chapter-number">{getIndexPrefix(chapter.chapter)}</span>
                {bookType === 'essays' && chapter.difficulty && (
                  <span className={`chapter-diff-tag diff-${chapter.difficulty}`}>
                    {chapter.difficulty}
                  </span>
                )}
                {isVisited && !isActive && (
                  <span className="chapter-read-mark" title="Read" aria-label="Read">✓</span>
                )}
              </div>
              <span className="chapter-name">
                {chapter.chapter_name || getDefaultName(chapter.chapter)}
              </span>
            </li>
          );
        })}
        {filteredChapters.length === 0 && (
          <li className="chapter-list-empty">No matching entries found.</li>
        )}
      </ul>
    </aside>
  );
}
