import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

const ThreatChart = () => {
  const chartRef = useRef(null);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(29, 29, 31, 0.9)',
        padding: 12,
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'Inter', size: 12, weight: '500' },
        cornerRadius: 12,
        displayColors: false,
        intersect: false,
        mode: 'index',
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 10 }, color: '#9CA3AF' }
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.03)', borderDash: [4, 4] },
        ticks: { display: false },
        border: { display: false }
      }
    },
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
    elements: {
        point: {
            radius: 0,
            hoverRadius: 6,
            backgroundColor: '#fff',
            borderColor: '#3B82F6',
            borderWidth: 2,
        }
    }
  };

  // Simplified data object to prevent rendering crashes
  const data = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
        label: 'Threats',
        data: [12, 18, 14, 28, 20, 32, 25],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)', // Solid color instead of gradient for stability
        borderWidth: 3,
        fill: true,
        tension: 0.45
    }]
  };

  return (
    <div className="premium-card p-6 sm:p-8 rounded-[2rem] lg:col-span-1 md:col-span-2 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">Threat Trends</h3>
        <div className="flex gap-2 items-center">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-xs text-gray-400">Blocked</span>
        </div>
      </div>
      <div className="flex-grow w-full relative h-[180px]">
        <Line options={options} data={data} ref={chartRef} />
      </div>
    </div>
  );
};

export default ThreatChart;