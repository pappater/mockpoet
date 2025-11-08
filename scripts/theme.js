// Theme Management
const ThemeManager = (() => {
  const THEME_KEY = 'mockpoet-theme';
  const THEMES = {
    LIGHT: 'light',
    DARK: 'dark'
  };

  /**
   * Get the current theme from localStorage or default to light
   */
  function getCurrentTheme() {
    return localStorage.getItem(THEME_KEY) || THEMES.LIGHT;
  }

  /**
   * Set the theme and save to localStorage
   */
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }

  /**
   * Toggle between light and dark themes
   */
  function toggleTheme() {
    const currentTheme = getCurrentTheme();
    const newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
    setTheme(newTheme);
    return newTheme;
  }

  /**
   * Initialize theme on page load
   * Called immediately to prevent FOUC (Flash of Unstyled Content)
   * by setting the theme attribute before the page renders
   */
  function init() {
    const theme = getCurrentTheme();
    setTheme(theme);
  }

  // Initialize immediately (before DOMContentLoaded) to prevent flash of wrong theme
  init();

  // Public API
  return {
    toggleTheme,
    getCurrentTheme,
    setTheme,
    THEMES
  };
})();
