'use client';

import { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface CountryData {
  countryName: string;
  data: { year: string; value: number | null }[];
}

interface CompareChartProps {
  indicatorName: string;
  format: string;
  countryA: { code: string } & CountryData;
  countryB: { code: string } & CountryData;
  locked?: boolean;
  onUnlock?: () => void;
  isPro?: boolean;
  onDownload?: () => void;
}

function formatValue(val: number | null, format: string): string {
  if (val === null) return 'N/A';
  switch (format) {
    case 'billions':
      return `$${(val / 1e9).toFixed(1)}B`;
    case 'millions':
      return `${(val / 1e6).toFixed(1)}M`;
    case 'percent':
      return `${val.toFixed(1)}%`;
    default:
      return val.toFixed(1);
  }
}

export function formatTableValue(val: number | null, format: string): string {
  return formatValue(val, format);
}

export default function CompareChart({ indicatorName, format, countryA, countryB, locked, onUnlock, isPro, onDownload }: CompareChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);

  const allYears = Array.from(
    new Set([...countryA.data.map((d) => d.year), ...countryB.data.map((d) => d.year)])
  ).sort();

  const mapA = new Map(countryA.data.map((d) => [d.year, d.value]));
  const mapB = new Map(countryB.data.map((d) => [d.year, d.value]));

  const data = {
    labels: allYears,
    datasets: [
      {
        label: countryA.countryName,
        data: allYears.map((y) => mapA.get(y) ?? null),
        borderColor: '#2563EB',
        backgroundColor: '#2563EB20',
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
      {
        label: countryB.countryName,
        data: allYears.map((y) => mapB.get(y) ?? null),
        borderColor: '#DC2626',
        backgroundColor: '#DC262620',
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: indicatorName,
        font: { size: 14, weight: 'bold' as const },
        color: '#1F2937',
      },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) => {
            const name = ctx.dataset.label || '';
            return `${name}: ${formatValue(ctx.parsed.y, format)}`;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (val: string | number) => {
            const num = typeof val === 'string' ? parseFloat(val) : val;
            switch (format) {
              case 'billions':
                return `$${(num / 1e9).toFixed(0)}B`;
              case 'millions':
                return `${(num / 1e6).toFixed(0)}M`;
              case 'percent':
                return `${num.toFixed(1)}%`;
              default:
                return num.toFixed(0);
            }
          },
        },
      },
    },
  };

  const handleDownload = () => {
    if (!isPro) {
      onDownload?.();
      return;
    }
    const chart = chartRef.current;
    if (!chart) return;
    const url = chart.toBase64Image('image/png', 1);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${indicatorName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    a.click();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 relative overflow-hidden">
      {/* Download button */}
      {!locked && (
        <button
          onClick={handleDownload}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
          title={isPro ? 'Download PNG' : 'Pro feature'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
          </svg>
        </button>
      )}

      <div className={`h-64 sm:h-72 ${locked ? 'blur-[6px] pointer-events-none select-none' : ''}`}>
        <Line ref={chartRef} data={data} options={options} />
      </div>
      {locked && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 cursor-pointer"
          onClick={onUnlock}
        >
          <div className="text-4xl mb-3">&#128274;</div>
          <p className="text-sm font-semibold text-gray-800 text-center px-4">
            Unlock 50 indicators with Pro
          </p>
          <p className="text-xs text-gray-500 mt-1">$9/month</p>
          <button
            className="mt-3 px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-lg shadow hover:from-amber-600 hover:to-orange-600 transition cursor-pointer"
          >
            Upgrade to Pro
          </button>
        </div>
      )}
    </div>
  );
}
