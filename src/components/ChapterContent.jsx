import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import TextToSpeech from './TextToSpeech';
import DownloadButtons from './DownloadButtons';
import { getTextStats } from '../services/api';
import {
  getReaderPrefs,
  saveReaderPrefs,
  isBookmarked,
  toggleBookmark,
  isAppreciated,
  toggleAppreciation,
  getChapterHighlights,
  toggleParagraphHighlight,
  getChapterNotes,
  addMarginNote,
  deleteMarginNote,
} from '../utils/readingState';
import './ChapterContent.css';

const MEASURES = [
  { key: 'narrow', label: 'Narrow', ch: '56ch' },
  { key: 'standard', label: 'Standard', ch: '66ch' },
  { key: 'wide', label: 'Wide', ch: '78ch' },
];

const LINE_SPACINGS = [
  { key: 'compact', label: 'Compact', val: '1.55' },
  { key: 'cozy', label: 'Cozy', val: '1.82' },
  { key: 'airy', label: 'Airy', val: '2.08' },
];

const PAPER_TONES = [
  { key: 'auto', label: 'Theme', swatch: 'linear-gradient(135deg, #FBF9F5 50%, #141210 50%)' },
  { key: 'paper', label: 'Paper', swatch: '#FBF9F5' },
  { key: 'sepia', label: 'Sepia', swatch: '#F4EAD5' },
  { key: 'slate', label: 'Slate', swatch: '#22262E' },
  { key: 'ink', label: 'Ink', swatch: '#12100E' },
];

function parseHtmlBlocks(html) {
  if (!html || typeof document === 'undefined') return [];
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const children = Array.from(temp.childNodes).filter(
    (node) => node.nodeType === 1 || (node.nodeType === 3 && node.textContent.trim())
  );

  let currentSpeaker = null;
  return children.map((node, idx) => {
    if (node.nodeType === 3) {
      const text = node.textContent.trim();
      return {
        index: idx,
        tag: 'p',
        html: `<p>${text}</p>`,
        text,
        speaker: currentSpeaker,
        words: text.split(/\s+/).filter(Boolean).length,
      };
    }

    const el = node;
    const tag = el.tagName.toLowerCase();
    const text = (el.textContent || '').trim();
    const isSpeaker = el.classList?.contains('drama-speaker');
    if (isSpeaker) {
      currentSpeaker = text.replace(/:$/, '').trim();
    } else if (tag === 'hr' || tag === 'h2' || tag === 'h3') {
      currentSpeaker = null;
    }

    return {
      index: idx,
      tag,
      html: el.outerHTML,
      text,
      isSpeaker,
      speaker: currentSpeaker,
      words: text.split(/\s+/).filter(Boolean).length,
    };
  });
}

function paginateBlocks(blocks, targetWordsPerPage = 260) {
  if (!blocks.length) return [[]];
  const pages = [];
  let currentPage = [];
  let wordCount = 0;

  blocks.forEach((block) => {
    const exceeds = wordCount + block.words > targetWordsPerPage && currentPage.length >= 2;
    // Keep drama speaker label attached to their immediate next line
    const prevBlock = currentPage[currentPage.length - 1];
    if (exceeds && !prevBlock?.isSpeaker) {
      pages.push(currentPage);
      currentPage = [block];
      wordCount = block.words;
    } else {
      currentPage.push(block);
      wordCount += block.words;
    }
  });

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }
  return pages;
}

export default function ChapterContent({
  novelKey = '',
  bookTitle = '',
  bookType = 'novel',
  chapterNum = 1,
  totalChapters = 1,
  currentPosition = 1,
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
  onOpenContents,
  allChaptersData = null,
  isFocusMode = false,
  onToggleFocus,
}) {
  const contentRef = useRef(null);
  const blockRefs = useRef({});

  const [scrollProgress, setScrollProgress] = useState(0);
  const [prefs, setPrefs] = useState(() => getReaderPrefs());
  const [bookmarked, setBookmarked] = useState(false);
  const [appreciated, setAppreciated] = useState(false);
  const [copied, setCopied] = useState(false);

  // Interactive studio UI state
  const [showAppearance, setShowAppearance] = useState(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(null);
  const [activeTtsBlock, setActiveTtsBlock] = useState(null);
  const [spotlightSpeaker, setSpotlightSpeaker] = useState(null);

  // Highlights & margin notes state
  const [highlights, setHighlights] = useState([]);
  const [notes, setNotes] = useState([]);
  const [draftNote, setDraftNote] = useState('');
  const [draftBlockIdx, setDraftBlockIdx] = useState(null);

  const blocks = useMemo(() => parseHtmlBlocks(content), [content]);
  const pages = useMemo(() => paginateBlocks(blocks, 250), [blocks]);
  const isPaged = (prefs.readMode || 'scroll') === 'paged' && pages.length > 1;

  // Unique drama characters in the current scene
  const dramaCharacters = useMemo(() => {
    if (bookType !== 'drama') return [];
    const seen = new Set();
    blocks.forEach((b) => {
      if (b.isSpeaker && b.speaker) {
        seen.add(b.speaker);
      }
    });
    return Array.from(seen).slice(0, 12);
  }, [blocks, bookType]);

  // Reset chapter-scoped state on entry change
  useEffect(() => {
    setBookmarked(isBookmarked(novelKey, chapterNum));
    setAppreciated(isAppreciated(novelKey, chapterNum));
    setHighlights(getChapterHighlights(novelKey, chapterNum));
    setNotes(getChapterNotes(novelKey, chapterNum));
    setCopied(false);
    setSelectedBlockIndex(null);
    setActiveTtsBlock(null);
    setSpotlightSpeaker(null);
    setCurrentPage(0);
    setDraftNote('');
    setDraftBlockIdx(null);
  }, [novelKey, chapterNum]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
    if (typeof navigator !== 'undefined' && !navigator.userAgent?.includes('jsdom')) {
      window.scrollTo({ top: 0 });
    }
    setScrollProgress(0);
    setCurrentPage(0);
  }, [content]);

  // Scroll or page progress bar computation
  useEffect(() => {
    if (isPaged) {
      const pct = Math.round(((currentPage + 1) / Math.max(1, pages.length)) * 100);
      setScrollProgress(pct);
      return undefined;
    }

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
  }, [content, isPaged, currentPage, pages.length]);

  // Keyboard navigation: handles page turns in Paged mode or chapter turns in Scroll mode
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.key === 'Escape') {
        setShowAppearance(false);
        setShowNotesDrawer(false);
        setSelectedBlockIndex(null);
        return;
      }
      if (e.key === 'ArrowRight') {
        if (isPaged && currentPage < pages.length - 1) {
          setCurrentPage((p) => p + 1);
          window.scrollTo?.({ top: 0, behavior: 'smooth' });
        } else if (hasNext && onNext) {
          onNext();
        }
      } else if (e.key === 'ArrowLeft') {
        if (isPaged && currentPage > 0) {
          setCurrentPage((p) => p - 1);
          window.scrollTo?.({ top: 0, behavior: 'smooth' });
        } else if (hasPrev && onPrev) {
          onPrev();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPaged, currentPage, pages.length, hasNext, hasPrev, onNext, onPrev]);

  const handleTtsSegmentChange = useCallback(
    (segment) => {
      if (!segment) {
        setActiveTtsBlock(null);
        return;
      }
      setActiveTtsBlock(segment.blockIndex);
      if (isPaged) {
        const pageIdx = pages.findIndex((pg) => pg.some((b) => b.index === segment.blockIndex));
        if (pageIdx >= 0 && pageIdx !== currentPage) {
          setCurrentPage(pageIdx);
        }
      } else {
        const node = blockRefs.current[segment.blockIndex];
        if (node && typeof node.scrollIntoView === 'function') {
          node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    },
    [isPaged, pages, currentPage]
  );

  const updatePrefs = (patch) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    saveReaderPrefs(next);
  };

  const adjustFontSize = (delta) => {
    const nextSize = Math.min(26, Math.max(14, (prefs.fontSize || 18) + delta));
    updatePrefs({ fontSize: nextSize });
  };

  const handleBookmark = () => {
    if (!novelKey) return;
    setBookmarked(
      toggleBookmark({
        novelKey,
        bookTitle,
        chapterNum,
        chapterName: title,
        bookType,
      })
    );
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

  const handleToggleBlockHighlight = (block) => {
    if (!novelKey) return;
    const updated = toggleParagraphHighlight(novelKey, chapterNum, block.index, block.text);
    setHighlights(updated);
    setSelectedBlockIndex(null);
  };

  const handleOpenNoteForBlock = (block) => {
    setDraftBlockIdx(block.index);
    setShowNotesDrawer(true);
    setSelectedBlockIndex(null);
  };

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!draftNote.trim() || !novelKey) return;
    const targetBlock = draftBlockIdx !== null ? blocks.find((b) => b.index === draftBlockIdx) : null;
    const updated = addMarginNote(
      novelKey,
      chapterNum,
      draftNote,
      draftBlockIdx,
      targetBlock?.text || ''
    );
    setNotes(updated);
    setDraftNote('');
    setDraftBlockIdx(null);
  };

  const handleDeleteNote = (noteId) => {
    if (!novelKey) return;
    setNotes(deleteMarginNote(novelKey, chapterNum, noteId));
  };

  const jumpToBlock = (blockIndex) => {
    if (blockIndex === null || blockIndex === undefined) return;
    if (isPaged) {
      const pageIdx = pages.findIndex((pg) => pg.some((b) => b.index === blockIndex));
      if (pageIdx >= 0) setCurrentPage(pageIdx);
    } else {
      const node = blockRefs.current[blockIndex];
      node?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    }
    setSelectedBlockIndex(blockIndex);
    setShowNotesDrawer(false);
  };

  const stats = getTextStats(content);
  const measureObj = MEASURES.find((m) => m.key === prefs.measure) || MEASURES[1];
  const lineSpacingObj = LINE_SPACINGS.find((l) => l.key === prefs.lineHeight) || LINE_SPACINGS[1];

  const plainStart = (content || '').replace(/<[^>]+>/g, '').trim();
  const useDropCap =
    (bookType === 'novel' || bookType === 'short_stories' || bookType === 'essays') &&
    /^[A-Za-z]/.test(plainStart) &&
    (!isPaged || currentPage === 0);

  const formattedDate = publishedDate
    ? new Date(publishedDate.replace(' UTC', 'Z').replace(' ', 'T')).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const visibleBlocks = isPaged ? pages[currentPage] || [] : blocks;
  const highlightedBlockSet = useMemo(
    () => new Set(highlights.map((h) => h.blockIndex)),
    [highlights]
  );

  const showEndIndicator = isLastChapter && isBookComplete && (!isPaged || currentPage === pages.length - 1);
  const minutesLeft = Math.max(1, Math.round(stats.minutes * (1 - scrollProgress / 100)));

  return (
    <main
      className={`chapter-content paper-tone-${prefs.paperTone || 'auto'} ${isFocusMode ? 'zen-active' : ''}`}
      ref={contentRef}
    >
      {/* Slim reading progress bar pinned cleanly at top */}
      <div className="reading-progress-bar" aria-hidden="true">
        <div className="reading-progress-fill" style={{ width: `${scrollProgress}%` }} />
      </div>

      {/* Interactive Studio Dock */}
      {!loading && !error && content && (
        <div className="reader-studio-dock" role="toolbar" aria-label="Interactive reading studio">
          <div className="studio-dock-inner">
            {/* Left cluster: Index Drawer & Prev/Next Chapter */}
            <div className="studio-cluster">
              {onOpenContents && (
                <button
                  type="button"
                  className="studio-btn studio-contents-btn"
                  onClick={onOpenContents}
                  title="Open table of contents"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="15" y2="18" />
                  </svg>
                  <span>Contents</span>
                  {totalChapters > 1 && (
                    <span className="studio-count-meta">{currentPosition}/{totalChapters}</span>
                  )}
                </button>
              )}

              <div className="studio-nav-arrows">
                <button
                  type="button"
                  className="studio-icon-btn"
                  onClick={onPrev}
                  disabled={!hasPrev}
                  aria-label="Previous chapter"
                  title={prevTitle || 'No previous entry'}
                >
                  ←
                </button>
                <button
                  type="button"
                  className="studio-icon-btn"
                  onClick={onNext}
                  disabled={!hasNext}
                  aria-label="Next chapter"
                  title={nextTitle || 'No next entry'}
                >
                  →
                </button>
              </div>
            </div>

            {/* Center cluster: Scroll vs Book Pages & Voice Listening */}
            <div className="studio-cluster studio-center-cluster">
              {pages.length > 1 && (
                <div className="read-mode-switch" role="group" aria-label="Reading layout mode">
                  <button
                    type="button"
                    className={`mode-switch-btn ${(prefs.readMode || 'scroll') === 'scroll' ? 'active' : ''}`}
                    onClick={() => updatePrefs({ readMode: 'scroll' })}
                  >
                    Scroll
                  </button>
                  <button
                    type="button"
                    className={`mode-switch-btn ${prefs.readMode === 'paged' ? 'active' : ''}`}
                    onClick={() => updatePrefs({ readMode: 'paged' })}
                  >
                    Book Pages
                  </button>
                </div>
              )}

              <TextToSpeech text={content} onSegmentChange={handleTtsSegmentChange} />
            </div>

            {/* Right cluster: Typography & Paper Studio, Margin Notes, Bookmark, Zen */}
            <div className="studio-cluster">
              <div className="studio-popover-anchor">
                <button
                  type="button"
                  className={`studio-btn ${showAppearance ? 'active' : ''}`}
                  onClick={() => setShowAppearance((prev) => !prev)}
                  aria-expanded={showAppearance}
                  title="Paper tone, font & spacing"
                >
                  Aa Paper &amp; Type
                </button>

                {showAppearance && (
                  <div className="appearance-popover" role="dialog" aria-label="Typography and paper controls">
                    <div className="pop-section">
                      <span className="pop-label">Paper Tone</span>
                      <div className="paper-swatches">
                        {PAPER_TONES.map((tone) => (
                          <button
                            key={tone.key}
                            type="button"
                            className={`paper-swatch-btn ${prefs.paperTone === tone.key ? 'active' : ''}`}
                            onClick={() => updatePrefs({ paperTone: tone.key })}
                            title={tone.label}
                          >
                            <span className="paper-swatch-dot" style={{ background: tone.swatch }} />
                            <span>{tone.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pop-section">
                      <span className="pop-label">Text Size ({prefs.fontSize || 18}px)</span>
                      <div className="pop-btn-row">
                        <button type="button" className="pop-chip" onClick={() => adjustFontSize(-1)} aria-label="Decrease font size">
                          A−
                        </button>
                        <button type="button" className="pop-chip" onClick={() => updatePrefs({ fontSize: 18 })}>
                          Reset
                        </button>
                        <button type="button" className="pop-chip" onClick={() => adjustFontSize(1)} aria-label="Increase font size">
                          A+
                        </button>
                      </div>
                    </div>

                    <div className="pop-section">
                      <span className="pop-label">Typeface</span>
                      <div className="pop-btn-row">
                        {[
                          { key: 'serif', label: 'Lora' },
                          { key: 'classic', label: 'Display' },
                          { key: 'sans', label: 'Sans' },
                        ].map((f) => (
                          <button
                            key={f.key}
                            type="button"
                            className={`pop-chip ${prefs.fontFamily === f.key ? 'active' : ''}`}
                            onClick={() => updatePrefs({ fontFamily: f.key })}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pop-section">
                      <span className="pop-label">Line Spacing</span>
                      <div className="pop-btn-row">
                        {LINE_SPACINGS.map((ls) => (
                          <button
                            key={ls.key}
                            type="button"
                            className={`pop-chip ${prefs.lineHeight === ls.key ? 'active' : ''}`}
                            onClick={() => updatePrefs({ lineHeight: ls.key })}
                          >
                            {ls.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pop-section">
                      <span className="pop-label">Line Width</span>
                      <div className="pop-btn-row">
                        {MEASURES.map((m) => (
                          <button
                            key={m.key}
                            type="button"
                            className={`pop-chip ${prefs.measure === m.key ? 'active' : ''}`}
                            onClick={() => updatePrefs({ measure: m.key })}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {novelKey && (
                <>
                  <button
                    type="button"
                    className={`studio-btn ${showNotesDrawer || notes.length > 0 || highlights.length > 0 ? 'has-items' : ''}`}
                    onClick={() => setShowNotesDrawer((prev) => !prev)}
                    title="Margin notes & highlighted passages"
                  >
                    Notes{notes.length + highlights.length > 0 ? ` (${notes.length + highlights.length})` : ''}
                  </button>

                  <button
                    type="button"
                    className={`studio-btn ${bookmarked ? 'active' : ''}`}
                    onClick={handleBookmark}
                    aria-pressed={bookmarked}
                    title="Save to bookmarks"
                  >
                    {bookmarked ? 'Saved' : 'Save'}
                  </button>

                  <button
                    type="button"
                    className={`studio-btn ${appreciated ? 'active' : ''}`}
                    onClick={handleAppreciate}
                    aria-pressed={appreciated}
                    title="Mark as favorite read"
                  >
                    {appreciated ? '♥' : '♡'}
                  </button>
                </>
              )}

              {allChaptersData && (
                <DownloadButtons bookTitle={bookTitle || 'Book'} chapters={allChaptersData} />
              )}

              {onRandomChapter && (
                <button type="button" className="studio-btn" onClick={onRandomChapter} title="Jump to random entry">
                  Random
                </button>
              )}

              <button type="button" className="studio-btn" onClick={handleCopyLink} title="Copy direct link">
                {copied ? 'Copied' : 'Share'}
              </button>

              {onToggleFocus && (
                <button
                  type="button"
                  className={`studio-btn ${isFocusMode ? 'active' : ''}`}
                  onClick={onToggleFocus}
                  title="Toggle distraction-free Zen view"
                >
                  {isFocusMode ? 'Exit Zen' : 'Zen'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Reading Page Sheet */}
      <div
        className={`chapter-article-shell ${isPaged ? 'paged-book-sheet' : ''}`}
        style={{
          '--reader-measure': measureObj.ch,
          '--reader-line-height': lineSpacingObj.val,
        }}
      >
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
              <span className="chapter-published-date">Published {formattedDate}</span>
            )}
            {!loading && !error && content && (
              <>
                {formattedDate && <span className="kicker-sep" aria-hidden="true">·</span>}
                <span>{stats.words.toLocaleString()} words</span>
                <span className="kicker-sep" aria-hidden="true">·</span>
                <span>{scrollProgress > 5 && scrollProgress < 98 ? `${minutesLeft} min left` : `${stats.minutes} min read`}</span>
                {isPaged && (
                  <>
                    <span className="kicker-sep" aria-hidden="true">·</span>
                    <span className="page-counter-badge">Page {currentPage + 1} of {pages.length}</span>
                  </>
                )}
              </>
            )}
          </div>
        </header>

        {/* Interactive Drama Cast Spotlight Bar */}
        {!loading && !error && dramaCharacters.length > 0 && (
          <div className="drama-cast-bar" role="region" aria-label="Cast spotlight">
            <span className="cast-bar-label">Cast Spotlight:</span>
            <button
              type="button"
              className={`cast-chip ${spotlightSpeaker === null ? 'active' : ''}`}
              onClick={() => setSpotlightSpeaker(null)}
            >
              All Roles
            </button>
            {dramaCharacters.map((char) => (
              <button
                key={char}
                type="button"
                className={`cast-chip ${spotlightSpeaker === char ? 'active' : ''}`}
                onClick={() => setSpotlightSpeaker((prev) => (prev === char ? null : char))}
              >
                {char}
              </button>
            ))}
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
                className={`prose-canvas book-type-${bookType} ${useDropCap ? 'with-dropcap' : ''} font-${prefs.fontFamily || 'serif'} ${spotlightSpeaker ? 'has-cast-spotlight' : ''}`}
                style={{ fontSize: `${prefs.fontSize || 18}px` }}
              >
                {visibleBlocks.length > 0 ? (
                  visibleBlocks.map((block) => {
                    const isHighlighted = highlightedBlockSet.has(block.index);
                    const isSpeaking = activeTtsBlock === block.index;
                    const isSelected = selectedBlockIndex === block.index;
                    const isDimmedByCast =
                      spotlightSpeaker && block.speaker !== spotlightSpeaker && !block.isSpeaker;
                    const isSpeakerSpotlighted =
                      spotlightSpeaker && block.speaker === spotlightSpeaker;

                    return (
                      <div
                        key={block.index}
                        ref={(el) => {
                          if (el) blockRefs.current[block.index] = el;
                        }}
                        className={[
                          'prose-block',
                          isHighlighted ? 'is-highlighted' : '',
                          isSpeaking ? 'is-tts-active' : '',
                          isSelected ? 'is-selected' : '',
                          isDimmedByCast ? 'is-cast-dimmed' : '',
                          isSpeakerSpotlighted ? 'is-cast-focused' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => {
                          if (block.tag !== 'hr' && block.text) {
                            setSelectedBlockIndex((prev) => (prev === block.index ? null : block.index));
                          }
                        }}
                      >
                        <div dangerouslySetInnerHTML={{ __html: block.html }} />
                        {isSelected && novelKey && (
                          <div
                            className="block-action-bar"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              className="block-action-btn"
                              onClick={() => handleToggleBlockHighlight(block)}
                            >
                              {isHighlighted ? 'Remove Highlight' : 'Highlight Passage'}
                            </button>
                            <button
                              type="button"
                              className="block-action-btn"
                              onClick={() => handleOpenNoteForBlock(block)}
                            >
                              + Margin Note
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                )}
              </article>

              {/* Paged Book Controls */}
              {isPaged && (
                <div className="book-page-turner" role="navigation" aria-label="Book page navigation">
                  <button
                    type="button"
                    className="page-turn-btn"
                    disabled={currentPage === 0}
                    onClick={() => {
                      setCurrentPage((p) => Math.max(0, p - 1));
                      window.scrollTo?.({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    ← Prev Page
                  </button>
                  <span className="page-turn-status">
                    Page {currentPage + 1} of {pages.length}
                  </span>
                  <button
                    type="button"
                    className="page-turn-btn"
                    disabled={currentPage >= pages.length - 1}
                    onClick={() => {
                      setCurrentPage((p) => Math.min(pages.length - 1, p + 1));
                      window.scrollTo?.({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Next Page →
                  </button>
                </div>
              )}

              {showEndIndicator && (
                <div className="chapter-end-indicator">
                  <p>— The End —</p>
                </div>
              )}

              {(hasPrev || hasNext) && (!isPaged || currentPage === pages.length - 1) && (
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

      {/* Right Slide-Over Margin Notes & Highlights Drawer */}
      {showNotesDrawer && (
        <>
          <div className="notes-backdrop" onClick={() => setShowNotesDrawer(false)} aria-hidden="true" />
          <aside className="margin-notes-drawer" aria-label="Margin notes and highlights">
            <div className="notes-drawer-header">
              <div>
                <h2 className="notes-drawer-title">Margin Notes &amp; Highlights</h2>
                <p className="notes-drawer-sub">{title}</p>
              </div>
              <button
                type="button"
                className="notes-close-btn"
                onClick={() => setShowNotesDrawer(false)}
                aria-label="Close margin notes"
              >
                ✕
              </button>
            </div>

            <form className="note-composer" onSubmit={handleSaveNote}>
              {draftBlockIdx !== null && (
                <div className="note-attached-badge">
                  <span>Attached to paragraph #{draftBlockIdx + 1}</span>
                  <button type="button" onClick={() => setDraftBlockIdx(null)}>Clear</button>
                </div>
              )}
              <textarea
                rows={3}
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder="Write a margin reflection on this chapter or passage…"
                className="note-textarea"
              />
              <button type="submit" className="note-submit-btn" disabled={!draftNote.trim()}>
                Save Note
              </button>
            </form>

            <div className="notes-scroll-body">
              {highlights.length > 0 && (
                <div className="notes-group">
                  <h3 className="notes-group-heading">Highlighted Passages ({highlights.length})</h3>
                  {highlights.map((hl) => (
                    <div key={hl.blockIndex} className="saved-highlight-card">
                      <p className="saved-excerpt" onClick={() => jumpToBlock(hl.blockIndex)}>
                        &ldquo;{hl.excerpt}{hl.excerpt.length >= 160 ? '…' : ''}&rdquo;
                      </p>
                      <button
                        type="button"
                        className="saved-remove-btn"
                        onClick={() =>
                          setHighlights(toggleParagraphHighlight(novelKey, chapterNum, hl.blockIndex, hl.excerpt))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="notes-group">
                <h3 className="notes-group-heading">Your Notes ({notes.length})</h3>
                {notes.length === 0 ? (
                  <p className="notes-empty-hint">
                    Click any paragraph while reading to highlight it or attach a personal margin note.
                  </p>
                ) : (
                  notes.map((item) => (
                    <div key={item.id} className="saved-note-card">
                      {item.excerpt && (
                        <div className="note-quote-ref" onClick={() => jumpToBlock(item.blockIndex)}>
                          &ldquo;{item.excerpt}&rdquo;
                        </div>
                      )}
                      <p className="note-body-text">{item.note}</p>
                      <button
                        type="button"
                        className="saved-remove-btn"
                        onClick={() => handleDeleteNote(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </>
      )}
    </main>
  );
}
