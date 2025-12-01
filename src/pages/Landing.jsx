import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import LoginModal from '../components/auth/LoginModal';

const Landing = ({ onLogin }) => {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <section className="flex flex-col justify-between min-h-screen relative overflow-hidden animate-fade-in">
        
      {/* Landing Header */}
      <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto w-full z-20">
        <div className="flex items-center gap-2">
          <div className="bg-black text-white p-1.5 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">MoSE DB</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-gray-500">
          <a href="https://mose.kookmin.ac.kr/mose/index.do" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">Platform</a>
          <a href="https://mose.kookmin.ac.kr/mose/index.do" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">Solutions</a>
          <a href="https://mose.kookmin.ac.kr/mose/index.do" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">Lab Website</a>
        </div>
        <button onClick={() => setShowLogin(true)} className="bg-black text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-gray-200">
          Sign In
        </button>
      </nav>

      {/* Hero Content */}
      <div className="flex-grow flex flex-col items-center justify-center text-center px-4 relative z-10 -mt-10">
        {/* Badge */}
        <div className="mb-8 animate-fade-in opacity-0" style={{ animationDelay: '0.1s' }}>
          <span className="px-3 py-1 rounded-full border border-gray-200 bg-white/50 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Mobility Cybersecurity Lab
          </span>
        </div>

        {/* Main Title */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 max-w-4xl mx-auto hero-text-gradient animate-fade-in opacity-0" style={{ animationDelay: '0.2s' }}>
          Intelligence beyond <br/>human scale.
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 font-light animate-fade-in opacity-0" style={{ animationDelay: '0.3s' }}>
          MoSE DB automates CVE detection and mitigation using proprietary heuristic engines. Secure your infrastructure with zero latency.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in opacity-0" style={{ animationDelay: '0.4s' }}>
          <button onClick={() => setShowLogin(true)} className="px-8 py-4 bg-blue-600 text-white rounded-full font-semibold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 hover:-translate-y-1">
            System Access &rarr;
          </button>
          <a href="https://mose.kookmin.ac.kr/mose/index.do" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-full font-semibold text-lg hover:bg-gray-50 transition-all">
            Visit Lab Website
          </a>
        </div>
      </div>

      {/* Abstract Visuals */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-100 to-purple-100 rounded-full blur-3xl opacity-50 z-0 pointer-events-none animate-float"></div>
      
      {/* Footer Info */}
      <div className="w-full text-center py-6 text-xs text-gray-400 z-20">
        &copy; 2025 Mobility Cybersecurity Lab. All rights reserved.
      </div>

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLogin} 
        onClose={() => setShowLogin(false)} 
        onLoginSuccess={onLogin} 
      />
    </section>
  );
};

export default Landing;