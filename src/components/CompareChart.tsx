'use client';

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

export default function CompareChart({ indicatorName, format, countryA, countryB }: CompareChartProps) {
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="h-64 sm:h-72">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
