import { useNavigate } from 'react-router-dom';
import './BookCard.css';

export default function BookCard({ novelKey, title, chapters, lastUpdated, isShortStories = false, isPoems = false }) {
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
  } else {
    contentLabel = `${chapters} Chapter${chapters !== 1 ? 's' : ''} Available`;
  }

  return (
    <div className="book-card" onClick={handleClick}>
      <h1 className="book-card-title">{title}</h1>
      <div className="book-card-info">
        <div className="book-card-chapters">
          {contentLabel}
        </div>
        <div className="book-card-updated">
          Last updated: {new Date(lastUpdated).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
