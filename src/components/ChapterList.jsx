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
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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
    onClose();
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

  const readPct = chapters?.length
    ? Math.round((visitedChapters.length / chapters.length) * 100)
    : 0;

  return (
    <>
      {isOpen && (
        <div
          className="chapter-drawer-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        ref={listRef}
        className={`chapter-list ${isOpen ? 'open' : ''}`}
        aria-label="Table of contents"
      >
        <div className="chapter-list-header">
          <div className="chapter-list-title-row">
            <div>
              <h2 className="chapter-list-title">Chapters</h2>
              {bookTitle && <div className="chapter-list-book-name">{bookTitle}</div>}
            </div>
            <button
              type="button"
              className="chapter-drawer-close"
              onClick={onClose}
              aria-label="Close table of contents"
            >
              ✕
            </button>
          </div>

          <div className="chapter-drawer-actions">
            {chapters?.length > 0 && (
              <span className="chapter-drawer-progress">
                {visitedChapters.length}/{chapters.length} read ({readPct}%)
              </span>
            )}
            {allChaptersData && (
              <DownloadButtons bookTitle={bookTitle || 'Book'} chapters={allChaptersData} />
            )}
          </div>

          <div className="chapter-filter-box">
            <input
              type="search"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={`Search ${chapters?.length || 0} entries…`}
              aria-label="Filter chapters"
              className="chapter-search-input"
            />
            {onSelectRandom && (chapters?.length || 0) > 1 && (
              <button
                type="button"
                className="chapter-random-btn"
                onClick={() => {
                  onSelectRandom();
                  onClose();
                }}
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
    </>
  );
}
