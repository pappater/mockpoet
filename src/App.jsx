import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Reader from './pages/Reader';
import { useTheme } from './hooks/useTheme';

function AppContent() {
  const { toggleTheme } = useTheme();
  const location = useLocation();
  const isReaderPage = location.pathname.startsWith('/reader');

  return (
    <>
      <Header 
        onThemeToggle={toggleTheme}
        showBack={isReaderPage}
        showMenu={isReaderPage}
        onMenuToggle={() => {
          // This will be handled by the Reader component's state
          const event = new CustomEvent('toggleChapterList');
          window.dispatchEvent(event);
        }}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reader/:novelKey" element={<Reader />} />
        <Route path="/reader" element={<Reader />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router basename="/rabbit">
      <AppContent />
    </Router>
  );
}

export default App;
