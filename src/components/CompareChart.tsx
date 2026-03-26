'use client';

import { useRef, useState, useEffect } from 'react';
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

export const COUNTRY_COLORS = [
  '#2563EB', '#DC2626', '#16A34A', '#EA580C', '#9333EA',
  '#0891B2', '#EC4899', '#92400E', '#6B7280', '#111827',
];

export interface CountryChartEntry {
  code: string;
  countryName: string;
  data: { year: string; value: number | null }[];
  color: string;
}

interface CompareChartProps {
  indicatorName: string;
  format: string;
  countries: CountryChartEntry[];
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

function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

export default function CompareChart({ indicatorName, format, countries, locked, onUnlock, isPro, onDownload }: CompareChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);
  const isDark = useDarkMode();

  const textColor = isDark ? '#E5E7EB' : '#1F2937';
  const gridColor = isDark ? '#374151' : '#E5E7EB';
  const tickColor = isDark ? '#9CA3AF' : '#6B7280';
  const legendColor = isDark ? '#D1D5DB' : '#374151';

  const allYears = Array.from(
    new Set(countries.flatMap((c) => c.data.map((d) => d.year)))
  ).sort();

  const datasets = countries.map((country, i) => {
    const valueMap = new Map(country.data.map((d) => [d.year, d.value]));
    // In dark mode, swap very dark colors for brighter ones
    let color = country.color;
    if (isDark && color === '#111827') color = '#F59E0B';
    if (isDark && color === '#6B7280') color = '#9CA3AF';
    return {
      label: country.countryName,
      data: allYears.map((y) => valueMap.get(y) ?? null),
      borderColor: color,
      backgroundColor: color + '20',
      tension: 0.3,
      pointRadius: countries.length > 5 ? 1 : 2,
      pointHoverRadius: 5,
      borderWidth: countries.length > 5 ? 1.5 : 2,
    };
  });

  const data = { labels: allYears, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: indicatorName,
        font: { size: 14, weight: 'bold' as const },
        color: textColor,
      },
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          padding: 8,
          font: { size: countries.length > 5 ? 10 : 12 },
          color: legendColor,
        },
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
      x: {
        ticks: { color: tickColor },
        grid: { color: gridColor },
      },
      y: {
        ticks: {
          color: tickColor,
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
        grid: { color: gridColor },
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 relative overflow-hidden transition-colors">
      {!locked && (
        <button
          onClick={handleDownload}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
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
          className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-gray-900/60 cursor-pointer"
          onClick={onUnlock}
        >
          <div className="text-4xl mb-3">&#128274;</div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 text-center px-4">
            Unlock 50 indicators with Pro
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">$9/month</p>
          <button className="mt-3 px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-lg shadow hover:from-amber-600 hover:to-orange-600 transition cursor-pointer">
            Upgrade to Pro
          </button>
        </div>
      )}
    </div>
  );
}
