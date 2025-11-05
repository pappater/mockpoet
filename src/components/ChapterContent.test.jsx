import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChapterContent from './ChapterContent';

describe('ChapterContent', () => {
  it('renders chapter title', () => {
    render(
      <ChapterContent 
        title="Chapter 1"
        content="<p>Test content</p>"
        loading={false}
        error={null}
      />
    );
    expect(screen.getByText('Chapter 1')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <ChapterContent 
        title="Chapter 1"
        content=""
        loading={true}
        error={null}
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
      />
    );
    expect(screen.getByText('Test paragraph')).toBeInTheDocument();
  });
});
