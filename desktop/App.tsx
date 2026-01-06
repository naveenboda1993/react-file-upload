import React, { useState, useEffect } from 'react';
import { FileUp, Settings, LogOut } from 'lucide-react';
import { HomePage } from './pages/HomePage';
import { DesktopLoginPage } from './pages/DesktopLoginPage';
import { desktopAuthService } from './services/desktopAuthService';

export const App: React.FC = () => {
  const [appVersion, setAppVersion] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('apiUrl') || 'http://localhost:8080/api');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.electronAPI?.app.getAppVersion().then(version => {
      setAppVersion(version);
    });

    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleApiUrlChange = (url: string) => {
    localStorage.setItem('apiUrl', url);
    setApiUrl(url);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <DesktopLoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileUp size={32} className="text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Document Processor Desktop</h1>
              <p className="text-xs text-gray-500">v{appVersion}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            ) : null}
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <HomePage />
      </div>

      <footer className="bg-white border-t border-gray-200 px-6 py-3 text-center text-xs text-gray-500">
        <p>Connected to: {apiUrl}</p>
      </footer>
    </div>
  );
};

export default App;
