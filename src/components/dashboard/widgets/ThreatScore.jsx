import React from 'react';
import { Shield } from 'lucide-react';

const ThreatScore = () => {
  return (
    <div className="premium-card p-6 sm:p-8 rounded-[2rem] relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-2xl opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600">
            <Shield className="w-6 h-6" />
          </div>
          <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Real-time</span>
        </div>
        <p className="text-sm font-medium text-gray-500 mb-1">Security Score</p>
        <div className="flex items-end gap-3">
          <h2 className="text-5xl font-bold text-gray-900 tracking-tight">98</h2>
          <span className="text-sm font-semibold text-green-600 mb-2">/ 100</span>
        </div>
        <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 w-[98%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
        </div>
      </div>
    </div>
  );
};

export default ThreatScore;
