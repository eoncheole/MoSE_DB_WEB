import React from 'react';
import { ShieldCheck } from 'lucide-react';

const Header = ({ onLogout, onNavigate }) => {
  return (
    <header className="premium-glass sticky top-0 z-50 w-full transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate ? onNavigate('dashboard') : window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-gray-900 text-white p-2 rounded-xl shadow-lg shadow-gray-300 group-hover:scale-105 transition-transform duration-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-gray-900 leading-none">MoSE DB</span>
              <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">Mobility Cybersecurity Lab</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center bg-gray-100/50 p-1 rounded-full backdrop-blur-sm">
            <button 
              onClick={() => onNavigate ? onNavigate('dashboard') : window.scrollTo({ top: 0, behavior: 'smooth' })} 
              className="px-5 py-2 text-gray-900 font-medium text-sm bg-white rounded-full shadow-sm transition-all"
            >
              Overview
            </button>
            <a href="https://mose.kookmin.ac.kr/mose/index.do" target="_blank" rel="noopener noreferrer" className="px-5 py-2 text-gray-500 font-medium text-sm hover:text-gray-900 hover:bg-white/50 rounded-full transition-all">Risks</a>
            <a href="https://mose.kookmin.ac.kr/mose/index.do" target="_blank" rel="noopener noreferrer" className="px-5 py-2 text-gray-500 font-medium text-sm hover:text-gray-900 hover:bg-white/50 rounded-full transition-all">Network</a>
          </nav>

          {/* Right Actions & Profile Menu */}
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-50/80 border border-green-100 rounded-full backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs font-semibold text-green-700 tracking-wide">System Secure</span>
            </div>
            
            {/* User Profile with Logout Dropdown */}
            <div className="relative group">
              <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-gray-100 to-gray-300 shadow-sm cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-blue-500 transition-all">
                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix" className="w-full h-full rounded-full bg-white" alt="User" />
              </div>
              
              {/* Dropdown */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="text-sm font-bold text-gray-900">mose</p>
                  <p className="text-xs text-gray-500">mose@kookmin.ac.kr</p>
                </div>
                <div className="py-1">
                  <button 
                    onClick={() => onNavigate && onNavigate('settings')} 
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Settings
                  </button>
                  <button onClick={onLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium">Sign Out</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
