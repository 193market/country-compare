'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { formatTableValue, COUNTRY_COLORS } from '@/components/CompareChart';
import ProModal from '@/components/ProModal';

const CompareChart = dynamic(() => import('@/components/CompareChart'), { ssr: false });

interface DataPoint {
  year: string;
  value: number | null;
}

interface IndicatorResult {
  id: string;
  name: string;
  format: string;
  tier: string;
  data: DataPoint[];
}

interface KeyStat {
  label: string;
  value: number | null;
  prevValue: number | null;
  format: string;
}

interface ComparisonLink {
  slug: string;
  name: string;
  flag: string;
}

interface Props {
  countryCode: string;
  countryName: string;
  countryFlag: string;
  freeIndicators: IndicatorResult[];
  proIndicators: IndicatorResult[];
  keyStats: KeyStat[];
  comparisonLinks: ComparisonLink[];
}

const FREE_YEAR_START = 2014;

function filterFreeYears(data: DataPoint[]) {
  return data.filter((d) => parseInt(d.year) >= FREE_YEAR_START);
}

function formatStatValue(val: number | null, format: string): string {
  if (val === null) return 'N/A';
  switch (format) {
    case 'billions':
      return `$${(val / 1e9).toFixed(val / 1e9 >= 100 ? 0 : 1)}T`.replace('T', val >= 1e12 ? 'T' : 'B');
    case 'millions':
      if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
      return `${(val / 1e6).toFixed(1)}M`;
    case 'percent':
      return `${val.toFixed(1)}%`;
    default:
      return val >= 1000 ? val.toLocaleString('en-US', { maximumFractionDigits: 1 }) : val.toFixed(1);
  }
}

function getChangePercent(current: number | null, prev: number | null): number | null {
  if (current === null || prev === null || prev === 0) return null;
  return ((current - prev) / Math.abs(prev)) * 100;
}

export default function CountryProfileClient({
  countryCode,
  countryName,
  countryFlag,
  freeIndicators,
  proIndicators,
  keyStats,
  comparisonLinks,
}: Props) {
  const [showProModal, setShowProModal] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    fetch('/api/auth/status')
      .then((r) => r.json())
      .then((data) => setIsPro(data.pro === true))
      .catch(() => {});
  }, []);

  return (
    <>
      {/* Key Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {keyStats.map((stat) => {
          const change = getChangePercent(stat.value, stat.prevValue);
          return (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatStatValue(stat.value, stat.format)}
              </p>
              {change !== null && (
                <p className={`mt-1 text-sm font-medium flex items-center gap-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {change >= 0 ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l5-5 5 5M7 7l5 5 5-5" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-5 5-5-5m0 10l5-5 5 5" />
                    </svg>
                  )}
                  {change >= 0 ? '+' : ''}{change.toFixed(1)}% YoY
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Free Indicator Charts */}
      {freeIndicators.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Key Economic Indicators</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {freeIndicators.map((ind) => (
              <CompareChart
                key={ind.id}
                indicatorName={ind.name}
                format={ind.format}
                countries={[{
                  code: countryCode,
                  countryName,
                  data: isPro ? ind.data : filterFreeYears(ind.data),
                  color: COUNTRY_COLORS[0],
                }]}
                isPro={isPro}
                onDownload={() => setShowProModal(true)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Free Data Table */}
      {freeIndicators.length > 0 && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Latest Data</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                <th className="text-left px-6 py-3 font-medium">Indicator</th>
                <th className="text-right px-6 py-3 font-medium">Latest Value</th>
              </tr>
            </thead>
            <tbody>
              {freeIndicators.map((ind, i) => {
                const latest = [...ind.data].reverse().find((d) => d.value !== null);
                return (
                  <tr key={ind.id} className={i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                    <td className="px-6 py-3 text-gray-900 font-medium">{ind.name}</td>
                    <td className="px-6 py-3 text-right text-gray-700">
                      {formatTableValue(latest?.value ?? null, ind.format)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pro Charts (blurred preview) */}
      {proIndicators.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pro Indicators</h2>
            {!isPro && (
              <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                45 indicators
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {proIndicators.map((ind) => (
              <CompareChart
                key={ind.id}
                indicatorName={ind.name}
                format={ind.format}
                countries={[{
                  code: countryCode,
                  countryName,
                  data: ind.data,
                  color: COUNTRY_COLORS[0],
                }]}
                locked={!isPro}
                onUnlock={() => setShowProModal(true)}
                isPro={isPro}
                onDownload={() => setShowProModal(true)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pro CTA */}
      {!isPro && (
        <div className="mt-10 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-6 sm:p-8 text-center">
          <p className="text-2xl mb-2">&#128274;</p>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Unlock Full {countryName} Economic Data</h3>
          <p className="mt-2 text-sm text-gray-600 max-w-lg mx-auto">
            Access 50 indicators with 25-year historical data (2000&ndash;2024) and compare up to 10 countries.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setShowProModal(true)}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg shadow-lg hover:from-amber-600 hover:to-orange-600 transition text-sm cursor-pointer"
            >
              Upgrade to Pro &mdash; $9/month
            </button>
            <span className="text-xs text-gray-500">Cancel anytime</span>
          </div>
        </div>
      )}

      {/* Compare with other countries */}
      <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Compare {countryName} with</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {comparisonLinks.map((link) => (
            <Link
              key={link.slug}
              href={`/compare/${link.slug}`}
              className="flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-400 text-sm font-medium"
            >
              <span className="text-base leading-none">{countryFlag}</span>
              <span className="text-gray-400">vs</span>
              <span className="text-base leading-none">{link.flag}</span>
              {link.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Data Source */}
      <div className="mt-8 mb-4 text-center text-xs text-gray-400">
        All data from{' '}
        <a href="https://data.worldbank.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">
          World Bank Open Data
        </a>
      </div>

      <ProModal open={showProModal} onClose={() => setShowProModal(false)} />
    </>
  );
}
