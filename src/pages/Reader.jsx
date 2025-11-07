import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChapterList from '../components/ChapterList';
import ChapterContent from '../components/ChapterContent';
import { fetchChaptersData, fetchChapterContent, parseMarkdown, getBookType } from '../services/api';
import { slugify, findChapterBySlug } from '../utils/slugify';
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
  
  // Determine novelKey from URL parameter, sessionStorage, or default
  const novelKey = urlNovelKey || sessionStorage.getItem('selectedNovel') || 'weight_of_promises';
  const bookType = getBookType(novelKey);
  
  // If novelKey is not in URL, redirect to include it
  useEffect(() => {
    if (!urlNovelKey && novelKey) {
      navigate(`/reader/${novelKey}`, { replace: true });
    }
  }, [urlNovelKey, novelKey, navigate]);

  // Handle chapter slug from URL
  useEffect(() => {
    if (chapterSlug && chaptersData) {
      const chapter = findChapterBySlug(chaptersData.chapters, chapterSlug);
      if (chapter) {
        setCurrentChapter(chapter.chapter);
      } else {
        // If slug is invalid, redirect to first chapter
        const firstChapter = chaptersData.chapters[0];
        if (firstChapter?.chapter_name) {
          navigate(`/reader/${novelKey}/${slugify(firstChapter.chapter_name)}`, { replace: true });
        } else {
          navigate(`/reader/${novelKey}`, { replace: true });
        }
      }
    }
  }, [chapterSlug, chaptersData, novelKey, navigate]);

  useEffect(() => {
    async function loadChaptersData() {
      try {
        setLoading(true);
        const data = await fetchChaptersData(novelKey);
        setChaptersData(data);
        document.title = `${data.novel_title} - rabbit`;
        setLoading(false);
        
        // If no chapter slug in URL, redirect to first or random chapter with slug
        if (!chapterSlug && data.chapters.length > 0) {
          let selectedChapter;
          
          // For poems and short_stories, select random chapter
          if (bookType === 'poems' || bookType === 'short_stories') {
            const randomIndex = Math.floor(Math.random() * data.chapters.length);
            selectedChapter = data.chapters[randomIndex];
          } else {
            // For novels, use the first chapter
            selectedChapter = data.chapters[0];
          }
          
          if (selectedChapter.chapter_name) {
            const slug = slugify(selectedChapter.chapter_name);
            navigate(`/reader/${novelKey}/${slug}`, { replace: true });
          }
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    loadChaptersData();
  }, [novelKey, chapterSlug, navigate, bookType]);

  useEffect(() => {
    const handleToggle = () => {
      setIsMenuOpen(prev => !prev);
    };

    window.addEventListener('toggleChapterList', handleToggle);
    return () => window.removeEventListener('toggleChapterList', handleToggle);
  }, []);

  useEffect(() => {
    async function loadChapter() {
      if (!chaptersData) return;

      try {
        setLoading(true);
        setError(null);
        
        const chapterData = chaptersData.chapters.find(
          ch => ch.chapter === currentChapter
        );
        
        if (!chapterData) {
          throw new Error('Chapter not found');
        }

        const content = await fetchChapterContent(
          chapterData.url,
          chapterData.filename,
          novelKey
        );
        const html = parseMarkdown(content);
        setChapterContent(html);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    loadChapter();
  }, [currentChapter, chaptersData, novelKey]);

  const handleChapterSelect = (chapterNum) => {
    setCurrentChapter(chapterNum);
    
    // Update URL with chapter slug if chapter has a name
    if (chaptersData) {
      const chapter = chaptersData.chapters.find(ch => ch.chapter === chapterNum);
      if (chapter?.chapter_name) {
        const slug = slugify(chapter.chapter_name);
        navigate(`/reader/${novelKey}/${slug}`, { replace: true });
      } else {
        navigate(`/reader/${novelKey}`, { replace: true });
      }
    }
  };

  const handleMenuClose = () => {
    setIsMenuOpen(false);
  };

  if (!chaptersData && loading) {
    return (
      <div className="reader-layout">
        <ChapterContent 
          title="Loading..."
          loading={true}
        />
      </div>
    );
  }

  if (error && !chaptersData) {
    return (
      <div className="reader-layout">
        <ChapterContent 
          title="Error"
          error={error}
        />
      </div>
    );
  }

  const getChapterTitle = () => {
    if (!chaptersData) return bookType === 'novel' ? `Chapter ${currentChapter}` : 'Loading...';
    
    const chapterData = chaptersData.chapters.find(
      ch => ch.chapter === currentChapter
    );
    
    if (chapterData?.chapter_name) {
      // For novels, show "Chapter X: Title", for others just the title
      if (bookType === 'novel') {
        return `Chapter ${currentChapter}: ${chapterData.chapter_name}`;
      }
      return chapterData.chapter_name;
    }
    
    // Fallback for novels
    return bookType === 'novel' ? `Chapter ${currentChapter}` : `Entry ${currentChapter}`;
  };

  const isLastChapter = () => {
    if (!chaptersData) return false;
    return currentChapter === chaptersData.total_chapters;
  };

  const isBookComplete = () => {
    return chaptersData?.completed || false;
  };

  const getPublishedDate = () => {
    if (!chaptersData) return null;
    const chapterData = chaptersData.chapters.find(
      ch => ch.chapter === currentChapter
    );
    return chapterData?.published_date || null;
  };

  // Prepare chapters data for download (with placeholders for unloaded content)
  const getAllChaptersForDownload = async () => {
    if (!chaptersData) return [];
    
    const downloadChapters = await Promise.all(
      chaptersData.chapters.map(async (chapter) => {
        try {
          const content = await fetchChapterContent(
            chapter.url,
            chapter.filename,
            novelKey
          );
          const html = parseMarkdown(content);
          
          let title;
          if (chapter.chapter_name) {
            title = bookType === 'novel' 
              ? `Chapter ${chapter.chapter}: ${chapter.chapter_name}`
              : chapter.chapter_name;
          } else {
            title = bookType === 'novel' 
              ? `Chapter ${chapter.chapter}` 
              : `Entry ${chapter.chapter}`;
          }
          
          return {
            title,
            content: html,
            publishedDate: chapter.published_date || null
          };
        } catch (err) {
          console.error(`Failed to load chapter ${chapter.chapter}:`, err);
          return null;
        }
      })
    );
    
    return downloadChapters.filter(ch => ch !== null);
  };

  return (
    <div className="reader-layout">
      <ChapterList
        chapters={chaptersData?.chapters || []}
        currentChapter={currentChapter}
        onChapterSelect={handleChapterSelect}
        isOpen={isMenuOpen}
        onClose={handleMenuClose}
        bookType={bookType}
        bookTitle={chaptersData?.novel_title}
        allChaptersData={chaptersData ? getAllChaptersForDownload : null}
      />
      <ChapterContent
        title={getChapterTitle()}
        content={chapterContent}
        loading={loading}
        error={error}
        isLastChapter={isLastChapter()}
        isBookComplete={isBookComplete()}
        publishedDate={getPublishedDate()}
      />
    </div>
  );
}
