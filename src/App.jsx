import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import NotificationPrompt from './components/NotificationPrompt';
import SettingsModal from './components/SettingsModal';
import Home from './pages/Home';
import Reader from './pages/Reader';
import { useTheme } from './hooks/useTheme';
import { initAuth } from './services/authService';
import { initializeNotificationPolling } from './services/notificationService';

function getRouterBasename() {
  const base = import.meta.env.BASE_URL || '/';
  if (base === '/') return '/';
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isReaderPage = location.pathname.startsWith('/reader');
  const [user, setUser] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(({ user: authUser }) => {
      setUser(authUser || null);
    });
    initializeNotificationPolling();
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  return (
    <>
      <NotificationPrompt />
      <Header
        theme={theme}
        user={user}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onThemeToggle={toggleTheme}
        showBack={isReaderPage}
        showMenu={isReaderPage}
        onMenuToggle={() => {
          const event = new CustomEvent('toggleChapterList');
          window.dispatchEvent(event);
        }}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reader/:novelKey/:chapterSlug" element={<Reader />} />
        <Route path="/reader/:novelKey" element={<Reader />} />
        <Route path="/reader" element={<Reader />} />
      </Routes>
      <Footer isReaderPage={isReaderPage} />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
      />
    </>
  );
}

function App() {
  return (
    <Router basename={getRouterBasename()}>
      <AppContent />
    </Router>
  );
}

export default App;
