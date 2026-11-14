import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChapterList from '../components/ChapterList';
import ChapterContent from '../components/ChapterContent';
import { fetchChaptersData, fetchChapterContent, parseMarkdown, getBookType } from '../services/api';
import { findChapterBySlug, getChapterSlug } from '../utils/slugify';
import { recordReadingProgress, getReadingProgress } from '../utils/readingState';
import './Reader.css';

export default function Reader() {
  const { novelKey: urlNovelKey, chapterSlug } = useParams();
  const navigate = useNavigate();
  const [chaptersData, setChaptersData] = useState(null);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [chapterContent, setChapterContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [visitedChapters, setVisitedChapters] = useState([]);

  const novelKey = urlNovelKey || sessionStorage.getItem('selectedNovel') || 'weight_of_promises';
  const bookType = getBookType(novelKey);

  useEffect(() => {
    if (!urlNovelKey && novelKey) {
      navigate(`/reader/${novelKey}`, { replace: true });
    }
  }, [urlNovelKey, novelKey, navigate]);

  const navigateToChapter = useCallback(
    (chapterObj, replace = true) => {
      if (!chapterObj) return;
      const slug = getChapterSlug(chapterObj);
      navigate(`/reader/${novelKey}/${encodeURIComponent(slug)}`, { replace });
    },
    [navigate, novelKey]
  );

  // Sync URL chapterSlug with currentChapter
  useEffect(() => {
    if (chapterSlug && chaptersData) {
      const chapter = findChapterBySlug(chaptersData.chapters, chapterSlug);
      if (chapter) {
        setCurrentChapter(chapter.chapter);
      } else if (chaptersData.chapters.length > 0) {
        navigateToChapter(chaptersData.chapters[0], true);
      }
    }
  }, [chapterSlug, chaptersData, navigateToChapter]);

  // Load metadata for selected work
  useEffect(() => {
    async function loadChaptersData() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchChaptersData(novelKey);
        setChaptersData(data);
        document.title = `${data.novel_title} — mockpoet`;

        const saved = getReadingProgress()[novelKey];
        if (saved?.visitedChapters) {
          setVisitedChapters(saved.visitedChapters);
        }

        if (!chapterSlug && data.chapters.length > 0) {
          let selectedChapter;
          if (bookType === 'poems' || bookType === 'short_stories' || bookType === 'essays' || bookType === 'quotes') {
            selectedChapter = data.chapters[data.chapters.length - 1];
          } else if (saved?.chapterNum) {
            selectedChapter =
              data.chapters.find((c) => c.chapter === saved.chapterNum) || data.chapters[0];
          } else {
            selectedChapter = data.chapters[0];
          }
          setCurrentChapter(selectedChapter.chapter);
          navigateToChapter(selectedChapter, true);
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    loadChaptersData();
  }, [novelKey, chapterSlug, bookType, navigateToChapter]);

  useEffect(() => {
    const handleToggle = () => setIsMenuOpen((prev) => !prev);
    window.addEventListener('toggleChapterList', handleToggle);
    return () => window.removeEventListener('toggleChapterList', handleToggle);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('reader-zen-mode', isFocusMode);
    return () => {
      document.body.classList.remove('reader-zen-mode');
    };
  }, [isFocusMode]);

  // Load current entry markdown & record reading progress
  useEffect(() => {
    async function loadChapter() {
      if (!chaptersData || !chaptersData.chapters?.length) return;

      try {
        setLoading(true);
        setError(null);

        const chapterData =
          chaptersData.chapters.find((ch) => ch.chapter === currentChapter) ||
          chaptersData.chapters[0];

        if (!chapterData) {
          throw new Error('Entry not found');
        }

        const content = await fetchChapterContent(
          chapterData.url,
          chapterData.filename,
          novelKey
        );
        const html = parseMarkdown(content, bookType);
        setChapterContent(html);

        recordReadingProgress({
          novelKey,
          bookTitle: chaptersData.novel_title,
          chapterNum: chapterData.chapter,
          chapterName: chapterData.chapter_name || `Entry ${chapterData.chapter}`,
          bookType,
          totalChapters: chaptersData.total_chapters,
        });
        const updatedProgress = getReadingProgress()[novelKey];
        if (updatedProgress?.visitedChapters) {
          setVisitedChapters([...updatedProgress.visitedChapters]);
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    loadChapter();
  }, [currentChapter, chaptersData, novelKey, bookType]);

  const handleChapterSelect = useCallback(
    (chapterNum) => {
      setCurrentChapter(chapterNum);
      if (chaptersData) {
        const chapter = chaptersData.chapters.find((ch) => ch.chapter === chapterNum);
        if (chapter) {
          navigateToChapter(chapter, false);
        }
      }
    },
    [chaptersData, navigateToChapter]
  );

  const handleRandomChapter = useCallback(() => {
    if (!chaptersData || chaptersData.chapters.length <= 1) return;
    const candidates = chaptersData.chapters.filter((ch) => ch.chapter !== currentChapter);
    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    if (picked) {
      handleChapterSelect(picked.chapter);
    }
  }, [chaptersData, currentChapter, handleChapterSelect]);

  const currentIndex = chaptersData
    ? chaptersData.chapters.findIndex((ch) => ch.chapter === currentChapter)
    : -1;
  const prevChapterObj = currentIndex > 0 ? chaptersData.chapters[currentIndex - 1] : null;
  const nextChapterObj =
    chaptersData && currentIndex >= 0 && currentIndex < chaptersData.chapters.length - 1
      ? chaptersData.chapters[currentIndex + 1]
      : null;

  const formatTitle = (chapterData, fallbackNum) => {
    if (chapterData?.chapter_name) {
      if (bookType === 'novel') {
        return `Chapter ${chapterData.chapter}: ${chapterData.chapter_name}`;
      }
      return chapterData.chapter_name;
    }
    if (bookType === 'drama') return `Scene ${fallbackNum}`;
    return bookType === 'novel' ? `Chapter ${fallbackNum}` : `Entry ${fallbackNum}`;
  };

  if (!chaptersData && loading) {
    return (
      <div className="reader-layout">
        <ChapterContent title="Loading..." loading={true} />
      </div>
    );
  }

  if (error && !chaptersData) {
    return (
      <div className="reader-layout">
        <ChapterContent title="Error" error={error} />
      </div>
    );
  }

  const currentMeta = chaptersData?.chapters.find((ch) => ch.chapter === currentChapter) || null;

  const getAllChaptersForDownload = async () => {
    if (!chaptersData) return [];
    const results = [];
    const batchSize = 8;

    for (let i = 0; i < chaptersData.chapters.length; i += batchSize) {
      const batch = chaptersData.chapters.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (chapter) => {
          try {
            const content = await fetchChapterContent(chapter.url, chapter.filename, novelKey);
            const html = parseMarkdown(content, bookType);
            return {
              title: formatTitle(chapter, chapter.chapter),
              content: html,
              publishedDate: chapter.published_date || null,
            };
          } catch (err) {
            console.error(`Failed to load entry ${chapter.chapter}:`, err);
            return null;
          }
        })
      );
      results.push(...batchResults.filter(Boolean));
    }
    return results;
  };

  return (
    <div className={`reader-layout ${isFocusMode ? 'focus-mode' : ''}`}>
      <ChapterList
        chapters={chaptersData?.chapters || []}
        currentChapter={currentChapter}
        onChapterSelect={handleChapterSelect}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        bookType={bookType}
        bookTitle={chaptersData?.novel_title}
        allChaptersData={chaptersData ? getAllChaptersForDownload : null}
        visitedChapters={visitedChapters}
        onSelectRandom={handleRandomChapter}
      />

      <ChapterContent
        novelKey={novelKey}
        bookTitle={chaptersData?.novel_title || ''}
        bookType={bookType}
        chapterNum={currentChapter}
        totalChapters={chaptersData?.total_chapters || chaptersData?.chapters?.length || 1}
        currentPosition={currentIndex >= 0 ? currentIndex + 1 : 1}
        chapterMeta={currentMeta}
        title={formatTitle(currentMeta, currentChapter)}
        content={chapterContent}
        loading={loading}
        error={error}
        isLastChapter={Boolean(chaptersData && currentChapter === chaptersData.total_chapters)}
        isBookComplete={Boolean(chaptersData?.completed)}
        publishedDate={currentMeta?.published_date || null}
        hasPrev={Boolean(prevChapterObj)}
        hasNext={Boolean(nextChapterObj)}
        prevTitle={prevChapterObj ? formatTitle(prevChapterObj, prevChapterObj.chapter) : ''}
        nextTitle={nextChapterObj ? formatTitle(nextChapterObj, nextChapterObj.chapter) : ''}
        onPrev={() => prevChapterObj && handleChapterSelect(prevChapterObj.chapter)}
        onNext={() => nextChapterObj && handleChapterSelect(nextChapterObj.chapter)}
        onRandomChapter={chaptersData?.chapters?.length > 1 ? handleRandomChapter : null}
        onOpenContents={() => setIsMenuOpen(true)}
        allChaptersData={chaptersData ? getAllChaptersForDownload : null}
        isFocusMode={isFocusMode}
        onToggleFocus={() => setIsFocusMode((prev) => !prev)}
      />
    </div>
  );
}
