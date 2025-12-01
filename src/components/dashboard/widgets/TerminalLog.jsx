import React, { useState, useEffect, useRef } from 'react';
import { Cpu } from 'lucide-react';
import { systemLogs, globalLogs } from '../../../data/logs';

const TerminalLog = () => {
  const [mode, setMode] = useState('system');
  const [logs, setLogs] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    // Initial logs
    setLogs(mode === 'system' ? systemLogs.slice(0, 3) : globalLogs.slice(0, 3));
  }, [mode]);

  useEffect(() => {
    const interval = setInterval(() => {
      const source = mode === 'system' ? systemLogs : globalLogs;
      const randomLog = source[Math.floor(Math.random() * source.length)];
      
      setLogs(prevLogs => {
        const newLogs = [...prevLogs, { ...randomLog, id: Date.now() }];
        if (newLogs.length > 6) return newLogs.slice(1);
        return newLogs;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [mode]);

  return (
    <div className="bg-[#1a1b1e] text-white p-6 sm:p-8 rounded-[2rem] shadow-2xl shadow-gray-200/50 flex flex-col justify-between h-[280px] md:h-auto lg:h-auto relative overflow-hidden group">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 blur-sm"></div>
      
      <div className="flex justify-between items-start z-10 w-full">
        <div className="flex flex-col gap-1 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">MoSE DB Core</p>
            </div>
            <Cpu className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
          </div>
          
          <div className="flex gap-2 mt-2">
            <button 
              onClick={() => setMode('system')} 
              className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors ${mode === 'system' ? 'text-white bg-white/10' : 'text-gray-400 hover:bg-white/10'}`}
            >
              System
            </button>
            <button 
              onClick={() => setMode('global')} 
              className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors ${mode === 'global' ? 'text-white bg-white/10' : 'text-gray-400 hover:bg-white/10'}`}
            >
              Global Feed
            </button>
          </div>
        </div>
      </div>
      
      <div className="font-mono text-[11px] leading-relaxed text-gray-400 space-y-2 mt-4 overflow-hidden relative flex flex-col justify-end h-full" ref={containerRef}>
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#1a1b1e] to-transparent z-20 pointer-events-none"></div>
        {logs.map((log, i) => (
          <div key={log.id || i} className={`truncate transition-all duration-500 animate-fade-in ${log.color}`}>
            &gt; {log.highlight ? log.text.split(log.highlight).map((part, index, array) => (
                <React.Fragment key={index}>
                    {part}
                    {index < array.length - 1 && <span className={log.highlightColor}>{log.highlight}</span>}
                </React.Fragment>
            )) : log.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TerminalLog;
