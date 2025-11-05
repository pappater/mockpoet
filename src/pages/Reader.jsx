import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChapterList from '../components/ChapterList';
import ChapterContent from '../components/ChapterContent';
import { fetchChaptersData, fetchChapterContent, parseMarkdown } from '../services/api';
import './Reader.css';

export default function Reader() {
  const { novelKey: urlNovelKey } = useParams();
  const navigate = useNavigate();
  const [chaptersData, setChaptersData] = useState(null);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [chapterContent, setChapterContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Determine novelKey from URL parameter, sessionStorage, or default
  const novelKey = urlNovelKey || sessionStorage.getItem('selectedNovel') || 'weight_of_promises';
  
  // If novelKey is not in URL, redirect to include it
  useEffect(() => {
    if (!urlNovelKey && novelKey) {
      navigate(`/reader/${novelKey}`, { replace: true });
    }
  }, [urlNovelKey, novelKey, navigate]);

  useEffect(() => {
    async function loadChaptersData() {
      try {
        setLoading(true);
        const data = await fetchChaptersData(novelKey);
        setChaptersData(data);
        document.title = `${data.novel_title} - rabbit`;
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    loadChaptersData();
  }, [novelKey]);

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
    if (!chaptersData) return `Chapter ${currentChapter}`;
    
    const chapterData = chaptersData.chapters.find(
      ch => ch.chapter === currentChapter
    );
    
    if (chapterData?.chapter_name) {
      return `Chapter ${currentChapter}: ${chapterData.chapter_name}`;
    }
    
    return `Chapter ${currentChapter}`;
  };

  const isLastChapter = () => {
    if (!chaptersData) return false;
    return currentChapter === chaptersData.total_chapters;
  };

  const isBookComplete = () => {
    return chaptersData?.completed || false;
  };

  return (
    <div className="reader-layout">
      <ChapterList
        chapters={chaptersData?.chapters || []}
        currentChapter={currentChapter}
        onChapterSelect={handleChapterSelect}
        isOpen={isMenuOpen}
        onClose={handleMenuClose}
      />
      <ChapterContent
        title={getChapterTitle()}
        content={chapterContent}
        loading={loading}
        error={error}
        isLastChapter={isLastChapter()}
        isBookComplete={isBookComplete()}
      />
    </div>
  );
}
