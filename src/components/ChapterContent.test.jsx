import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChapterContent from './ChapterContent';

describe('ChapterContent', () => {
  it('renders chapter title', () => {
    render(
      <ChapterContent 
        title="Chapter 1"
        content="<p>Test content</p>"
        loading={false}
        error={null}
        isLastChapter={false}
        isBookComplete={false}
      />
    );
    // Since there are now two titles (desktop and mobile), use getAllByText
    const titles = screen.getAllByText('Chapter 1');
    expect(titles.length).toBeGreaterThan(0);
    expect(titles[0]).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <ChapterContent 
        title="Chapter 1"
        content=""
        loading={true}
        error={null}
        isLastChapter={false}
        isBookComplete={false}
      />
    );
    expect(screen.getByText('Loading chapter...')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(
      <ChapterContent 
        title="Chapter 1"
        content=""
        loading={false}
        error="Failed to load"
        isLastChapter={false}
        isBookComplete={false}
      />
    );
    expect(screen.getByText(/Failed to load/)).toBeInTheDocument();
  });

  it('renders HTML content', () => {
    render(
      <ChapterContent 
        title="Chapter 1"
        content="<p>Test paragraph</p>"
        loading={false}
        error={null}
        isLastChapter={false}
        isBookComplete={false}
      />
    );
    expect(screen.getByText('Test paragraph')).toBeInTheDocument();
  });

  it('shows "The End" indicator on last chapter when book is complete', () => {
    render(
      <ChapterContent 
        title="Chapter 10"
        content="<p>Final chapter content</p>"
        loading={false}
        error={null}
        isLastChapter={true}
        isBookComplete={true}
      />
    );
    expect(screen.getByText('— The End —')).toBeInTheDocument();
  });

  it('does not show "The End" indicator when not last chapter', () => {
    render(
      <ChapterContent 
        title="Chapter 5"
        content="<p>Middle chapter content</p>"
        loading={false}
        error={null}
        isLastChapter={false}
        isBookComplete={true}
      />
    );
    expect(screen.queryByText('— The End —')).not.toBeInTheDocument();
  });

  it('does not show "The End" indicator when book is not complete', () => {
    render(
      <ChapterContent 
        title="Chapter 10"
        content="<p>Last chapter so far</p>"
        loading={false}
        error={null}
        isLastChapter={true}
        isBookComplete={false}
      />
    );
    expect(screen.queryByText('— The End —')).not.toBeInTheDocument();
  });

  it('renders interactive Paper & Type popover controls and switches paper tone', () => {
    const { container } = render(
      <ChapterContent
        novelKey="weight_of_promises"
        title="Chapter 1"
        content="<p>Sample prose paragraph for testing paper tone.</p>"
        loading={false}
        error={null}
      />
    );
    const aaBtn = screen.getByText(/Aa Paper & Type/i);
    fireEvent.click(aaBtn);
    const sepiaBtn = screen.getByText('Sepia');
    fireEvent.click(sepiaBtn);
    expect(container.querySelector('.chapter-content')).toHaveClass('paper-tone-sepia');
  });

  it('extracts drama cast members into interactive cast spotlight bar', () => {
    render(
      <ChapterContent
        novelKey="clockmakers_alibi"
        bookType="drama"
        title="Scene 1"
        content='<p class="drama-speaker">ALICE:</p><p>The clock stopped at midnight.</p><p class="drama-speaker">INSPECTOR:</p><p>Did anyone hear the chime?</p>'
        loading={false}
        error={null}
      />
    );
    expect(screen.getByText('Cast Spotlight:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ALICE' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'INSPECTOR' })).toBeInTheDocument();
  });
});
