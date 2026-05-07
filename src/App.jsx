import React, { useEffect, useState } from 'react';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Graph from './pages/Graph';
import Settings from './pages/Settings';
import { clearToken, fetchMe, getToken } from './lib/api';

function App() {
  // Optimistically logged-in if a token is present, then verify against
  // /users/me. If the token is stale/invalid, clear it and bounce to landing.
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getToken());
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    fetchMe()
      .then(() => { if (!cancelled) setIsLoggedIn(true); })
      .catch(() => {
        if (cancelled) return;
        clearToken();
        setIsLoggedIn(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    clearToken();
    setIsLoggedIn(false);
    setCurrentView('dashboard');
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  return (
    <>
      <div className="ambient-bg fixed inset-0 pointer-events-none z-0"></div>
      <div className="relative z-10">
        {!isLoggedIn ? (
          <Landing onLogin={handleLogin} />
        ) : (
          <>
            {currentView === 'dashboard' && (
              <Dashboard
                onLogout={handleLogout}
                onNavigate={handleNavigate}
              />
            )}
            {currentView === 'graph' && (
              <Graph
                onLogout={handleLogout}
                onNavigate={handleNavigate}
              />
            )}
            {currentView === 'settings' && (
              <Settings
                onLogout={handleLogout}
                onBack={() => handleNavigate('dashboard')}
                onNavigate={handleNavigate}
              />
            )}
          </>
        )}
      </div>
      <style>{`
        .ambient-bg {
            background: 
                radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 40%),
                radial-gradient(circle at 90% 80%, rgba(99, 102, 241, 0.08) 0%, transparent 40%);
        }
      `}</style>
    </>
  );
}

export default App;