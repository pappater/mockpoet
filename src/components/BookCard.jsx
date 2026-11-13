import { useNavigate } from 'react-router-dom';
import './BookCard.css';

export default function BookCard({
  novelKey,
  title,
  description = '',
  chapters = 0,
  plannedChapters = null,
  lastUpdated,
  isShortStories = false,
  isPoems = false,
  isEssays = false,
  isDrama = false,
  isQuotes = false,
  subgenre = null,
  language = 'English',
  completed = false,
  updateFrequency = 'Updated periodically',
  progressCount = 0,
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
  } else if (isEssays) {
    contentLabel = `${chapters} Essay${chapters !== 1 ? 's' : ''} Available`;
  } else if (isQuotes) {
    contentLabel = `${chapters} Reflection${chapters !== 1 ? 's' : ''} Available`;
  } else if (isDrama) {
    contentLabel = `${chapters} Scene${chapters !== 1 ? 's' : ''} Available`;
  } else {
    contentLabel = `${chapters} Chapter${chapters !== 1 ? 's' : ''} Available`;
  }

  const formattedDate = lastUpdated
    ? new Date(lastUpdated.replace(' UTC', 'Z').replace(' ', 'T')).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent';

  const progressPct = chapters > 0 && progressCount > 0
    ? Math.min(100, Math.round((progressCount / chapters) * 100))
    : 0;

  return (
    <article
      className="book-card"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Open ${title}`}
    >
      <div className="book-card-top">
        <div className="book-card-kicker">
          {subgenre && <span className="book-kicker-text">{subgenre}</span>}
          {language && language !== 'English' && (
            <>
              <span className="kicker-dot" aria-hidden="true">·</span>
              <span className="book-kicker-lang">{language}</span>
            </>
          )}
        </div>

        <span className={`book-status-label ${completed ? 'status-complete' : 'status-ongoing'}`}>
          {completed ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 14" />
            </svg>
          )}
          {completed ? 'Completed' : 'Ongoing'}
        </span>
      </div>

      <h3 className="book-card-title">{title}</h3>

      {description && <p className="book-card-description">{description}</p>}

      <div className="book-card-footer">
        <div className="book-card-meta-row">
          <span className="book-card-chapters">{contentLabel}</span>
          {plannedChapters && !completed && (
            <>
              <span className="kicker-dot" aria-hidden="true">·</span>
              <span className="book-card-planned">{chapters} / {plannedChapters} planned</span>
            </>
          )}
        </div>

        <div className="book-card-submeta">
          <span>{updateFrequency}</span>
          <span className="kicker-dot" aria-hidden="true">·</span>
          <span>Last updated: {formattedDate}</span>
        </div>

        {progressCount > 0 && (
          <div className="book-card-progress" aria-label={`Read ${progressCount} of ${chapters}`}>
            <div className="book-progress-track">
              <div className="book-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="book-progress-label">
              {progressCount} of {chapters} read
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
