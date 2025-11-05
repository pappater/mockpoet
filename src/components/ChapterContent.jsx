import { useRef, useEffect } from 'react';
import './ChapterContent.css';

export default function ChapterContent({ title, content, loading, error, isLastChapter, isBookComplete }) {
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
