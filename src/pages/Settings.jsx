import React, { useState } from 'react';
import { 
  User, Lock, Bell, Key, Shield, Save, 
  ChevronLeft, Camera, Mail, Building 
} from 'lucide-react';
import Header from '../components/dashboard/Header';

const Settings = ({ onLogout, onBack }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const NavItem = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
        activeTab === id 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
          : 'text-gray-500 hover:bg-white hover:text-gray-900'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col animate-fade-in bg-[#F5F5F7]">
      <Header onLogout={onLogout} onNavigate={onBack} /> {/* Pass onBack to allow navigation */}

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="p-2 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-gray-900 hover:scale-105 transition-all shadow-sm">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Settings</h1>
            <p className="text-sm text-gray-500">Manage your MoSE DB preferences and account security.</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <div className="lg:w-64 shrink-0 space-y-1">
            <NavItem id="general" icon={User} label="General Profile" />
            <NavItem id="security" icon={Shield} label="Security & Login" />
            <NavItem id="notifications" icon={Bell} label="Notifications" />
            <NavItem id="api" icon={Key} label="API Keys" />
          </div>

          {/* Content Area */}
          <div className="flex-grow">
            <div className="premium-card bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/60 min-h-[600px] relative">
              
              {/* --- General Tab --- */}
              {activeTab === 'general' && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Profile Information</h2>
                    <p className="text-sm text-gray-500">Update your photo and personal details.</p>
                  </div>

                  {/* Avatar Upload */}
                  <div className="flex items-center gap-6 pb-8 border-b border-gray-100">
                    <div className="relative group cursor-pointer">
                      <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-gray-100 to-gray-200">
                        <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix" className="w-full h-full rounded-full bg-white" alt="User" />
                      </div>
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <div className="flex gap-3 mb-2">
                        <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors">Change Photo</button>
                        <button className="px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors">Remove</button>
                      </div>
                      <p className="text-xs text-gray-400">JPG, GIF or PNG. Max size of 800K</p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Display Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" defaultValue="mose" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="email" defaultValue="mose@kookmin.ac.kr" className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Lab / Organization</label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" defaultValue="Mobility Cybersecurity Lab" disabled className="w-full bg-gray-100 border border-gray-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium text-gray-500 cursor-not-allowed" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- Security Tab --- */}
              {activeTab === 'security' && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Security & Login</h2>
                    <p className="text-sm text-gray-500">Manage your password and 2FA settings.</p>
                  </div>

                  <div className="p-5 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-4">
                    <div className="p-2 bg-white rounded-lg text-orange-500 shadow-sm">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-orange-800">Password Last Changed</h3>
                      <p className="text-xs text-orange-600/80 mt-1">3 months ago. We recommend rotating your password every 90 days.</p>
                    </div>
                    <button className="ml-auto text-xs font-bold text-orange-600 bg-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-orange-100 transition-colors">Update</button>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between py-4 border-b border-gray-100">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">Two-Factor Authentication</h4>
                        <p className="text-xs text-gray-500 mt-1">Secure your account with an authenticator app.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-gray-100">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">Session Timeout</h4>
                        <p className="text-xs text-gray-500 mt-1">Automatically lock dashboard after inactivity.</p>
                      </div>
                      <select className="text-sm border-none bg-gray-50 rounded-lg px-3 py-1.5 font-medium text-gray-700 focus:ring-0 cursor-pointer">
                        <option>15 minutes</option>
                        <option>30 minutes</option>
                        <option>1 hour</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

               {/* --- API Tab --- */}
               {activeTab === 'api' && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">API Keys</h2>
                    <p className="text-sm text-gray-500">Manage access tokens for MoSE DB integration.</p>
                  </div>

                  <div className="bg-gray-900 rounded-2xl p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Active Master Key</p>
                            <div className="font-mono text-lg tracking-wider">sk_live_51Mz...9x2A</div>
                        </div>
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold rounded uppercase">Active</span>
                    </div>
                    <div className="flex gap-3 relative z-10">
                        <button className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors">Regenerate</button>
                        <button className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-bold transition-colors">Revoke</button>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Service</th>
                                <th className="px-4 py-3 text-right">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr>
                                <td className="px-4 py-3 font-medium text-gray-900">CI/CD Pipeline</td>
                                <td className="px-4 py-3 text-gray-500">Jenkins Agent</td>
                                <td className="px-4 py-3 text-right text-gray-500">2 days ago</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 font-medium text-gray-900">Monitoring</td>
                                <td className="px-4 py-3 text-gray-500">Grafana</td>
                                <td className="px-4 py-3 text-right text-gray-500">1 month ago</td>
                            </tr>
                        </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Save Button (Absolute Bottom) */}
              <div className="absolute bottom-8 right-8">
                <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold shadow-xl shadow-gray-200 hover:bg-black hover:scale-105 active:scale-95 transition-all"
                >
                    {isLoading ? (
                        <span className="animate-pulse">Saving...</span>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Changes
                        </>
                    )}
                </button>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
