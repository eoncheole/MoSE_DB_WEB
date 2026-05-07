import React, { useEffect, useRef, useState } from 'react';
import { X, Lock, User, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const firstFieldRef = useRef(null);

  // Esc to close + lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Defer focus so the input is mounted before we focus it
    const t = setTimeout(() => firstFieldRef.current?.focus(), 0);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate network delay for realism
    setTimeout(() => {
      // Accept 'mose' or 'mose@kookmin.ac.kr'
      if ((formData.email === 'mose' || formData.email === 'mose@kookmin.ac.kr') && formData.password === 'password') {
        setIsLoading(false);
        onLoginSuccess();
      } else {
        setIsLoading(false);
        setError('Invalid credentials. Try mose / password');
      }
    }, 1500);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] animate-fade-in"
        onClick={onClose}
      />

      {/* Modal wrapper — flex centers the card so the fadeIn animation's
          transform doesn't conflict with translate-based centering */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-title"
          className="premium-card bg-white/90 p-8 rounded-[2rem] shadow-2xl border border-white/50 relative overflow-hidden w-full max-w-md animate-fade-in pointer-events-auto"
        >
          
          {/* Decorative Background Elements */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-100 rounded-full blur-3xl opacity-50"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 id="login-title" className="text-2xl font-bold text-gray-900 tracking-tight">Welcome Back</h2>
                <p className="text-sm text-gray-500 mt-1">Enter your credentials to access the MoSE DB.</p>
              </div>
              <button onClick={onClose} aria-label="Close login dialog" className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="login-user" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">User Access</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    id="login-user"
                    ref={firstFieldRef}
                    type="text"
                    autoComplete="username"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none"
                    placeholder="mose"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="login-password" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Security Key</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl py-3 pl-12 pr-12 text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-700 rounded-md transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gray-900 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-gray-200 hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Authenticate Session'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <a href="https://mose.kookmin.ac.kr/mose/index.do" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-blue-600 transition-colors">Forgot your security key?</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginModal;