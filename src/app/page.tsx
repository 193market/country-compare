'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { formatTableValue, COUNTRY_COLORS } from '@/components/CompareChart';
import IndicatorSelector from '@/components/IndicatorSelector';
import ProModal from '@/components/ProModal';
import CountrySearch from '@/components/CountrySearch';
import { countryCodeToFlag } from '@/lib/flags';
import { INDICATORS, FREE_INDICATORS, PRO_INDICATORS } from '@/lib/indicators';

const CompareChart = dynamic(() => import('@/components/CompareChart'), { ssr: false });

const MAX_COUNTRIES_FREE = 2;
const MAX_COUNTRIES_PRO = 10;

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

const RECENT_COMPARISONS = [
  { slug: 'united-states-vs-china', codeA: 'US', codeB: 'CN', label: 'United States vs China' },
  { slug: 'south-korea-vs-japan', codeA: 'KR', codeB: 'JP', label: 'South Korea vs Japan' },
  { slug: 'india-vs-brazil', codeA: 'IN', codeB: 'BR', label: 'India vs Brazil' },
  { slug: 'germany-vs-france', codeA: 'DE', codeB: 'FR', label: 'Germany vs France' },
  { slug: 'united-kingdom-vs-germany', codeA: 'GB', codeB: 'DE', label: 'United Kingdom vs Germany' },
  { slug: 'japan-vs-china', codeA: 'JP', codeB: 'CN', label: 'Japan vs China' },
  { slug: 'australia-vs-canada', codeA: 'AU', codeB: 'CA', label: 'Australia vs Canada' },
  { slug: 'united-states-vs-india', codeA: 'US', codeB: 'IN', label: 'United States vs India' },
  { slug: 'south-korea-vs-china', codeA: 'KR', codeB: 'CN', label: 'South Korea vs China' },
  { slug: 'united-states-vs-japan', codeA: 'US', codeB: 'JP', label: 'United States vs Japan' },
  { slug: 'germany-vs-italy', codeA: 'DE', codeB: 'IT', label: 'Germany vs Italy' },
  { slug: 'mexico-vs-brazil', codeA: 'MX', codeB: 'BR', label: 'Mexico vs Brazil' },
  { slug: 'india-vs-china', codeA: 'IN', codeB: 'CN', label: 'India vs China' },
  { slug: 'united-states-vs-south-korea', codeA: 'US', codeB: 'KR', label: 'United States vs South Korea' },
  { slug: 'france-vs-italy', codeA: 'FR', codeB: 'IT', label: 'France vs Italy' },
  { slug: 'singapore-vs-south-korea', codeA: 'SG', codeB: 'KR', label: 'Singapore vs South Korea' },
  { slug: 'japan-vs-india', codeA: 'JP', codeB: 'IN', label: 'Japan vs India' },
  { slug: 'united-kingdom-vs-france', codeA: 'GB', codeB: 'FR', label: 'United Kingdom vs France' },
  { slug: 'australia-vs-new-zealand', codeA: 'AU', codeB: 'NZ', label: 'Australia vs New Zealand' },
  { slug: 'spain-vs-italy', codeA: 'ES', codeB: 'IT', label: 'Spain vs Italy' },
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
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['KR', 'JP']);
  const [results, setResults] = useState<CompareResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [selectedIndicators, setSelectedIndicators] = useState<Set<string>>(
    new Set(FREE_INDICATORS.map((i) => i.id))
  );
  const [isPro, setIsPro] = useState(false);
  const [proChecked, setProChecked] = useState(false);
  const [showProModal, setShowProModal] = useState(false);

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

  const handleAddCountry = () => {
    if (!isPro && selectedCountries.length >= MAX_COUNTRIES_FREE) {
      setShowProModal(true);
      return;
    }
    if (selectedCountries.length >= MAX_COUNTRIES_PRO) return;
    // Pick a default country not already selected
    const available = countries.find((c) => !selectedCountries.includes(c.id));
    if (available) {
      setSelectedCountries((prev) => [...prev, available.id]);
    }
  };

  const handleRemoveCountry = (index: number) => {
    if (selectedCountries.length <= 2) return;
    setSelectedCountries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCountryChange = (index: number, code: string) => {
    setSelectedCountries((prev) => {
      const next = [...prev];
      next[index] = code;
      return next;
    });
  };

  const handleCompare = useCallback(async () => {
    if (selectedCountries.length < 2) return;
    setLoading(true);
    setResults([]);

    const countriesParam = selectedCountries.join(',');
    const freeToFetch = FREE_INDICATORS.filter((i) => selectedIndicators.has(i.id));

    try {
      const freeFetches = freeToFetch.map((ind) =>
        fetch(`/api/compare?countries=${countriesParam}&indicator=${ind.id}`)
          .then((r) => r.json())
          .catch(() => null)
      );

      let proFetches: Promise<CompareResult | null>[] = [];
      if (isPro) {
        const proToFetch = PRO_INDICATORS.filter((i) => selectedIndicators.has(i.id));
        proFetches = proToFetch.map((ind) =>
          fetch(`/api/compare?countries=${countriesParam}&indicator=${ind.id}`)
            .then((r) => r.json())
            .catch(() => null)
        );
      } else {
        const proSample = PRO_INDICATORS.slice(0, 6);
        proFetches = proSample.map((ind) =>
          fetch(`/api/compare?countries=${countriesParam}&indicator=${ind.id}`)
            .then((r) => r.json())
            .catch(() => null)
        );
      }

      const [freeData, proData] = await Promise.all([
        Promise.all(freeFetches),
        Promise.all(proFetches),
      ]);

      const freeResults = freeData.filter((d): d is CompareResult => d !== null && d !== undefined && !('error' in d));
      const proResults = proData
        .filter((d): d is CompareResult => d !== null && d !== undefined && !('error' in d))
        .map((d) => ({ ...d, indicator: { ...d.indicator, tier: 'pro' } }));

      setResults([...freeResults, ...proResults]);
    } finally {
      setLoading(false);
    }
  }, [selectedCountries, selectedIndicators, isPro]);

  const getCountryName = (code: string): string => {
    const fromResults = results[0]?.countries[code]?.countryName;
    if (fromResults) return fromResults;
    return countries.find((c) => c.id === code)?.name || code;
  };

  const getLatestValue = (result: CompareResult, code: string): number | null => {
    const country = result.countries[code];
    if (!country) return null;
    for (let i = country.data.length - 1; i >= 0; i--) {
      if (country.data[i].value !== null) return country.data[i].value;
    }
    return null;
  };

  const handleExportCsv = (rows: CompareResult[]) => {
    if (!isPro) {
      setShowProModal(true);
      return;
    }
    const header = ['Indicator', ...selectedCountries.map(getCountryName)].join(',');
    const lines = rows.map((r) => {
      const vals = selectedCountries.map((code) => getLatestValue(r, code) ?? '');
      return `"${r.indicator.name}",${vals.join(',')}`;
    });
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `countrycompare_${selectedCountries.join('_vs_')}_${new Date().getFullYear()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const buildChartCountries = (result: CompareResult, applyFreeFilter: boolean) => {
    return selectedCountries.map((code, i) => {
      const raw = result.countries[code] || { countryName: getCountryName(code), data: [] };
      return {
        code,
        countryName: raw.countryName,
        data: applyFreeFilter && !isPro ? filterFreeYears(raw.data) : raw.data,
        color: COUNTRY_COLORS[i % COUNTRY_COLORS.length],
      };
    });
  };

  const freeResults = results.filter((r) => r.indicator.tier !== 'pro');
  const proResults = results.filter((r) => r.indicator.tier === 'pro');

  const maxCountries = isPro ? MAX_COUNTRIES_PRO : MAX_COUNTRIES_FREE;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <header className="bg-gradient-to-b from-blue-800 to-white px-4 pt-12 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
          Compare Economies of 200+ Countries
        </h1>
        <p className="mt-3 text-lg text-blue-100">
          Real-time data from the World Bank &middot; 50+ economic indicators
        </p>
      </header>

      <main className="mx-auto max-w-6xl px-4 -mt-8">
        {/* Country Selection */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 sm:p-8">
          <div className="space-y-3">
            {selectedCountries.map((code, index) => (
              <div key={index} className="flex items-end gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0 mb-3"
                  style={{ backgroundColor: COUNTRY_COLORS[index % COUNTRY_COLORS.length] }}
                />
                <div className="flex-1">
                  <CountrySearch
                    label={index === 0 ? 'Countries' : ''}
                    value={code}
                    countries={countries}
                    loading={countriesLoading}
                    onChange={(newCode) => handleCountryChange(index, newCode)}
                  />
                </div>
                {selectedCountries.length > 2 && (
                  <button
                    onClick={() => handleRemoveCountry(index)}
                    className="mb-0.5 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                    title="Remove country"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleAddCountry}
              disabled={countriesLoading || selectedCountries.length >= maxCountries}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-dashed border-gray-300 text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Country
              {!isPro && selectedCountries.length >= MAX_COUNTRIES_FREE && (
                <span className="ml-1 text-xs font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">PRO</span>
              )}
            </button>
            <div className="flex-1" />
            <button
              onClick={handleCompare}
              disabled={loading || countriesLoading || selectedCountries.length < 2}
              className="h-[42px] px-8 rounded-lg bg-blue-700 text-white font-semibold shadow-sm hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {loading ? 'Loading...' : 'Compare'}
            </button>
          </div>

          {selectedCountries.length > 2 && (
            <p className="mt-2 text-xs text-gray-400">
              Comparing {selectedCountries.length} countries &middot; Up to {maxCountries} allowed
            </p>
          )}
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
              {freeResults.map((result) => (
                <CompareChart
                  key={result.indicator.id}
                  indicatorName={result.indicator.name}
                  format={result.indicator.format}
                  countries={buildChartCountries(result, true)}
                  isPro={isPro}
                  onDownload={() => setShowProModal(true)}
                />
              ))}
            </div>

            {/* Comparison Table */}
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Latest Data Comparison</h2>
                <button
                  onClick={() => handleExportCsv(freeResults)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
                  </svg>
                  Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600">
                      <th className="text-left px-6 py-3 font-medium sticky left-0 bg-gray-50 z-10 min-w-[180px]">Indicator</th>
                      {selectedCountries.map((code, i) => (
                        <th key={code} className="text-right px-6 py-3 font-medium whitespace-nowrap min-w-[120px]">
                          <span
                            className="inline-block w-3 h-3 rounded-full mr-2 align-middle"
                            style={{ backgroundColor: COUNTRY_COLORS[i % COUNTRY_COLORS.length] }}
                          />
                          {getCountryName(code)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {freeResults.map((result, i) => (
                      <tr key={result.indicator.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className={`px-6 py-3 text-gray-900 font-medium sticky left-0 z-10 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          {result.indicator.name}
                        </td>
                        {selectedCountries.map((code) => (
                          <td key={code} className="px-6 py-3 text-right text-gray-700 whitespace-nowrap">
                            {formatTableValue(getLatestValue(result, code), result.indicator.format)}
                          </td>
                        ))}
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
              <h2 className="text-lg font-semibold text-gray-900">Pro Indicators</h2>
              {!isPro && (
                <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  45 indicators
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {proResults.map((result) => (
                <CompareChart
                  key={result.indicator.id}
                  indicatorName={result.indicator.name}
                  format={result.indicator.format}
                  countries={buildChartCountries(result, false)}
                  locked={!isPro}
                  onUnlock={() => setShowProModal(true)}
                  isPro={isPro}
                  onDownload={() => setShowProModal(true)}
                />
              ))}
            </div>

            {/* Pro table when unlocked */}
            {isPro && (
              <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Pro Data Comparison</h2>
                  <button
                    onClick={() => handleExportCsv(proResults)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
                    </svg>
                    Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600">
                        <th className="text-left px-6 py-3 font-medium sticky left-0 bg-gray-50 z-10 min-w-[180px]">Indicator</th>
                        {selectedCountries.map((code, i) => (
                          <th key={code} className="text-right px-6 py-3 font-medium whitespace-nowrap min-w-[120px]">
                            <span
                              className="inline-block w-3 h-3 rounded-full mr-2 align-middle"
                              style={{ backgroundColor: COUNTRY_COLORS[i % COUNTRY_COLORS.length] }}
                            />
                            {getCountryName(code)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {proResults.map((result, i) => (
                        <tr key={result.indicator.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className={`px-6 py-3 text-gray-900 font-medium sticky left-0 z-10 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            {result.indicator.name}
                          </td>
                          {selectedCountries.map((code) => (
                            <td key={code} className="px-6 py-3 text-right text-gray-700 whitespace-nowrap">
                              {formatTableValue(getLatestValue(result, code), result.indicator.format)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pro CTA Banner */}
        {!isPro && !loading && results.length > 0 && (
          <div className="mt-10 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6 sm:p-8 text-center">
            <p className="text-2xl mb-2">&#128274;</p>
            <h3 className="text-xl font-bold text-gray-900">Unlock All 50 Indicators &amp; 10-Country Comparison</h3>
            <p className="mt-2 text-sm text-gray-600 max-w-lg mx-auto">
              Compare up to 10 countries at once with 50 economic indicators
              and full 25-year historical data (2000&ndash;2024).
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

        {/* Recent Comparisons by Users */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Comparisons by Users</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {RECENT_COMPARISONS.map((item) => (
              <Link
                key={item.slug}
                href={`/compare/${item.slug}`}
                className="flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition text-gray-700 hover:text-blue-700 text-sm font-medium"
              >
                <span className="text-base leading-none">{countryCodeToFlag(item.codeA)}</span>
                <span className="text-base leading-none">{countryCodeToFlag(item.codeB)}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* How it Works */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Select countries', desc: 'Choose from 200+ countries — up to 10 with Pro' },
              { step: '2', title: 'Compare 50+ indicators', desc: 'GDP, population, trade, energy, and more' },
              { step: '3', title: 'Download reports', desc: 'Export charts and data for your research' },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <div className="mx-auto w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-lg mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust & Stats */}
        <div className="mt-12 mb-4 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">&#9679;</span>
            Trusted data from World Bank
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-600">&#9679;</span>
            1,225+ country comparisons available
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-600">&#9679;</span>
            Updated daily
          </div>
        </div>
      </main>

      <ProModal open={showProModal} onClose={() => setShowProModal(false)} />
    </div>
  );
}
