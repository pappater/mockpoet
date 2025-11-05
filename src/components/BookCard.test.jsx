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
    lastUpdated: '2025-01-01'
  };

  it('renders book title', () => {
    render(
      <BrowserRouter>
        <BookCard {...defaultProps} />
      </BrowserRouter>
    );
    expect(screen.getByText('Test Novel')).toBeInTheDocument();
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
});
