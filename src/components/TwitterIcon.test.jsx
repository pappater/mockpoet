import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TwitterIcon from './TwitterIcon';

describe('TwitterIcon', () => {
  let windowOpenSpy;

  beforeEach(() => {
    // Mock window.open
    windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    windowOpenSpy.mockRestore();
  });

  it('renders twitter icon button', () => {
    render(<TwitterIcon />);
    const button = screen.getByLabelText('Follow us on Twitter');
    expect(button).toBeInTheDocument();
  });

  it('opens Twitter link in new tab when clicked', () => {
    render(<TwitterIcon />);
    const button = screen.getByLabelText('Follow us on Twitter');
    
    fireEvent.click(button);
    
    expect(windowOpenSpy).toHaveBeenCalledTimes(1);
    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://x.com/mockpoet',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('has correct CSS class', () => {
    render(<TwitterIcon />);
    const button = screen.getByLabelText('Follow us on Twitter');
    expect(button).toHaveClass('twitter-icon-button');
  });

  it('contains SVG icon', () => {
    render(<TwitterIcon />);
    const svg = document.querySelector('.twitter-icon');
    expect(svg).toBeInTheDocument();
    expect(svg.tagName).toBe('svg');
  });
});
