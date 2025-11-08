import { useState, useEffect } from 'react';

const THEME_KEY = 'mockpoet-theme';
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
};

/**
 * Custom hook for theme management
 */
export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem(THEME_KEY) || THEMES.LIGHT;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prevTheme => 
      prevTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT
    );
  };

  return { theme, toggleTheme };
}
