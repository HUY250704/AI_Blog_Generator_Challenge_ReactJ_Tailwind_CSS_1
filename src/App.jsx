import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import AppHeader from './components/AppHeader.jsx';
import EditorPage from './pages/EditorPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import PreviewPage from './pages/PreviewPage.jsx';

const canAccessWorkspace = () => localStorage.getItem('ai-blog-started') === 'true';

const ProtectedRoute = ({ children }) => {
  if (!canAccessWorkspace()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('ai-blog-theme');
    const shouldUseDark = savedTheme === 'dark';
    setIsDark(shouldUseDark);
    document.documentElement.classList.toggle('dark', shouldUseDark);
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('ai-blog-theme', next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-white text-black transition-colors dark:bg-black dark:text-white">
      <AppHeader isDark={isDark} onToggleTheme={toggleTheme} />
      <main className="w-full">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/editor"
            element={
              <ProtectedRoute>
                <EditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/preview"
            element={
              <ProtectedRoute>
                <PreviewPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
