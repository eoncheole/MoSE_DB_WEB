import React, { useState } from 'react';
import Header from '../components/dashboard/Header';
import ThreatScore from '../components/dashboard/widgets/ThreatScore';
import TerminalLog from '../components/dashboard/widgets/TerminalLog';
import ThreatChart from '../components/dashboard/widgets/ThreatChart';
import CveTable from '../components/dashboard/CveTable';
import DetailPanel from '../components/dashboard/DetailPanel';

const Dashboard = ({ onLogout, onNavigate }) => {
  const [selectedCve, setSelectedCve] = useState(null);

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Header onLogout={onLogout} onNavigate={onNavigate} />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ThreatScore />
          <TerminalLog />
          <ThreatChart />
        </div>

        {/* Vulnerability List */}
        <CveTable onSelectCve={setSelectedCve} />
      </main>

      {/* Slide-over Panel */}
      <DetailPanel 
        isOpen={!!selectedCve} 
        onClose={() => setSelectedCve(null)} 
        cve={selectedCve} 
      />
    </div>
  );
};

export default Dashboard;