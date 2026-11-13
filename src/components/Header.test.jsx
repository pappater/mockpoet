import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';

describe('Header', () => {
  it('renders title and section nav links on home', () => {
    render(
      <BrowserRouter>
        <Header onThemeToggle={() => {}} />
      </BrowserRouter>
    );
    expect(screen.getByText('mockpoet')).toBeInTheDocument();
    expect(screen.getByText('Novels')).toBeInTheDocument();
    expect(screen.getByText('Essays')).toBeInTheDocument();
    expect(screen.getByText('Drama')).toBeInTheDocument();
  });

  it('calls onThemeToggle when theme button is clicked', () => {
    const mockToggle = vi.fn();
    render(
      <BrowserRouter>
        <Header onThemeToggle={mockToggle} />
      </BrowserRouter>
    );

    const themeButton = screen.getByLabelText('Toggle theme');
    fireEvent.click(themeButton);
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it('shows back button when showBack is true', () => {
    render(
      <BrowserRouter>
        <Header onThemeToggle={() => {}} showBack={true} />
      </BrowserRouter>
    );
    expect(screen.getByLabelText('Back to Home')).toBeInTheDocument();
  });

  it('shows menu button when showMenu is true', () => {
    render(
      <BrowserRouter>
        <Header onThemeToggle={() => {}} showMenu={true} />
      </BrowserRouter>
    );
    expect(screen.getByLabelText('Toggle chapter list')).toBeInTheDocument();
  });

  it('shows Tumblr icon on home page and omits Twitter', () => {
    render(
      <BrowserRouter>
        <Header onThemeToggle={() => {}} showBack={false} />
      </BrowserRouter>
    );
    expect(screen.getByLabelText('Follow us on Tumblr')).toBeInTheDocument();
    expect(screen.queryByLabelText('Follow us on Twitter')).not.toBeInTheDocument();
  });

  it('hides Tumblr icon on reader page (showBack is true)', () => {
    render(
      <BrowserRouter>
        <Header onThemeToggle={() => {}} showBack={true} />
      </BrowserRouter>
    );
    expect(screen.queryByLabelText('Follow us on Tumblr')).not.toBeInTheDocument();
  });
});
