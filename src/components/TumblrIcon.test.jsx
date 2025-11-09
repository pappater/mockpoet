import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TumblrIcon from './TumblrIcon';

describe('TumblrIcon', () => {
  let windowOpenSpy;

  beforeEach(() => {
    // Mock window.open
    windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    windowOpenSpy.mockRestore();
  });

  it('renders tumblr icon button', () => {
    render(<TumblrIcon />);
    const button = screen.getByLabelText('Follow us on Tumblr');
    expect(button).toBeInTheDocument();
  });

  it('opens Tumblr link in new tab when clicked', () => {
    render(<TumblrIcon />);
    const button = screen.getByLabelText('Follow us on Tumblr');
    
    fireEvent.click(button);
    
    expect(windowOpenSpy).toHaveBeenCalledTimes(1);
    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://mockpoet.tumblr.com/',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('has correct CSS class', () => {
    render(<TumblrIcon />);
    const button = screen.getByLabelText('Follow us on Tumblr');
    expect(button).toHaveClass('tumblr-icon-button');
  });

  it('contains SVG icon', () => {
    render(<TumblrIcon />);
    const svg = document.querySelector('.tumblr-icon');
    expect(svg).toBeInTheDocument();
    expect(svg.tagName).toBe('svg');
  });
});
