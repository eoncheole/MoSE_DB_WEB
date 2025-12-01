import React from 'react';
import { Sparkles, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import { cveData } from '../../data/cveData';

const CveTable = ({ onSelectCve }) => {
  const getSeverityColors = (severity) => {
    switch (severity) {
      case 'Critical': return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', dot: 'bg-red-500', ping: 'bg-red-400' };
      case 'High': return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', dot: 'bg-orange-500', ping: 'bg-orange-400' };
      default: return { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100', dot: 'bg-yellow-400', ping: 'bg-yellow-400' };
    }
  };

  return (
    <div className="premium-card rounded-[2rem] overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-gray-900">Detected Vulnerabilities</h2>
            <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> DB Synced
            </span>
          </div>
          <p className="text-sm text-gray-500">MoSE DB has identified {cveData.length} potential risks requiring attention.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0 group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input type="text" placeholder="Search CVE Database..." 
              className="w-full md:w-64 pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all outline-none" />
          </div>
          <button className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px] md:min-w-0">
          <thead>
            <tr className="bg-gray-50/30 text-gray-400 text-[11px] font-bold tracking-widest uppercase border-b border-gray-100/50">
              <th className="px-8 py-5">Status</th>
              <th className="px-6 py-5">CVE ID</th>
              <th className="px-6 py-5">Severity</th>
              <th className="px-6 py-5">Asset</th>
              <th className="px-6 py-5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {cveData.map((item, index) => {
              const colors = getSeverityColors(item.severity);
              return (
                <tr key={item.id} 
                    onClick={() => onSelectCve(item)}
                    className="group hover:bg-blue-50/30 transition-all duration-200 cursor-pointer border-b border-gray-50 last:border-0 animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors.ping} opacity-75`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${colors.dot}`}></span>
                      </span>
                      <span className="text-xs font-semibold text-gray-500">Active</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-mono text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">{item.id}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
                      {item.severity}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-medium text-gray-600">{item.asset}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-sm transition-all transform group-hover:translate-x-1">
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 bg-gray-50/30 text-center">
         <button className="text-xs font-semibold text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-wider py-2">View All History</button>
      </div>
    </div>
  );
};

export default CveTable;