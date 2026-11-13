import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BookCard from './BookCard';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('BookCard', () => {
  const defaultProps = {
    novelKey: 'test-novel',
    title: 'Test Novel',
    chapters: 5,
    lastUpdated: '2025-01-01',
  };

  it('renders book title and ongoing status', () => {
    render(
      <BrowserRouter>
        <BookCard {...defaultProps} />
      </BrowserRouter>
    );
    expect(screen.getByText('Test Novel')).toBeInTheDocument();
    expect(screen.getByText('Ongoing')).toBeInTheDocument();
  });

  it('displays Completed status when completed is true', () => {
    render(
      <BrowserRouter>
        <BookCard {...defaultProps} completed={true} />
      </BrowserRouter>
    );
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('displays chapter count', () => {
    render(
      <BrowserRouter>
        <BookCard {...defaultProps} />
      </BrowserRouter>
    );
    expect(screen.getByText('5 Chapters Available')).toBeInTheDocument();
  });

  it('displays single chapter text correctly', () => {
    render(
      <BrowserRouter>
        <BookCard {...defaultProps} chapters={1} />
      </BrowserRouter>
    );
    expect(screen.getByText('1 Chapter Available')).toBeInTheDocument();
  });

  it('displays last updated date', () => {
    render(
      <BrowserRouter>
        <BookCard {...defaultProps} />
      </BrowserRouter>
    );
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it('displays short stories count', () => {
    render(
      <BrowserRouter>
        <BookCard {...defaultProps} chapters={3} isShortStories={true} />
      </BrowserRouter>
    );
    expect(screen.getByText('3 Short Stories Available')).toBeInTheDocument();
  });

  it('displays poems count and language indicator', () => {
    render(
      <BrowserRouter>
        <BookCard {...defaultProps} chapters={3} isPoems={true} language="Tamil" />
      </BrowserRouter>
    );
    expect(screen.getByText('3 Poems Available')).toBeInTheDocument();
    expect(screen.getByText('Tamil')).toBeInTheDocument();
  });

  it('displays essays count, drama scenes count, and quotes reflections count', () => {
    const { rerender } = render(
      <BrowserRouter>
        <BookCard {...defaultProps} chapters={6} isEssays={true} />
      </BrowserRouter>
    );
    expect(screen.getByText('6 Essays Available')).toBeInTheDocument();

    rerender(
      <BrowserRouter>
        <BookCard {...defaultProps} chapters={2} isDrama={true} plannedChapters={12} />
      </BrowserRouter>
    );
    expect(screen.getByText('2 Scenes Available')).toBeInTheDocument();
    expect(screen.getByText('2 / 12 planned')).toBeInTheDocument();

    rerender(
      <BrowserRouter>
        <BookCard {...defaultProps} chapters={6} isQuotes={true} />
      </BrowserRouter>
    );
    expect(screen.getByText('6 Reflections Available')).toBeInTheDocument();
  });
});
