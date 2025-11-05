import { useState, useEffect } from 'react';
import BookCard from '../components/BookCard';
import { getAvailableNovels, fetchChaptersData } from '../services/api';
import './Home.css';

export default function Home() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadBooks() {
      try {
        setLoading(true);
        const novels = getAvailableNovels();
        const bookData = [];

        for (const novel of novels) {
          try {
            const data = await fetchChaptersData(novel.key);
            bookData.push({
              key: novel.key,
              title: data.novel_title,
              chapters: data.total_chapters,
              lastUpdated: data.last_updated,
              isShortStories: novel.type === 'short_stories',
              isPoems: novel.type === 'poems'
            });
          } catch (err) {
            console.error(`Failed to load data for ${novel.title}:`, err);
          }
        }

        if (bookData.length === 0) {
          throw new Error('No novels could be loaded');
        }

        setBooks(bookData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, []);

  return (
    <main className="home-container">
      <div id="book-card-container">
        {loading && (
          <div className="loading-message">
            <p>Loading book information...</p>
          </div>
        )}
        {error && (
          <div className="error-message">
            <p>Error loading book data: {error}</p>
            <p>Please try again later.</p>
          </div>
        )}
        {!loading && !error && books.map((book) => (
          <BookCard
            key={book.key}
            novelKey={book.key}
            title={book.title}
            chapters={book.chapters}
            lastUpdated={book.lastUpdated}
            isShortStories={book.isShortStories}
            isPoems={book.isPoems}
          />
        ))}
      </div>
    </main>
  );
}
