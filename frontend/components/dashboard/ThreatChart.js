'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Test 1', threats: 10 },
  { name: 'Test 2', threats: 10 },
  { name: 'Test 3', threats: 10 },
  { name: 'Test 4', threats: 10 },
  { name: 'Test 5', threats: 10 },
  { name: 'Test 6', threats: 10 },
  { name: 'Test 7', threats: 10 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1D1D1F] text-white p-3 rounded-xl shadow-xl border border-gray-700 text-xs">
        <p className="font-bold mb-1">{label}</p>
        <p className="text-blue-400">Threats: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default function ThreatChart() {
  return (
    <div className="premium-card p-6 sm:p-8 rounded-[2rem] lg:col-span-1 md:col-span-2 flex flex-col h-[320px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">Threat Trends</h3>
        <div className="flex gap-2 items-center">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-xs text-gray-400">Test Events</span>
        </div>
      </div>
      <div className="flex-grow w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fill: '#9CA3AF'}} 
                dy={10}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{stroke: '#3B82F6', strokeWidth: 1, strokeDasharray: '4 4'}} />
            <Area 
                type="monotone" 
                dataKey="threats" 
                stroke="#3B82F6" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorThreats)" 
                animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
