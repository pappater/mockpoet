import { useState, useEffect } from 'react';
import BookCard from '../components/BookCard';
import { getAvailableNovels, fetchChaptersData } from '../services/api';
import './Home.css';

export default function Home() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get update frequency based on novel key
  const getUpdateFrequency = (novelKey) => {
    const frequencies = {
      'of_old_man': 'Updated twice daily',
      'hydrogen_jukebox': 'Updated daily',
      'flying_banana': 'Updated daily',
      'weight_of_promises': 'Updated daily',
      'indifferent_shore': 'Updated daily',
      'moonbound_devotion': 'Updated daily',
      'sun_also_rises_again': 'Updated daily'
    };
    return frequencies[novelKey] || 'Updated periodically';
  };

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
              type: novel.type || 'novel',
              isShortStories: novel.type === 'short_stories',
              isPoems: novel.type === 'poems',
              completed: data.completed || false,
              updateFrequency: getUpdateFrequency(novel.key)
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

  // Group books by type
  const groupedBooks = books.reduce((acc, book) => {
    const type = book.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(book);
    return acc;
  }, {});

  // Get display title for each type
  const getTypeTitle = (type) => {
    switch(type) {
      case 'novel': return 'Novels';
      case 'poems': return 'Poetry Collections';
      case 'short_stories': return 'Short Stories';
      default: return 'Other';
    }
  };

  return (
    <main className="home-container">
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
      {!loading && !error && (
        <>
          {/* Desktop view - grouped by type */}
          <div className="desktop-book-groups">
            {Object.entries(groupedBooks).map(([type, booksInType]) => (
              <div key={type} className="book-group">
                <h2 className="book-group-title">{getTypeTitle(type)}</h2>
                <div className="book-group-scroll">
                  {booksInType.map((book) => (
                    <BookCard
                      key={book.key}
                      novelKey={book.key}
                      title={book.title}
                      chapters={book.chapters}
                      lastUpdated={book.lastUpdated}
                      isShortStories={book.isShortStories}
                      isPoems={book.isPoems}
                      completed={book.completed}
                      updateFrequency={book.updateFrequency}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Mobile view - simple list */}
          <div id="book-card-container">
            {books.map((book) => (
              <BookCard
                key={book.key}
                novelKey={book.key}
                title={book.title}
                chapters={book.chapters}
                lastUpdated={book.lastUpdated}
                isShortStories={book.isShortStories}
                isPoems={book.isPoems}
                completed={book.completed}
                updateFrequency={book.updateFrequency}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
