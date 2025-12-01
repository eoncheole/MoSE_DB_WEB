import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, AlertTriangle, CheckCircle, Server, Activity } from 'lucide-react';

export default function DetailPanel({ isOpen, onClose, cve }) {
  if (!isOpen || !cve) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-colors"
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 overflow-y-auto border-l border-gray-100"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    cve.severity === 'Critical' ? 'bg-red-50 text-red-600' :
                    cve.severity === 'High' ? 'bg-orange-50 text-orange-600' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{cve.id}</h2>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Vulnerability Details</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Card */}
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 mb-8">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Status</span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-md border border-gray-200 shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-semibold text-green-700">Active</span>
                    </span>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200/50 last:border-0">
                        <span className="text-sm text-gray-500 flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Severity
                        </span>
                        <span className={`text-sm font-bold ${
                            cve.severity === 'Critical' ? 'text-red-600' :
                            cve.severity === 'High' ? 'text-orange-600' :
                            'text-blue-600'
                        }`}>{cve.severity}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200/50 last:border-0">
                         <span className="text-sm text-gray-500 flex items-center gap-2">
                            <Server className="w-4 h-4" /> Asset
                        </span>
                        <span className="text-sm font-semibold text-gray-900">{cve.asset}</span>
                    </div>
                </div>
              </div>



              {/* Actions (Placeholder) */}
              <div className="space-y-3">
                <button className="w-full py-3 px-4 bg-gray-900 text-white text-sm font-bold rounded-xl shadow-lg shadow-gray-200 hover:bg-gray-800 hover:scale-[1.02] transition-all active:scale-[0.98]">
                    Generate Patch
                </button>
                <button className="w-full py-3 px-4 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors">
                    View Full Report
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
