'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ShieldCheck, Shield, Cpu, Search, SlidersHorizontal, ChevronRight, Sparkles, Loader2, LogOut, User, Settings, Plus } from 'lucide-react';
import ThreatChart from '@/components/dashboard/ThreatChart';
import Footer from '@/components/layout/Footer';
import DetailPanel from '@/components/dashboard/DetailPanel';
import CreateCveModal from '@/components/dashboard/CreateCveModal';

export default function Dashboard() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [cveList, setCveList] = useState([]);
  const [fullData, setFullData] = useState([]); // 검색 필터링을 위한 원본 데이터
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCve, setSelectedCve] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // Initialize state

  const handleCveCreated = (newCve) => {
    const mapped = {
        id: newCve.cve_id,
        severity: newCve.severity,
        asset: newCve.asset
    };
    setFullData(prev => [mapped, ...prev]);
    if (searchTerm === '') {
        setCveList(prev => [mapped, ...prev]);
    }
  };

  // --- Fetch Data from Backend ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token'); // Get token

        // 1. Fetch User Info if token exists
        if (token) {
            try {
                const userRes = await fetch('http://localhost:8000/users/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (userRes.ok) {
                    const userData = await userRes.json();
                    setCurrentUser(userData);
                }
            } catch (e) {
                console.error("Failed to fetch user", e);
            }
        }

        // 2. Fetch CVEs
        const res = await fetch('http://localhost:8000/cves/');
        if (!res.ok) throw new Error('Failed to fetch data');
        const data = await res.json();
        
        // 데이터 포맷 매핑 (Backend Schema -> Frontend UI)
        const mappedData = data.map(item => ({
            id: item.cve_id,
            severity: item.severity,
            asset: item.asset
        }));

        setFullData(mappedData);
        setCveList(mappedData);
      } catch (error) {
        console.error("API Error:", error);
        // 에러 발생 시 빈 배열 유지 (또는 에러 UI 표시 가능)
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term === '') {
        setCveList(fullData);
    } else {
        const filtered = fullData.filter(item => 
            item.id.toLowerCase().includes(term.toLowerCase()) || 
            item.asset.toLowerCase().includes(term.toLowerCase())
        );
        setCveList(filtered);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Dashboard Header */}
      <header className="premium-glass sticky top-0 z-50 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3 group">
                <div className="bg-gray-900 text-white p-2 rounded-xl shadow-lg shadow-gray-300 group-hover:scale-105 transition-transform duration-300">
                    <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-lg tracking-tight text-gray-900 leading-none">MoSE DB</span>
                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">Mobility Cybersecurity Lab</span>
                </div>
            </Link>
            
            <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-50/80 border border-green-100 rounded-full backdrop-blur-md">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-green-700 tracking-wide">System Secure</span>
                </div>
                <div className="relative">
                    <div 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-all"
                    >
                        <User className="w-5 h-5 text-gray-400" />
                    </div>

                    {/* Profile Dropdown */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                            <div className="px-4 py-2 border-b border-gray-50 mb-1">
                                <p className="text-sm font-bold text-gray-900">{currentUser?.full_name || 'User'}</p>
                                <p className="text-xs text-gray-500 truncate">{currentUser?.email || 'Loading...'}</p>
                            </div>
                            <Link href="/dashboard/settings?tab=profile" className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 flex items-center gap-2 transition-colors">
                                <User className="w-4 h-4" /> Profile
                            </Link>
                            <Link href="/dashboard/settings?tab=preferences" className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 flex items-center gap-2 transition-colors">
                                <Settings className="w-4 h-4" /> Settings
                            </Link>
                            <div className="h-px bg-gray-50 my-1"></div>
                            <button 
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                            >
                                <LogOut className="w-4 h-4" /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Grid Widgets */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
            {/* Score Widget */}
            <div className="premium-card p-6 sm:p-8 rounded-[2rem] relative overflow-hidden group hover:shadow-2xl transition-all">
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-2xl opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600">
                            <Shield className="w-6 h-6" />
                        </div>
                        <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Real-time</span>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Test Score</p>
                    <div className="flex items-end gap-3">
                        <h2 className="text-5xl font-bold text-gray-900 tracking-tight">--</h2>
                        <span className="text-sm font-semibold text-gray-600 mb-2">/ --</span>
                    </div>
                    <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 w-[50%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                    </div>
                </div>
            </div>

            {/* Terminal Widget (Simplified for brevity) */}
            <div className="bg-[#1a1b1e] text-white p-6 sm:p-8 rounded-[2rem] shadow-2xl flex flex-col justify-between h-[320px] relative overflow-hidden group">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 blur-sm"></div>
                <div className="flex justify-between items-center z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">MoSE DB Core</p>
                    </div>
                    <Cpu className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                </div>
                <div className="font-mono text-[11px] leading-relaxed text-gray-400 space-y-2 mt-4 overflow-hidden">
                    <p className="truncate hover:text-gray-200 transition-colors cursor-default">&gt; [test] Initializing...</p>
                    <p className="truncate hover:text-gray-200 transition-colors cursor-default">&gt; [test] Module: <span className="text-blue-400">Test Unit A</span></p>
                    <p className="truncate hover:text-gray-200 transition-colors cursor-default">&gt; [test] Status: <span className="text-green-400">OK</span></p>
                    <p className="truncate hover:text-gray-200 transition-colors cursor-default animate-pulse">&gt; [test] Running cycle...</p>
                </div>
            </div>

            {/* Recharts Component */}
            <ThreatChart />
        </motion.div>

        {/* Table Section */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="premium-card rounded-[2rem] overflow-hidden"
        >
            <div className="p-6 sm:p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold text-gray-900">Detected Vulnerabilities</h2>
                        <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> DB Synced
                        </span>
                    </div>
                    <p className="text-sm text-gray-500">MoSE DB has identified {cveList.length} risks.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-grow md:flex-grow-0 group">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search CVE or Asset..." 
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full md:w-64 pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all" 
                        />
                    </div>
                    <button className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                        <SlidersHorizontal className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden md:inline">Add</span>
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/30 text-gray-400 text-[11px] font-bold uppercase border-b border-gray-100/50">
                            <th className="px-8 py-5">CVE ID</th>
                            <th className="px-6 py-5">Severity</th>
                            <th className="px-6 py-5">Asset</th>
                            <th className="px-6 py-5"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                        {isLoading ? (
                            <tr>
                                <td colSpan="5" className="px-8 py-12 text-center">
                                    <div className="flex justify-center items-center gap-2 text-gray-500">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Fetching Database...
                                    </div>
                                </td>
                            </tr>
                        ) : cveList.length > 0 ? (
                            cveList.map((item) => (
                                <tr 
                                    key={item.id} 
                                    onClick={() => setSelectedCve(item)}
                                    className="group hover:bg-blue-50/30 transition-colors cursor-pointer"
                                >
                                    <td className="px-8 py-5 font-mono font-semibold text-gray-700 group-hover:text-blue-600">{item.id}</td>
                                    <td className="px-6 py-5">
                                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                                            item.severity === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' : 
                                            item.severity === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                                            'bg-yellow-50 text-yellow-600 border-yellow-100'
                                        }`}>
                                            {item.severity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-gray-600">{item.asset}</td>
                                    <td className="px-6 py-5 text-right">
                                        <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-8 py-8 text-center text-gray-500">
                                    No vulnerabilities found matching "{searchTerm}"
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
      </main>
      
      <Footer />
      
      <DetailPanel 
        isOpen={!!selectedCve} 
        onClose={() => setSelectedCve(null)} 
        cve={selectedCve} 
      />
      
      <CreateCveModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onCreated={handleCveCreated} 
      />
    </div>
  );
}
