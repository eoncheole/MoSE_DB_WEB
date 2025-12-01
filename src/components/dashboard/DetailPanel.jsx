import React from 'react';
import { X, Sparkles, Zap } from 'lucide-react';
import clsx from 'clsx';

const DetailPanel = ({ isOpen, onClose, cve }) => {
  if (!cve) return null;

  const getSeverityColors = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-50 text-red-600 ring-red-100';
      case 'High': return 'bg-orange-50 text-orange-600 ring-orange-100';
      default: return 'bg-yellow-50 text-yellow-600 ring-yellow-100';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={clsx(
          "fixed inset-0 bg-gray-900/10 backdrop-blur-[2px] z-[100] transition-opacity duration-300",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={clsx(
        "fixed inset-y-0 right-0 w-full md:w-[500px] bg-white/90 backdrop-blur-2xl z-[101] shadow-[0_0_50px_rgba(0,0,0,0.15)] border-l border-white/50 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col h-full supports-[height:100dvh]:h-[100dvh]",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="px-6 py-6 sm:px-8 border-b border-gray-100/50 flex justify-between items-start bg-white/40 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={clsx("px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ring-1", getSeverityColors(cve.severity))}>
                {cve.severity}
              </span>
              <span className="text-xs text-gray-400 font-mono tracking-tight">CVSS {cve.score}</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 font-mono tracking-tighter">{cve.id}</h2>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-900 hover:bg-white rounded-full transition-all active:scale-95">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto custom-scroll p-6 sm:px-8 space-y-8">
          <div>
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Vulnerability Detail</h4>
            <p className="text-gray-600 leading-relaxed text-[15px] font-light">
              {cve.desc}
            </p>
          </div>
          
          <div>
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Remediation Script</h4>
            <div className="bg-[#1e1e1e] p-5 rounded-2xl overflow-x-auto shadow-inner border border-gray-800">
              <code className="font-mono text-xs text-gray-300 leading-relaxed block whitespace-pre-wrap">
                {cve.script}
              </code>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 bg-gray-50/30 shrink-0">
           <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">Ticket #9942</span>
              <button className="text-xs font-bold text-gray-900 hover:text-blue-600 transition-colors">Open in Jira &rarr;</button>
           </div>
        </div>
      </div>
    </>
  );
};

export default DetailPanel;
