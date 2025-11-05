import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChapterList from './ChapterList';

describe('ChapterList', () => {
  const mockChapters = [
    { chapter: 1, url: 'url1', filename: 'file1.md' },
    { chapter: 2, url: 'url2', filename: 'file2.md' },
    { chapter: 3, url: 'url3', filename: 'file3.md' }
  ];

  it('renders chapter list title', () => {
    render(
      <ChapterList 
        chapters={mockChapters}
        currentChapter={1}
        onChapterSelect={() => {}}
        isOpen={false}
        onClose={() => {}}
      />
    );
    expect(screen.getByText('Chapters')).toBeInTheDocument();
  });

  it('renders all chapters', () => {
    render(
      <ChapterList 
        chapters={mockChapters}
        currentChapter={1}
        onChapterSelect={() => {}}
        isOpen={false}
        onClose={() => {}}
      />
    );
    expect(screen.getByText('Ch. 1')).toBeInTheDocument();
    expect(screen.getByText('Ch. 2')).toBeInTheDocument();
    expect(screen.getByText('Ch. 3')).toBeInTheDocument();
  });

  it('highlights current chapter', () => {
    render(
      <ChapterList 
        chapters={mockChapters}
        currentChapter={2}
        onChapterSelect={() => {}}
        isOpen={false}
        onClose={() => {}}
      />
    );
    const activeChapter = screen.getByText('Ch. 2').closest('.chapter-item');
    expect(activeChapter).toHaveClass('active');
  });

  it('calls onChapterSelect when chapter is clicked', () => {
    const mockSelect = vi.fn();
    render(
      <ChapterList 
        chapters={mockChapters}
        currentChapter={1}
        onChapterSelect={mockSelect}
        isOpen={false}
        onClose={() => {}}
      />
    );
    
    const chapter2 = screen.getByText('Ch. 2').closest('.chapter-item');
    fireEvent.click(chapter2);
    expect(mockSelect).toHaveBeenCalledWith(2);
  });
});
