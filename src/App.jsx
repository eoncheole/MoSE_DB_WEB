import React, { useState, useEffect } from 'react';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';

function App() {
  // Initialize login state
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('mose_auth') === 'true';
  });

  // View state: 'dashboard' or 'settings'
  const [currentView, setCurrentView] = useState('dashboard');

  const handleLogin = () => {
    localStorage.setItem('mose_auth', 'true');
    setIsLoggedIn(true);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('mose_auth');
    setIsLoggedIn(false);
    setCurrentView('dashboard'); // Reset view on logout
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
            {currentView === 'settings' && (
              <Settings 
                onLogout={handleLogout} 
                onBack={() => handleNavigate('dashboard')} 
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