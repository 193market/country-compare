'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { formatTableValue, COUNTRY_COLORS } from '@/components/CompareChart';
import ProModal from '@/components/ProModal';

const CompareChart = dynamic(() => import('@/components/CompareChart'), { ssr: false });

interface CountryResult {
  countryName: string;
  data: { year: string; value: number | null }[];
}

interface CompareResult {
  indicator: { id: string; name: string; format: string; tier: string };
  countries: Record<string, CountryResult>;
}

interface CountryEntry {
  code: string;
  name: string;
}

interface Props {
  freeResults: CompareResult[];
  proResults: CompareResult[];
  countries: CountryEntry[];
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

export default function CompareResultsClient({ freeResults, proResults, countries }: Props) {
  const [showProModal, setShowProModal] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    fetch('/api/auth/status')
      .then((r) => r.json())
      .then((data) => setIsPro(data.pro === true))
      .catch(() => {});
  }, []);

  const [pdfLoading, setPdfLoading] = useState(false);
  const codes = countries.map((c) => c.code);

  const handleDownloadReport = async () => {
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/report?countries=${codes.join(',')}`);
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CountryCompare_${codes.join('_vs_')}_Report_${new Date().getFullYear()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  const buildChartCountries = (result: CompareResult, applyFreeFilter: boolean) => {
    return countries.map((c, i) => {
      const raw = result.countries[c.code] || { countryName: c.name, data: [] };
      return {
        code: c.code,
        countryName: raw.countryName,
        data: applyFreeFilter && !isPro ? filterFreeYears(raw.data) : raw.data,
        color: COUNTRY_COLORS[i % COUNTRY_COLORS.length],
      };
    });
  };

  const handleExportCsv = (rows: CompareResult[]) => {
    if (!isPro) {
      setShowProModal(true);
      return;
    }
    const header = ['Indicator', ...countries.map((c) => c.name)].join(',');
    const lines = rows.map((r) => {
      const vals = codes.map((code) => getLatestValue(r, code) ?? '');
      return `"${r.indicator.name}",${vals.join(',')}`;
    });
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `countrycompare_${codes.join('_vs_')}_${new Date().getFullYear()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (freeResults.length === 0 && proResults.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500">
        No data available for this comparison.
      </div>
    );
  }

  return (
    <>
      {/* Download Report Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {countries.map((c) => c.name).join(' vs ')}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {isPro ? '50 indicators · 2000–2024' : '5 indicators · 2014–2024'}
          </p>
        </div>
        <button
          onClick={handleDownloadReport}
          disabled={pdfLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-700 text-white font-semibold text-sm shadow-sm hover:bg-blue-800 disabled:opacity-50 transition cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3" />
          </svg>
          {pdfLoading ? 'Generating...' : 'Download Report (PDF)'}
        </button>
      </div>

      {/* Free Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      {freeResults.length > 0 && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Latest Data Comparison</h2>
            <button
              onClick={() => handleExportCsv(freeResults)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
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
                <tr className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  <th className="text-left px-6 py-3 font-medium sticky left-0 bg-gray-50 z-10 min-w-[180px]">Indicator</th>
                  {countries.map((c, i) => (
                    <th key={c.code} className="text-right px-6 py-3 font-medium whitespace-nowrap min-w-[120px]">
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-2 align-middle"
                        style={{ backgroundColor: COUNTRY_COLORS[i % COUNTRY_COLORS.length] }}
                      />
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {freeResults.map((result, i) => (
                  <tr key={result.indicator.id} className={i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                    <td className={`px-6 py-3 text-gray-900 font-medium sticky left-0 z-10 ${i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}`}>
                      {result.indicator.name}
                    </td>
                    {codes.map((code) => (
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

      {/* Pro Charts */}
      {proResults.length > 0 && (
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
        </div>
      )}

      {/* Pro CTA */}
      {!isPro && (
        <div className="mt-10 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-6 sm:p-8 text-center">
          <p className="text-2xl mb-2">&#128274;</p>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Unlock All 50 Indicators &amp; 10-Country Comparison</h3>
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

      <ProModal open={showProModal} onClose={() => setShowProModal(false)} />
    </>
  );
}
