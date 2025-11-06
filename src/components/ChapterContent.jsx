import { useRef, useEffect } from 'react';
import TextToSpeech from './TextToSpeech';
import './ChapterContent.css';

export default function ChapterContent({ title, content, loading, error, isLastChapter, isBookComplete, publishedDate }) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [content]);

  return (
    <main className="chapter-content" ref={contentRef}>
      <div className="chapter-content-header">
        <h1 className="chapter-content-title">{title}</h1>
        {publishedDate && (
          <div className="chapter-published-date">
            Published: {new Date(publishedDate).toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short'
            })}
          </div>
        )}
      </div>
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
            <TextToSpeech text={content} />
            <div dangerouslySetInnerHTML={{ __html: content }} />
            {isLastChapter && isBookComplete && (
              <div className="chapter-end-indicator">
                <p>— The End —</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
