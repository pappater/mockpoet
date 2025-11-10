import { useNavigate } from 'react-router-dom';
import './BookCard.css';

export default function BookCard({ 
  novelKey, 
  title, 
  chapters, 
  lastUpdated, 
  isShortStories = false, 
  isPoems = false,
  isDrama = false,
  genre = null,
  subgenre = null,
  completed = false,
  updateFrequency = 'Updated periodically',
  wordCount = null,
  difficulty = 'medium'
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    sessionStorage.setItem('selectedNovel', novelKey);
    navigate(`/reader/${novelKey}`);
  };

  let contentLabel;
  if (isPoems) {
    contentLabel = `${chapters} Poem${chapters !== 1 ? 's' : ''} Available`;
  } else if (isShortStories) {
    contentLabel = `${chapters} Short Stor${chapters !== 1 ? 'ies' : 'y'} Available`;
  } else if (isDrama) {
    contentLabel = `${chapters} Scene${chapters !== 1 ? 's' : ''} Available`;
  } else {
    contentLabel = `${chapters} Chapter${chapters !== 1 ? 's' : ''} Available`;
  }

  const getDifficultyLabel = () => {
    const labels = {
      'easy': 'Easy Read',
      'medium': 'Medium Read',
      'difficult': 'Advanced Read'
    };
    return labels[difficulty] || labels['medium'];
  };

  return (
    <div className="book-card" onClick={handleClick}>
      <h1 className="book-card-title">{title}</h1>
      <div className="book-card-info">
        <div className="book-card-chapters">
          {contentLabel}
        </div>
        {subgenre && (
          <div className="book-card-genre">
            <span className="genre-badge">{subgenre}</span>
          </div>
        )}
        <div className="book-card-metadata">
          <div className="book-card-meta-item">
            <span className="meta-label">Status:</span>
            <span className={`meta-value ${completed ? 'completed' : 'ongoing'}`}>
              {completed ? 'Completed' : 'Ongoing'}
            </span>
          </div>
          <div className="book-card-meta-item">
            <span className="meta-label">Difficulty:</span>
            <span className="meta-value">{getDifficultyLabel()}</span>
          </div>
          {wordCount && (
            <div className="book-card-meta-item">
              <span className="meta-label">Word Count:</span>
              <span className="meta-value">{wordCount.toLocaleString()} words</span>
            </div>
          )}
          <div className="book-card-meta-item">
            <span className="meta-label">Frequency:</span>
            <span className="meta-value">{updateFrequency}</span>
          </div>
        </div>
        <div className="book-card-updated">
          Last updated: {new Date(lastUpdated).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
