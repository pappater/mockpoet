import { useState, useEffect } from 'react';
import ChapterList from '../components/ChapterList';
import ChapterContent from '../components/ChapterContent';
import { fetchChaptersData, fetchChapterContent, parseMarkdown } from '../services/api';
import './Reader.css';

export default function Reader() {
  const [chaptersData, setChaptersData] = useState(null);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [chapterContent, setChapterContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [novelKey] = useState(
    sessionStorage.getItem('selectedNovel') || 'weight_of_promises'
  );

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
        title={`Chapter ${currentChapter}`}
        content={chapterContent}
        loading={loading}
        error={error}
      />
    </div>
  );
}
