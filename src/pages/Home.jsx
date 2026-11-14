import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BookCard from '../components/BookCard';
import { getAvailableNovels, fetchChaptersData, fetchChapterContent } from '../services/api';
import { getChapterSlug } from '../utils/slugify';
import {
  getReadingProgress,
  getMostRecentRead,
  getBookmarks,
  getReadingStreak,
} from '../utils/readingState';

import heroImage from '../assets/images/hero_editorial_library_1794643940917.jpg';
import coverNovels from '../assets/images/cover_novels_oil_1794643940892.jpg';
import coverStories from '../assets/images/cover_stories_oil_1794643942339.jpg';
import coverPoetry from '../assets/images/cover_poetry_oil_1794643944055.jpg';
import coverEssays from '../assets/images/cover_essays_oil_1794643993988.jpg';
import coverDrama from '../assets/images/cover_drama_oil_1794643994011.jpg';
import coverQuotes from '../assets/images/cover_quotes_oil_1794643992441.jpg';

import './Home.css';

const SECTION_ORDER = ['novel', 'short_stories', 'poems', 'essays', 'drama', 'quotes'];

const SECTION_META = {
  novel: {
    title: 'Novels',
    eyebrow: 'Completed Editions',
    subtitle: 'Six complete long-form novels across philosophical fiction, existentialism, romance, war prose, and satire.',
    image: coverNovels,
    imageAlt: 'Misty harbor pier watercolor with brass lantern representing long-form novels',
  },
  short_stories: {
    title: 'Short Stories',
    eyebrow: 'Daily Fiction & Archive',
    subtitle: 'Daily literary fables in The Paper Lantern alongside the complete 297-story archive of Flying Banana.',
    image: coverStories,
    imageAlt: 'Glowing paper lantern on an evening study table representing short stories',
  },
  poems: {
    title: 'Poetry Collections',
    eyebrow: 'English & Tamil Verse',
    subtitle: 'Daily verse in Salt & Amber and Tamil Poetry (காற்றில் கலந்த கவிதை), plus three completed anthologies.',
    image: coverPoetry,
    imageAlt: 'Brass oil lamp and palm-leaf manuscripts representing Tamil and English poetry',
  },
  essays: {
    title: 'Essays',
    eyebrow: 'Leveled Daily Non-Fiction',
    subtitle: 'Daily reflective essays in The Curious Ledger, randomly generated at Low, Medium, and High reading difficulty.',
    image: coverEssays,
    imageAlt: 'Sunlit classical library colonnade representing reflective essays',
  },
  drama: {
    title: 'Drama',
    eyebrow: 'Serialized Stage Plays',
    subtitle: 'Two ongoing multi-act plays updating daily scene by scene until curtain call, plus the completed farce.',
    image: coverDrama,
    imageAlt: 'Intimate theater stage bathed in warm spotlight representing dramatic plays',
  },
  quotes: {
    title: 'Quotes & Micro-Reflections',
    eyebrow: 'Bilingual Daily Aphorisms',
    subtitle: 'Concise English maxims and classical Tamil Kurals in Pocket Wisdom & Kurals—built for daily reading, OS alerts, and email digests.',
    image: coverQuotes,
    imageAlt: 'Antique brass hourglass with scrolls and clay teacup representing daily quotes and reflections',
  },
};

const CATEGORY_TABS = [
  { key: 'all', label: 'All Works' },
  { key: 'novel', label: 'Novels' },
  { key: 'short_stories', label: 'Short Stories' },
  { key: 'poems', label: 'Poetry' },
  { key: 'essays', label: 'Essays' },
  { key: 'drama', label: 'Drama' },
  { key: 'quotes', label: 'Quotes' },
];

export default function Home() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [essayDifficulty, setEssayDifficulty] = useState('all');
  const [dailySpotlight, setDailySpotlight] = useState(null);
  const [showBookmarks, setShowBookmarks] = useState(false);

  const [progressMap, setProgressMap] = useState({});
  const [recentRead, setRecentRead] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [streak, setStreak] = useState({ days: 0, totalEntriesRead: 0 });

  useEffect(() => {
    document.title = 'mockpoet — Literary Reading Room';
    setProgressMap(getReadingProgress());
    setRecentRead(getMostRecentRead());
    setBookmarks(getBookmarks());
    setStreak(getReadingStreak());
  }, []);

  useEffect(() => {
    async function loadBooks() {
      try {
        setLoading(true);
        const novels = getAvailableNovels();
        const results = await Promise.all(
          novels.map(async (novel) => {
            try {
              const data = await fetchChaptersData(novel.key);
              return {
                key: novel.key,
                title: data.novel_title || novel.title,
                description: novel.description || '',
                chapters: data.total_chapters || 0,
                plannedChapters: data.planned_chapters || null,
                lastUpdated: data.last_updated,
                type: novel.type || 'novel',
                isShortStories: novel.type === 'short_stories',
                isPoems: novel.type === 'poems',
                isEssays: novel.type === 'essays',
                isDrama: novel.type === 'drama',
                isQuotes: novel.type === 'quotes',
                genre: data.genre,
                subgenre: data.subgenre,
                language: data.language || novel.language || 'English',
                completed: Boolean(data.completed),
                updateFrequency: data.update_frequency || (data.completed ? 'Completed edition' : 'Updated daily'),
                rawChapters: Array.isArray(data.chapters) ? data.chapters : [],
              };
            } catch (err) {
              console.error(`Failed to load data for ${novel.title}:`, err);
              return null;
            }
          })
        );

        const bookData = results.filter(Boolean);
        if (bookData.length === 0) {
          throw new Error('No literary collections could be loaded');
        }
        setBooks(bookData);

        // Build deterministic Daily Featured Spotlight from ongoing daily works
        const spotlightPool = bookData.filter(
          (b) => ['paper_lantern', 'salt_and_amber', 'tamil_poetry', 'curious_ledger', 'clockmakers_alibi', 'monsoon_street', 'pocket_wisdom'].includes(b.key) &&
            b.rawChapters.length > 0
        );
        if (spotlightPool.length > 0) {
          const daySeed = Math.floor(Date.now() / 86400000);
          const pickedBook = spotlightPool[daySeed % spotlightPool.length];
          const pickedChapter = pickedBook.rawChapters[pickedBook.rawChapters.length - 1];
          let excerpt = pickedBook.description;
          try {
            const md = await fetchChapterContent(pickedChapter.url, pickedChapter.filename, pickedBook.key);
            const cleaned = md
              .replace(/<!--[\s\S]*?-->/g, '')
              .replace(/^#.*$/gm, '')
              .replace(/[*_`>#]/g, '')
              .trim();
            if (cleaned) {
              excerpt = cleaned.slice(0, 220).trim() + (cleaned.length > 220 ? '…' : '');
            }
          } catch {
            // fallback to description
          }
          setDailySpotlight({
            book: pickedBook,
            chapter: pickedChapter,
            excerpt,
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, []);

  const curiousLedger = useMemo(
    () => books.find((b) => b.key === 'curious_ledger'),
    [books]
  );

  const filteredEssays = useMemo(() => {
    if (!curiousLedger) return [];
    if (essayDifficulty === 'all') return curiousLedger.rawChapters;
    return curiousLedger.rawChapters.filter((ch) => (ch.difficulty || 'medium') === essayDifficulty);
  }, [curiousLedger, essayDifficulty]);

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return books.filter((book) => {
      if (activeCategory !== 'all' && book.type !== activeCategory) {
        return false;
      }
      if (!q) return true;
      return (
        book.title.toLowerCase().includes(q) ||
        (book.description || '').toLowerCase().includes(q) ||
        (book.subgenre || '').toLowerCase().includes(q) ||
        (book.language || '').toLowerCase().includes(q)
      );
    });
  }, [books, activeCategory, searchQuery]);

  const groupedBooks = useMemo(() => {
    return SECTION_ORDER.reduce((acc, type) => {
      const items = filteredBooks.filter((b) => b.type === type);
      if (items.length > 0) {
        acc.push({ type, items });
      }
      return acc;
    }, []);
  }, [filteredBooks]);

  const totals = useMemo(() => {
    const totalEntries = books.reduce((sum, b) => sum + (b.chapters || 0), 0);
    const activeDaily = books.filter((b) => !b.completed).length;
    return {
      works: books.length,
      entries: totalEntries,
      activeDaily,
    };
  }, [books]);

  const handleSurpriseMe = () => {
    const eligible = books.filter((b) => b.rawChapters.length > 0);
    if (eligible.length === 0) return;
    const book = eligible[Math.floor(Math.random() * eligible.length)];
    const chapter = book.rawChapters[Math.floor(Math.random() * book.rawChapters.length)];
    const slug = getChapterSlug(chapter);
    sessionStorage.setItem('selectedNovel', book.key);
    navigate(`/reader/${book.key}/${slug}`);
  };

  const openChapter = (novelKey, chapterObj) => {
    sessionStorage.setItem('selectedNovel', novelKey);
    const slug = getChapterSlug(chapterObj);
    navigate(`/reader/${novelKey}/${slug}`);
  };

  const openBookmark = (bm) => {
    sessionStorage.setItem('selectedNovel', bm.novelKey);
    const book = books.find((b) => b.key === bm.novelKey);
    const chapterObj = book?.rawChapters.find((c) => c.chapter === bm.chapterNum);
    if (chapterObj) {
      navigate(`/reader/${bm.novelKey}/${getChapterSlug(chapterObj)}`);
    } else {
      navigate(`/reader/${bm.novelKey}`);
    }
  };

  const handleContinueReading = () => {
    if (!recentRead) return;
    const book = books.find((b) => b.key === recentRead.novelKey);
    const chapterObj = book?.rawChapters.find((c) => c.chapter === recentRead.chapterNum);
    sessionStorage.setItem('selectedNovel', recentRead.novelKey);
    if (chapterObj) {
      navigate(`/reader/${recentRead.novelKey}/${getChapterSlug(chapterObj)}`);
    } else {
      navigate(`/reader/${recentRead.novelKey}`);
    }
  };

  return (
    <main className="home-container">
      {/* Editorial Hero */}
      <section className="hero-section">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="hero-eyebrow">Archival Reading Room · Updated Daily</div>
            <h1 className="hero-title">Stories, Verse, Essays &amp; Plays Written for Quiet Return.</h1>
            <p className="hero-lead">
              Explore six completed novels, daily short fiction, English and Tamil poetry, leveled essays across three reading depths, and serialized chamber dramas.
            </p>

            <div className="hero-actions">
              {dailySpotlight ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => openChapter(dailySpotlight.book.key, dailySpotlight.chapter)}
                >
                  Read Today&apos;s Pick
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSurpriseMe}
                >
                  Start Reading
                </button>
              )}
              <button type="button" className="btn-secondary" onClick={handleSurpriseMe}>
                Surprise Me
              </button>
              {bookmarks.length > 0 && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowBookmarks((prev) => !prev)}
                >
                  Saved ({bookmarks.length})
                </button>
              )}
            </div>

            {!loading && books.length > 0 && (
              <div className="hero-metrics">
                <span>{totals.works} Editions</span>
                <span aria-hidden="true">·</span>
                <span>{totals.entries.toLocaleString()} Chapters, Poems &amp; Scenes</span>
                <span aria-hidden="true">·</span>
                <span>{totals.activeDaily} Daily Live Series</span>
              </div>
            )}
          </div>

          <div className="hero-media-col">
            <div className="hero-image-frame">
              <img
                src={heroImage}
                alt="Editorial wooden desk with open hardcover book, fountain pen, and warm reading lamp"
                className="hero-image"
                referrerPolicy="no-referrer"
              />
            </div>

            {dailySpotlight && (
              <div
                className="spotlight-card"
                onClick={() => openChapter(dailySpotlight.book.key, dailySpotlight.chapter)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openChapter(dailySpotlight.book.key, dailySpotlight.chapter);
                  }
                }}
              >
                <div className="spotlight-kicker">
                  <span>Today&apos;s Featured Edition</span>
                  <span aria-hidden="true">·</span>
                  <span>{dailySpotlight.book.title}</span>
                </div>
                <h2 className="spotlight-title">{dailySpotlight.chapter.chapter_name}</h2>
                <p className="spotlight-excerpt">{dailySpotlight.excerpt}</p>
                <span className="spotlight-cta">Open in Reader →</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Returning Reader Strip */}
      {(recentRead || streak.totalEntriesRead > 0 || (showBookmarks && bookmarks.length > 0)) && (
        <section className="returning-strip" aria-label="Your reading activity">
          <div className="returning-strip-inner">
            {recentRead && (
              <div className="returning-continue">
                <div className="returning-label">Continue Reading</div>
                <div className="returning-detail">
                  <strong>{recentRead.bookTitle}</strong>
                  <span className="returning-sep" aria-hidden="true">·</span>
                  <span>{recentRead.chapterName}</span>
                </div>
                <button type="button" className="returning-resume-btn" onClick={handleContinueReading}>
                  Resume →
                </button>
              </div>
            )}

            <div className="returning-stats">
              <div className="returning-stat">
                <span className="stat-val">{streak.days || 1}d</span>
                <span className="stat-lbl">Streak</span>
              </div>
              <div className="returning-stat">
                <span className="stat-val">{streak.totalEntriesRead}</span>
                <span className="stat-lbl">Entries Read</span>
              </div>
              <div className="returning-stat">
                <span className="stat-val">{bookmarks.length}</span>
                <span className="stat-lbl">Bookmarks</span>
              </div>
            </div>
          </div>

          {showBookmarks && bookmarks.length > 0 && (
            <div className="bookmarks-drawer">
              <div className="bookmarks-drawer-header">
                <h3>Saved Passages &amp; Entries</h3>
                <button type="button" className="bookmarks-close" onClick={() => setShowBookmarks(false)}>
                  Close
                </button>
              </div>
              <div className="bookmarks-list">
                {bookmarks.map((bm) => (
                  <button
                    key={`${bm.novelKey}:${bm.chapterNum}`}
                    type="button"
                    className="bookmark-item"
                    onClick={() => openBookmark(bm)}
                  >
                    <span className="bookmark-book">{bm.bookTitle}</span>
                    <span className="bookmark-chapter">{bm.chapterName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Filter & Search Bar */}
      <section className="catalog-controls" aria-label="Filter library">
        <div className="category-tabs" role="tablist" aria-label="Filter by genre">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeCategory === tab.key}
              className={`category-tab ${activeCategory === tab.key ? 'active' : ''}`}
              onClick={() => setActiveCategory(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search titles, Tamil poetry, essays, dramas…"
            aria-label="Search library"
            className="catalog-search-input"
          />
        </div>
      </section>

      {loading && (
        <div className="loading-message">
          <p>Curating library shelves…</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>Unable to load book catalog: {error}</p>
        </div>
      )}

      {!loading && !error && groupedBooks.length === 0 && (
        <div className="empty-filter-state">
          <p>No editions match &ldquo;{searchQuery}&rdquo;.</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('all');
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="sections-stack">
          {groupedBooks.map(({ type, items }) => {
            const meta = SECTION_META[type] || SECTION_META.novel;
            return (
              <section key={type} id={`section-${type}`} className="library-section">
                <div className="section-banner">
                  <div className="section-artwork-wrap">
                    <img
                      src={meta.image}
                      alt={meta.imageAlt}
                      className="section-artwork"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="section-heading-block">
                    <div className="section-eyebrow">{meta.eyebrow}</div>
                    <h2 className="book-group-title">{meta.title}</h2>
                    <p className="section-subtitle">{meta.subtitle}</p>
                  </div>
                </div>

                <div className="book-grid">
                  {items.map((book) => {
                    const visited = progressMap[book.key]?.visitedChapters?.length || 0;
                    return (
                      <BookCard
                        key={book.key}
                        novelKey={book.key}
                        title={book.title}
                        description={book.description}
                        chapters={book.chapters}
                        plannedChapters={book.plannedChapters}
                        lastUpdated={book.lastUpdated}
                        isShortStories={book.isShortStories}
                        isPoems={book.isPoems}
                        isEssays={book.isEssays}
                        isDrama={book.isDrama}
                        isQuotes={book.isQuotes}
                        subgenre={book.subgenre}
                        language={book.language}
                        completed={book.completed}
                        updateFrequency={book.updateFrequency}
                        progressCount={visited}
                      />
                    );
                  })}
                </div>

                {/* Interactive Essay Difficulty Explorer */}
                {type === 'essays' && curiousLedger && filteredEssays.length > 0 && (
                  <div className="essay-explorer">
                    <div className="essay-explorer-header">
                      <div>
                        <h3 className="essay-explorer-title">Browse Recent Essays by Reading Depth</h3>
                        <p className="essay-explorer-sub">
                          Each daily essay selects Low (accessible narrative), Medium (analytical reflection), or High (dense philosophical prose) at random.
                        </p>
                      </div>
                      <div className="difficulty-tabs" role="group" aria-label="Filter essays by difficulty">
                        {['all', 'low', 'medium', 'high'].map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            className={`difficulty-tab ${essayDifficulty === lvl ? 'active' : ''}`}
                            onClick={() => setEssayDifficulty(lvl)}
                          >
                            {lvl === 'all' ? 'All Levels' : lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="essay-quick-grid">
                      {filteredEssays.slice(-6).reverse().map((essay) => (
                        <button
                          key={essay.chapter}
                          type="button"
                          className="essay-quick-card"
                          onClick={() => openChapter('curious_ledger', essay)}
                        >
                          <div className="essay-quick-meta">
                            <span className={`essay-level-tag level-${essay.difficulty || 'medium'}`}>
                              {(essay.difficulty || 'medium').toUpperCase()} LEVEL
                            </span>
                            <span className="essay-quick-num">Essay #{essay.chapter}</span>
                          </div>
                          <div className="essay-quick-title">{essay.chapter_name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
