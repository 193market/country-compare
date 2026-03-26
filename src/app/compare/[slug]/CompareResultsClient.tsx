'use client';

import { useState, useEffect } from 'react';
import CompareChart, { formatTableValue } from '@/components/CompareChart';
import ProModal from '@/components/ProModal';

interface CountryResult {
  countryName: string;
  data: { year: string; value: number | null }[];
}

interface CompareResult {
  indicator: { id: string; name: string; format: string; tier: string };
  countries: Record<string, CountryResult>;
}

interface Props {
  freeResults: CompareResult[];
  proResults: CompareResult[];
  codeA: string;
  codeB: string;
  nameA: string;
  nameB: string;
}

const FREE_YEAR_START = 2014;

function filterFreeYears(data: { year: string; value: number | null }[]) {
  return data.filter((d) => parseInt(d.year) >= FREE_YEAR_START);
}

function getLatestValue(result: CompareResult, code: string): number | null {
  const country = result.countries[code];
  if (!country) return null;
  for (let i = country.data.length - 1; i >= 0; i--) {
    if (country.data[i].value !== null) return country.data[i].value;
  }
  return null;
}

export default function CompareResultsClient({ freeResults, proResults, codeA, codeB, nameA, nameB }: Props) {
  const [showProModal, setShowProModal] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    fetch('/api/auth/status')
      .then((r) => r.json())
      .then((data) => setIsPro(data.pro === true))
      .catch(() => {});
  }, []);

  if (freeResults.length === 0 && proResults.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
        No data available for this comparison.
      </div>
    );
  }

  return (
    <>
      {/* Free Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {freeResults.map((result) => {
          const rawA = result.countries[codeA] || { countryName: nameA, data: [] };
          const rawB = result.countries[codeB] || { countryName: nameB, data: [] };
          return (
            <CompareChart
              key={result.indicator.id}
              indicatorName={result.indicator.name}
              format={result.indicator.format}
              countryA={{ code: codeA, countryName: rawA.countryName, data: isPro ? rawA.data : filterFreeYears(rawA.data) }}
              countryB={{ code: codeB, countryName: rawB.countryName, data: isPro ? rawB.data : filterFreeYears(rawB.data) }}
            />
          );
        })}
      </div>

      {/* Comparison Table */}
      {freeResults.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Latest Data Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="text-left px-6 py-3 font-medium">Indicator</th>
                  <th className="text-right px-6 py-3 font-medium">
                    <span className="inline-block w-3 h-3 rounded-full bg-blue-600 mr-2 align-middle" />
                    {nameA}
                  </th>
                  <th className="text-right px-6 py-3 font-medium">
                    <span className="inline-block w-3 h-3 rounded-full bg-red-600 mr-2 align-middle" />
                    {nameB}
                  </th>
                </tr>
              </thead>
              <tbody>
                {freeResults.map((result, i) => (
                  <tr key={result.indicator.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-3 text-gray-900 font-medium">{result.indicator.name}</td>
                    <td className="px-6 py-3 text-right text-gray-700">
                      {formatTableValue(getLatestValue(result, codeA), result.indicator.format)}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-700">
                      {formatTableValue(getLatestValue(result, codeB), result.indicator.format)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pro Charts */}
      {proResults.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pro Indicators</h2>
            {!isPro && (
              <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                45 indicators
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {proResults.map((result) => {
              const rawA = result.countries[codeA] || { countryName: nameA, data: [] };
              const rawB = result.countries[codeB] || { countryName: nameB, data: [] };
              return (
                <CompareChart
                  key={result.indicator.id}
                  indicatorName={result.indicator.name}
                  format={result.indicator.format}
                  countryA={{ code: codeA, ...rawA }}
                  countryB={{ code: codeB, ...rawB }}
                  locked={!isPro}
                  onUnlock={() => setShowProModal(true)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Pro CTA (free users only) */}
      {!isPro && (
        <div className="mt-10 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6 sm:p-8 text-center">
          <p className="text-2xl mb-2">&#128274;</p>
          <h3 className="text-xl font-bold text-gray-900">Unlock All 50 Indicators</h3>
          <p className="mt-2 text-sm text-gray-600 max-w-lg mx-auto">
            Get access to Economy, Labor, Society, Energy, and Trade indicators
            with full 25-year historical data (2000&ndash;2024).
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

      <ProModal open={showProModal} onClose={() => setShowProModal(false)} />
    </>
  );
}
