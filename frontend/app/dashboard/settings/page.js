'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, User, Save, Trash2, Plus, ArrowLeft, Loader2, Search, Settings as SettingsIcon } from 'lucide-react';
import Footer from '@/components/layout/Footer';

export default function Settings() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [user, setUser] = useState(null);
  const [userList, setUserList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create User Form State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '' });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        
        // 1. Get My Profile
        const res = await fetch(`${apiUrl}/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);

          // 2. If Admin, fetch all users
          if (userData.email === 'admin') {
            const usersRes = await fetch(`${apiUrl}/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                setUserList(usersData);
            }
          }
        } else {
            router.push('/login');
        }
      } catch (error) {
        console.error("Failed to fetch settings data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/users/`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                // Note: creating user usually doesn't need auth, but if we want only admin to create, 
                // we should update backend. For now, using standard signup endpoint.
            },
            body: JSON.stringify(newUser)
        });

        if (res.ok) {
            const createdUser = await res.json();
            setUserList([...userList, createdUser]);
            setIsCreateModalOpen(false);
            setNewUser({ email: '', password: '', full_name: '' });
            alert("User created successfully!");
        } else {
            alert("Failed to create user.");
        }
    } catch (err) {
        alert("Error creating user");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
            
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 flex-shrink-0">
                <nav className="space-y-1">
                    <button 
                        onClick={() => setActiveTab('profile')}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        My Profile
                    </button>
                    <button 
                        onClick={() => setActiveTab('preferences')}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'preferences' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        Preferences
                    </button>
                    {user?.email === 'admin' && (
                        <button 
                            onClick={() => setActiveTab('users')}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            User Management
                        </button>
                    )}
                    <div className="pt-4 mt-4 border-t border-gray-200">
                        <button 
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                            Log Out
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Content Area */}
            <div className="flex-grow">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]"
                >
                    {activeTab === 'profile' && (
                        <div className="p-8">
                            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-600" /> Profile Information
                            </h2>
                            <div className="max-w-md space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                                    <input type="text" value={user?.full_name || ''} disabled className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                                    <input type="email" value={user?.email || ''} disabled className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Role</label>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {user?.email === 'admin' ? 'Administrator' : 'Standard User'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && user?.email === 'admin' && (
                        <div className="p-0">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">User Management</h2>
                                    <p className="text-sm text-gray-500">Manage system access and roles</p>
                                </div>
                                <button 
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-blue-700 transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> Add User
                                </button>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            <th className="px-6 py-4">Name</th>
                                            <th className="px-6 py-4">Email</th>
                                            <th className="px-6 py-4">Role</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {userList.map((u) => (
                                            <tr key={u.id} className="group hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.full_name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.email === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                                        {u.email === 'admin' ? 'Admin' : 'User'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {u.email !== 'admin' && (
                                                        <button className="text-gray-400 hover:text-red-600 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div className="p-8">
                            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <SettingsIcon className="w-5 h-5 text-blue-600" /> Preferences
                            </h2>
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <SettingsIcon className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 mb-1">Coming Soon</h3>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                    Theme customization and notification settings will be available in the next update.
                                </p>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
      </main>
      
      <Footer />

      {/* Create User Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setIsCreateModalOpen(false)}
                    className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden p-6"
                >
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Add New User</h3>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
                            <input 
                                required
                                value={newUser.full_name}
                                onChange={e => setNewUser({...newUser, full_name: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</label>
                            <input 
                                required
                                type="email"
                                value={newUser.email}
                                onChange={e => setNewUser({...newUser, email: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Password</label>
                            <input 
                                required
                                type="password"
                                value={newUser.password}
                                onChange={e => setNewUser({...newUser, password: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                            />
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button 
                                type="button" 
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                            >
                                Create User
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}
