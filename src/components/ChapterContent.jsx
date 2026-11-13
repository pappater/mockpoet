import { useRef, useEffect, useState } from 'react';
import TextToSpeech from './TextToSpeech';
import { getTextStats } from '../services/api';
import {
  getReaderPrefs,
  saveReaderPrefs,
  isBookmarked,
  toggleBookmark,
  isAppreciated,
  toggleAppreciation,
} from '../utils/readingState';
import './ChapterContent.css';

const MEASURES = [
  { key: 'narrow', label: 'Narrow', ch: '58ch' },
  { key: 'standard', label: 'Standard', ch: '68ch' },
  { key: 'wide', label: 'Wide', ch: '78ch' },
];

export default function ChapterContent({
  novelKey = '',
  bookTitle = '',
  bookType = 'novel',
  chapterNum = 1,
  chapterMeta = null,
  title,
  content,
  loading,
  error,
  isLastChapter,
  isBookComplete,
  publishedDate,
  hasPrev = false,
  hasNext = false,
  prevTitle = '',
  nextTitle = '',
  onPrev,
  onNext,
  onRandomChapter,
  isFocusMode = false,
  onToggleFocus,
}) {
  const contentRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [prefs, setPrefs] = useState(() => getReaderPrefs());
  const [bookmarked, setBookmarked] = useState(false);
  const [appreciated, setAppreciated] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setBookmarked(isBookmarked(novelKey, chapterNum));
    setAppreciated(isAppreciated(novelKey, chapterNum));
    setCopied(false);
  }, [novelKey, chapterNum]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
    if (typeof navigator !== 'undefined' && !navigator.userAgent?.includes('jsdom')) {
      window.scrollTo({ top: 0 });
    }
    setScrollProgress(0);
  }, [content]);

  useEffect(() => {
    const el = contentRef.current;
    const handleScroll = () => {
      if (el && el.scrollHeight > el.clientHeight + 20) {
        const pct = Math.min(100, Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100));
        setScrollProgress(pct);
      } else {
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        if (max > 20) {
          setScrollProgress(Math.min(100, Math.round((window.scrollY / max) * 100)));
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    if (el) el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (el) el.removeEventListener('scroll', handleScroll);
    };
  }, [content]);

  const updatePrefs = (patch) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    saveReaderPrefs(next);
  };

  const adjustFontSize = (delta) => {
    const nextSize = Math.min(24, Math.max(14, (prefs.fontSize || 18) + delta));
    updatePrefs({ fontSize: nextSize });
  };

  const cycleMeasure = () => {
    const idx = MEASURES.findIndex((m) => m.key === prefs.measure);
    const next = MEASURES[(idx + 1) % MEASURES.length];
    updatePrefs({ measure: next.key });
  };

  const handleBookmark = () => {
    if (!novelKey) return;
    const nextState = toggleBookmark({
      novelKey,
      bookTitle,
      chapterNum,
      chapterName: title,
      bookType,
    });
    setBookmarked(nextState);
  };

  const handleAppreciate = () => {
    if (!novelKey) return;
    setAppreciated(toggleAppreciation(novelKey, chapterNum));
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const stats = getTextStats(content);
  const measureObj = MEASURES.find((m) => m.key === prefs.measure) || MEASURES[1];

  // Enable drop cap only for prose starting with Latin script (safe for Tamil Unicode ligatures)
  const plainStart = (content || '').replace(/<[^>]+>/g, '').trim();
  const useDropCap =
    (bookType === 'novel' || bookType === 'short_stories' || bookType === 'essays') &&
    /^[A-Za-z]/.test(plainStart);

  const formattedDate = publishedDate
    ? new Date(publishedDate.replace(' UTC', 'Z').replace(' ', 'T')).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <main className="chapter-content" ref={contentRef}>
      <div className="reading-progress-bar" aria-hidden="true">
        <div className="reading-progress-fill" style={{ width: `${scrollProgress}%` }} />
      </div>

      <div className="chapter-article-shell" style={{ '--reader-measure': measureObj.ch }}>
        <header className="chapter-content-header">
          <div className="chapter-kicker-line">
            {bookTitle && <span className="chapter-work-name">{bookTitle}</span>}
            {chapterMeta?.difficulty && (
              <>
                <span className="kicker-sep" aria-hidden="true">·</span>
                <span className={`chapter-diff-badge level-${chapterMeta.difficulty}`}>
                  {chapterMeta.difficulty.toUpperCase()} LEVEL
                </span>
              </>
            )}
            {(chapterMeta?.poetry_type || chapterMeta?.author_style) && (
              <>
                <span className="kicker-sep" aria-hidden="true">·</span>
                <span className="chapter-style-note">
                  {chapterMeta.poetry_type || chapterMeta.author_style}
                </span>
              </>
            )}
          </div>

          <h1 className="chapter-content-title">{title}</h1>

          <div className="chapter-meta-strip">
            {formattedDate && (
              <span className="chapter-published-date">Published: {formattedDate}</span>
            )}
            {!loading && !error && content && (
              <>
                {formattedDate && <span className="kicker-sep" aria-hidden="true">·</span>}
                <span>{stats.words.toLocaleString()} words</span>
                <span className="kicker-sep" aria-hidden="true">·</span>
                <span>{stats.minutes} min read</span>
              </>
            )}
          </div>
        </header>

        {!loading && !error && content && (
          <div className="reader-toolbar" role="toolbar" aria-label="Reading controls">
            <div className="toolbar-group">
              <TextToSpeech text={content} />
            </div>

            <div className="toolbar-group">
              <button
                type="button"
                className="toolbar-btn"
                onClick={() => adjustFontSize(-1)}
                aria-label="Decrease font size"
                title="Decrease text size"
              >
                A−
              </button>
              <button
                type="button"
                className="toolbar-btn"
                onClick={() => adjustFontSize(1)}
                aria-label="Increase font size"
                title="Increase text size"
              >
                A+
              </button>
              <button
                type="button"
                className="toolbar-btn"
                onClick={() => updatePrefs({ fontFamily: prefs.fontFamily === 'sans' ? 'serif' : 'sans' })}
                title="Toggle serif or sans-serif typeface"
              >
                {prefs.fontFamily === 'sans' ? 'Sans' : 'Serif'}
              </button>
              <button
                type="button"
                className="toolbar-btn"
                onClick={cycleMeasure}
                title="Adjust reading column width"
              >
                Width: {measureObj.label}
              </button>
              {onToggleFocus && (
                <button
                  type="button"
                  className={`toolbar-btn ${isFocusMode ? 'active' : ''}`}
                  onClick={onToggleFocus}
                  title="Toggle distraction-free focus mode"
                >
                  {isFocusMode ? 'Show Index' : 'Focus'}
                </button>
              )}
            </div>

            <div className="toolbar-group">
              {onRandomChapter && (
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={onRandomChapter}
                  title="Jump to another random entry"
                >
                  Random
                </button>
              )}
              {novelKey && (
                <>
                  <button
                    type="button"
                    className={`toolbar-btn ${bookmarked ? 'active' : ''}`}
                    onClick={handleBookmark}
                    aria-pressed={bookmarked}
                    title="Save to bookmarks"
                  >
                    {bookmarked ? 'Saved' : 'Save'}
                  </button>
                  <button
                    type="button"
                    className={`toolbar-btn ${appreciated ? 'active' : ''}`}
                    onClick={handleAppreciate}
                    aria-pressed={appreciated}
                    title="Mark as favorite read"
                  >
                    {appreciated ? '♥ Appreciated' : '♡ Appreciate'}
                  </button>
                </>
              )}
              <button
                type="button"
                className="toolbar-btn"
                onClick={handleCopyLink}
                title="Copy direct link"
              >
                {copied ? 'Copied' : 'Share'}
              </button>
            </div>
          </div>
        )}

        <div className="chapter-content-body">
          {loading && (
            <div className="chapter-content-loading">Loading chapter...</div>
          )}
          {error && (
            <div className="chapter-content-error">
              <p>Error loading chapter content: {error}</p>
              <p>Please try again later.</p>
            </div>
          )}
          {!loading && !error && content && (
            <>
              <div className="mobile-chapter-header">
                <h1 className="mobile-chapter-title">{title}</h1>
                {formattedDate && (
                  <div className="mobile-chapter-date">{formattedDate}</div>
                )}
              </div>

              <article
                className={`prose-canvas book-type-${bookType} ${useDropCap ? 'with-dropcap' : ''} font-${prefs.fontFamily || 'serif'}`}
                style={{ fontSize: `${prefs.fontSize || 18}px` }}
                dangerouslySetInnerHTML={{ __html: content }}
              />

              {isLastChapter && isBookComplete && (
                <div className="chapter-end-indicator">
                  <p>— The End —</p>
                </div>
              )}

              {(hasPrev || hasNext) && (
                <nav className="chapter-bottom-nav" aria-label="Entry navigation">
                  {hasPrev ? (
                    <button type="button" className="bottom-nav-btn prev" onClick={onPrev}>
                      <span className="bottom-nav-dir">← Previous</span>
                      <span className="bottom-nav-name">{prevTitle}</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  {hasNext ? (
                    <button type="button" className="bottom-nav-btn next" onClick={onNext}>
                      <span className="bottom-nav-dir">Next →</span>
                      <span className="bottom-nav-name">{nextTitle}</span>
                    </button>
                  ) : (
                    <div />
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
