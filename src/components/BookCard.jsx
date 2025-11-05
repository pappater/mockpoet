import { useNavigate } from 'react-router-dom';
import './BookCard.css';

export default function BookCard({ novelKey, title, chapters, lastUpdated }) {
  const navigate = useNavigate();

  const handleClick = () => {
    sessionStorage.setItem('selectedNovel', novelKey);
    navigate('/reader');
  };

  return (
    <div className="book-card" onClick={handleClick}>
      <h1 className="book-card-title">{title}</h1>
      <div className="book-card-info">
        <div className="book-card-chapters">
          {chapters} Chapter{chapters !== 1 ? 's' : ''} Available
        </div>
        <div className="book-card-updated">
          Last updated: {new Date(lastUpdated).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
