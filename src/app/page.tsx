'use client';

import { useState, useEffect, useCallback } from 'react';
import CompareChart, { formatTableValue } from '@/components/CompareChart';
import { INDICATORS } from '@/lib/indicators';

interface CountryOption {
  id: string;
  name: string;
}

interface CountryResult {
  countryName: string;
  data: { year: string; value: number | null }[];
}

interface CompareResult {
  indicator: { id: string; name: string; format: string };
  countries: Record<string, CountryResult>;
}

export default function Home() {
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [countryA, setCountryA] = useState('KR');
  const [countryB, setCountryB] = useState('JP');
  const [results, setResults] = useState<CompareResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [countriesLoading, setCountriesLoading] = useState(true);

  useEffect(() => {
    fetch('/api/countries')
      .then((r) => r.json())
      .then((data) => setCountries(data.countries || []))
      .catch(() => {})
      .finally(() => setCountriesLoading(false));
  }, []);

  const handleCompare = useCallback(async () => {
    if (!countryA || !countryB) return;
    setLoading(true);
    setResults([]);

    try {
      const fetches = INDICATORS.map((ind) =>
        fetch(`/api/compare?countries=${countryA},${countryB}&indicator=${ind.id}`)
          .then((r) => r.json())
          .catch(() => null)
      );
      const data = await Promise.all(fetches);
      setResults(data.filter((d): d is CompareResult => d && !d.error));
    } finally {
      setLoading(false);
    }
  }, [countryA, countryB]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-b from-blue-800 to-white px-4 pt-12 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
          CountryCompare
        </h1>
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

        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-700" />
          </div>
        )}

        {/* Charts */}
        {!loading && results.length > 0 && (
          <>
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {results.map((result) => {
                const dataA = result.countries[countryA] || { countryName: nameA, data: [] };
                const dataB = result.countries[countryB] || { countryName: nameB, data: [] };
                return (
                  <CompareChart
                    key={result.indicator.id}
                    indicatorName={result.indicator.name}
                    format={result.indicator.format}
                    countryA={{ code: countryA, ...dataA }}
                    countryB={{ code: countryB, ...dataB }}
                  />
                );
              })}
            </div>

            {/* Comparison Table */}
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Latest Data Comparison
                </h2>
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
                    {results.map((result, i) => (
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
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white py-8 text-center text-sm text-gray-500">
        <p>Data source: World Bank Open Data</p>
        <p className="mt-1">Built by GlobalData Store</p>
      </footer>
    </div>
  );
}
