import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';

describe('Header', () => {
  it('renders title', () => {
    render(
      <BrowserRouter>
        <Header onThemeToggle={() => {}} />
      </BrowserRouter>
    );
    expect(screen.getByText('mockpoet')).toBeInTheDocument();
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
});
