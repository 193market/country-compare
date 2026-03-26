'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import CompareChart, { formatTableValue } from '@/components/CompareChart';
import IndicatorSelector from '@/components/IndicatorSelector';
import ProModal from '@/components/ProModal';
import { INDICATORS, FREE_INDICATORS, PRO_INDICATORS } from '@/lib/indicators';

const POPULAR_COMPARISONS = [
  { slug: 'south-korea-vs-japan', label: 'South Korea vs Japan' },
  { slug: 'united-states-vs-china', label: 'United States vs China' },
  { slug: 'india-vs-brazil', label: 'India vs Brazil' },
  { slug: 'germany-vs-france', label: 'Germany vs France' },
  { slug: 'united-kingdom-vs-germany', label: 'United Kingdom vs Germany' },
  { slug: 'australia-vs-canada', label: 'Australia vs Canada' },
  { slug: 'japan-vs-china', label: 'Japan vs China' },
  { slug: 'united-states-vs-united-kingdom', label: 'United States vs United Kingdom' },
  { slug: 'singapore-vs-south-korea', label: 'Singapore vs South Korea' },
  { slug: 'mexico-vs-brazil', label: 'Mexico vs Brazil' },
];

interface CountryOption {
  id: string;
  name: string;
}

interface CountryResult {
  countryName: string;
  data: { year: string; value: number | null }[];
}

interface CompareResult {
  indicator: { id: string; name: string; format: string; tier?: string };
  countries: Record<string, CountryResult>;
}

const FREE_YEAR_START = 2014;

function filterFreeYears(data: { year: string; value: number | null }[]) {
  return data.filter((d) => parseInt(d.year) >= FREE_YEAR_START);
}

export default function Home() {
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [countryA, setCountryA] = useState('KR');
  const [countryB, setCountryB] = useState('JP');
  const [results, setResults] = useState<CompareResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [selectedIndicators, setSelectedIndicators] = useState<Set<string>>(
    new Set(FREE_INDICATORS.map((i) => i.id))
  );
  const [isPro, setIsPro] = useState(false);
  const [proChecked, setProChecked] = useState(false);
  const [showProModal, setShowProModal] = useState(false);

  // Check Pro status on mount
  useEffect(() => {
    fetch('/api/auth/status')
      .then((r) => r.json())
      .then((data) => setIsPro(data.pro === true))
      .catch(() => {})
      .finally(() => setProChecked(true));
  }, []);

  useEffect(() => {
    fetch('/api/countries')
      .then((r) => r.json())
      .then((data) => setCountries(data.countries || []))
      .catch(() => {})
      .finally(() => setCountriesLoading(false));
  }, []);

  // If Pro, select all indicators
  useEffect(() => {
    if (isPro && proChecked) {
      setSelectedIndicators(new Set(INDICATORS.map((i) => i.id)));
    }
  }, [isPro, proChecked]);

  const handleToggleIndicator = useCallback((id: string) => {
    setSelectedIndicators((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleCompare = useCallback(async () => {
    if (!countryA || !countryB) return;
    setLoading(true);
    setResults([]);

    const freeToFetch = FREE_INDICATORS.filter((i) => selectedIndicators.has(i.id));

    try {
      const freeFetches = freeToFetch.map((ind) =>
        fetch(`/api/compare?countries=${countryA},${countryB}&indicator=${ind.id}`)
          .then((r) => r.json())
          .catch(() => null)
      );

      let proFetches: Promise<CompareResult | null>[] = [];
      if (isPro) {
        // Pro: fetch all selected pro indicators
        const proToFetch = PRO_INDICATORS.filter((i) => selectedIndicators.has(i.id));
        proFetches = proToFetch.map((ind) =>
          fetch(`/api/compare?countries=${countryA},${countryB}&indicator=${ind.id}`)
            .then((r) => r.json())
            .catch(() => null)
        );
      } else {
        // Free: fetch 6 pro samples for locked preview
        const proSample = PRO_INDICATORS.slice(0, 6);
        proFetches = proSample.map((ind) =>
          fetch(`/api/compare?countries=${countryA},${countryB}&indicator=${ind.id}`)
            .then((r) => r.json())
            .catch(() => null)
        );
      }

      const [freeData, proData] = await Promise.all([
        Promise.all(freeFetches),
        Promise.all(proFetches),
      ]);

      const freeResults = freeData.filter((d): d is CompareResult => d && !d.error);
      const proResults = proData
        .filter((d): d is CompareResult => d && !d.error)
        .map((d) => ({ ...d, indicator: { ...d.indicator, tier: 'pro' } }));

      setResults([...freeResults, ...proResults]);
    } finally {
      setLoading(false);
    }
  }, [countryA, countryB, selectedIndicators, isPro]);

  const getLatestValue = (result: CompareResult, code: string): number | null => {
    const country = result.countries[code];
    if (!country) return null;
    for (let i = country.data.length - 1; i >= 0; i--) {
      if (country.data[i].value !== null) return country.data[i].value;
    }
    return null;
  };

  const nameA = results[0]?.countries[countryA]?.countryName
    || countries.find((c) => c.id === countryA)?.name
    || countryA;
  const nameB = results[0]?.countries[countryB]?.countryName
    || countries.find((c) => c.id === countryB)?.name
    || countryB;

  const freeResults = results.filter((r) => r.indicator.tier !== 'pro');
  const proResults = results.filter((r) => r.indicator.tier === 'pro');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-b from-blue-800 to-white px-4 pt-12 pb-16 text-center">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            CountryCompare
          </h1>
          {isPro && (
            <span className="px-2.5 py-1 bg-amber-400 text-amber-900 text-xs font-bold rounded-full shadow">
              PRO
            </span>
          )}
        </div>
        <p className="mt-3 text-lg text-blue-100">
          Compare economies of 200+ countries
        </p>
      </header>

      <main className="mx-auto max-w-6xl px-4 -mt-8">
        {/* Country Selection */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country A</label>
              <select
                value={countryA}
                onChange={(e) => setCountryA(e.target.value)}
                disabled={countriesLoading}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
              >
                {countriesLoading ? (
                  <option>Loading...</option>
                ) : (
                  countries.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country B</label>
              <select
                value={countryB}
                onChange={(e) => setCountryB(e.target.value)}
                disabled={countriesLoading}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
              >
                {countriesLoading ? (
                  <option>Loading...</option>
                ) : (
                  countries.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))
                )}
              </select>
            </div>
            <button
              onClick={handleCompare}
              disabled={loading || countriesLoading}
              className="h-[42px] px-8 rounded-lg bg-blue-700 text-white font-semibold shadow-sm hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {loading ? 'Loading...' : 'Compare'}
            </button>
          </div>
        </div>

        {/* Indicator Selector */}
        <div className="mt-6">
          <IndicatorSelector selected={selectedIndicators} onToggle={handleToggleIndicator} isPro={isPro} onProClick={() => setShowProModal(true)} />
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-700" />
          </div>
        )}

        {/* Free Charts */}
        {!loading && freeResults.length > 0 && (
          <>
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {freeResults.map((result) => {
                const rawA = result.countries[countryA] || { countryName: nameA, data: [] };
                const rawB = result.countries[countryB] || { countryName: nameB, data: [] };
                return (
                  <CompareChart
                    key={result.indicator.id}
                    indicatorName={result.indicator.name}
                    format={result.indicator.format}
                    countryA={{ code: countryA, countryName: rawA.countryName, data: isPro ? rawA.data : filterFreeYears(rawA.data) }}
                    countryB={{ code: countryB, countryName: rawB.countryName, data: isPro ? rawB.data : filterFreeYears(rawB.data) }}
                  />
                );
              })}
            </div>

            {/* Comparison Table */}
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
                          {formatTableValue(getLatestValue(result, countryA), result.indicator.format)}
                        </td>
                        <td className="px-6 py-3 text-right text-gray-700">
                          {formatTableValue(getLatestValue(result, countryB), result.indicator.format)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Pro Charts */}
        {!loading && proResults.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {isPro ? 'Pro Indicators' : 'Pro Indicators'}
              </h2>
              {!isPro && (
                <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  45 indicators
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {proResults.map((result) => {
                const rawA = result.countries[countryA] || { countryName: nameA, data: [] };
                const rawB = result.countries[countryB] || { countryName: nameB, data: [] };
                return (
                  <CompareChart
                    key={result.indicator.id}
                    indicatorName={result.indicator.name}
                    format={result.indicator.format}
                    countryA={{ code: countryA, ...rawA }}
                    countryB={{ code: countryB, ...rawB }}
                    locked={!isPro}
                    onUnlock={() => setShowProModal(true)}
                  />
                );
              })}
            </div>

            {/* Pro table when unlocked */}
            {isPro && (
              <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Pro Data Comparison</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600">
                        <th className="text-left px-6 py-3 font-medium">Indicator</th>
                        <th className="text-right px-6 py-3 font-medium">{nameA}</th>
                        <th className="text-right px-6 py-3 font-medium">{nameB}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proResults.map((result, i) => (
                        <tr key={result.indicator.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-3 text-gray-900 font-medium">{result.indicator.name}</td>
                          <td className="px-6 py-3 text-right text-gray-700">
                            {formatTableValue(getLatestValue(result, countryA), result.indicator.format)}
                          </td>
                          <td className="px-6 py-3 text-right text-gray-700">
                            {formatTableValue(getLatestValue(result, countryB), result.indicator.format)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pro CTA Banner (only for free users) */}
        {!isPro && !loading && results.length > 0 && (
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

        {/* Popular Comparisons */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Comparisons</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {POPULAR_COMPARISONS.map((item) => (
              <Link
                key={item.slug}
                href={`/compare/${item.slug}`}
                className="flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition text-gray-700 hover:text-blue-700 text-sm font-medium"
              >
                <span className="text-blue-500">&rarr;</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white py-8 text-center text-sm text-gray-500">
        <p>Data source: World Bank Open Data</p>
        <p className="mt-1">Built by GlobalData Store</p>
      </footer>

      {/* Pro Modal */}
      <ProModal open={showProModal} onClose={() => setShowProModal(false)} />
    </div>
  );
}
