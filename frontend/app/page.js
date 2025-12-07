'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function Landing() {
  return (
    <div className="flex flex-col justify-between min-h-screen overflow-hidden">
      
      {/* Header */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto w-full z-20"
      >
        <div className="flex items-center gap-2">
          <div className="bg-black text-white p-1.5 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">MoSE DB</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-gray-500">
          <Link href="https://mose.kookmin.ac.kr/mose/index.do" target="_blank" className="hover:text-black transition-colors">Platform</Link>
          <Link href="https://mose.kookmin.ac.kr/mose/index.do" target="_blank" className="hover:text-black transition-colors">Solutions</Link>
          <Link href="https://mose.kookmin.ac.kr/mose/index.do" target="_blank" className="hover:text-black transition-colors">Lab Website</Link>
        </div>
        <Link href="/login">
            <button className="bg-black text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-gray-200">
                Sign In
            </button>
        </Link>
      </motion.nav>

      {/* Hero */}
      <div className="flex-grow flex flex-col items-center justify-center text-center px-4 relative z-10 -mt-10">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mb-8"
        >
          <span className="px-3 py-1 rounded-full border border-gray-200 bg-white/50 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Mobility Cybersecurity Lab
          </span>
        </motion.div>

        <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 max-w-4xl mx-auto hero-text-gradient"
        >
          MoSE DB
        </motion.h1>



        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
        >
          <Link href="/login">
              <button className="px-8 py-4 bg-blue-600 text-white rounded-full font-semibold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 hover:-translate-y-1 w-full sm:w-auto">
                System Access &rarr;
              </button>
          </Link>
          <Link href="https://mose.kookmin.ac.kr/mose/index.do" target="_blank">
              <button className="px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-full font-semibold text-lg hover:bg-gray-50 transition-all w-full sm:w-auto">
                Visit Lab Website
              </button>
          </Link>
        </motion.div>
      </div>

      {/* Abstract Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-100 to-purple-100 rounded-full blur-3xl opacity-50 z-0 pointer-events-none animate-float"></div>
      
      {/* Footer Info */}
      <div className="w-full text-center py-6 text-xs text-gray-400 z-20">
        &copy; 2025 Mobility Cybersecurity Lab. All rights reserved.
      </div>
    </div>
  );
}
