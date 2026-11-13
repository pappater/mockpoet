import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TumblrIcon from './TumblrIcon';

describe('TumblrIcon', () => {
  it('renders tumblr link', () => {
    render(<TumblrIcon />);
    const link = screen.getByLabelText('Follow us on Tumblr');
    expect(link).toBeInTheDocument();
  });

  it('points to Tumblr in a new tab safely', () => {
    render(<TumblrIcon />);
    const link = screen.getByLabelText('Follow us on Tumblr');
    expect(link).toHaveAttribute('href', 'https://mockpoet.tumblr.com/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('has correct CSS class', () => {
    render(<TumblrIcon />);
    const link = screen.getByLabelText('Follow us on Tumblr');
    expect(link).toHaveClass('tumblr-icon-button');
  });

  it('contains SVG icon', () => {
    render(<TumblrIcon />);
    const svg = document.querySelector('.tumblr-icon');
    expect(svg).toBeInTheDocument();
    expect(svg.tagName).toBe('svg');
  });
});
