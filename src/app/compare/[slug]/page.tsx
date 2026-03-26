import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { parseCompareSlug, getAllCompareSlugs, getRelatedComparisons } from '@/lib/countries';
import { countryCodeToFlag } from '@/lib/flags';
import { fetchIndicator } from '@/lib/worldbank';
import { FREE_INDICATORS, PRO_INDICATORS } from '@/lib/indicators';
import CompareResultsClient from './CompareResultsClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseCompareSlug(slug);
  if (!parsed) return { title: 'Not Found' };

  const names = parsed.map((c) => c.name);
  const title = names.join(' vs ');
  const ogUrl = `/api/og?a=${encodeURIComponent(parsed[0].name)}&b=${encodeURIComponent(parsed[1].name)}&codeA=${parsed[0].code}&codeB=${parsed[1].code}`;

  return {
    title: `${title} Economy Comparison | CountryCompare`,
    description: `Compare GDP, population, unemployment, inflation and life expectancy between ${names.join(', ')} with interactive charts and data from World Bank.`,
    openGraph: {
      title: `${title} Economy Comparison`,
      description: `Compare economic indicators between ${names.join(', ')} with World Bank data.`,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} Economy Comparison`,
      images: [ogUrl],
    },
  };
}

export function generateStaticParams() {
  return getAllCompareSlugs().map((slug) => ({ slug }));
}

interface CountryResult {
  countryName: string;
  data: { year: string; value: number | null }[];
}

interface CompareResult {
  indicator: { id: string; name: string; format: string; tier: string };
  countries: Record<string, CountryResult>;
}

export default async function ComparePage({ params }: PageProps) {
  const { slug } = await params;
  const parsed = parseCompareSlug(slug);
  if (!parsed) notFound();

  const countryCodes = parsed.map((c) => c.code);
  const relatedComparisons = getRelatedComparisons(parsed[0], parsed[1], 6);
  const title = parsed.map((c) => c.name).join(' vs ');
  const yearRange = parsed.length > 2 ? '2000\u20132024' : '2014\u20132024';

  // Fetch free indicators
  const freeResults: CompareResult[] = [];
  for (const ind of FREE_INDICATORS) {
    try {
      const raw = await fetchIndicator(countryCodes, ind.id);
      const grouped: Record<string, CountryResult> = {};
      for (const item of raw) {
        if (!grouped[item.countryCode]) {
          grouped[item.countryCode] = { countryName: item.countryName, data: [] };
        }
        grouped[item.countryCode].data.push({ year: item.date, value: item.value });
      }
      for (const code of Object.keys(grouped)) {
        grouped[code].data.sort((x, y) => x.year.localeCompare(y.year));
      }
      freeResults.push({
        indicator: { id: ind.id, name: ind.name, format: ind.format, tier: 'free' },
        countries: grouped,
      });
    } catch {
      // skip
    }
  }

  // Fetch a sample of pro indicators for locked preview
  const proSample = PRO_INDICATORS.slice(0, 6);
  const proResults: CompareResult[] = [];
  for (const ind of proSample) {
    try {
      const raw = await fetchIndicator(countryCodes, ind.id);
      const grouped: Record<string, CountryResult> = {};
      for (const item of raw) {
        if (!grouped[item.countryCode]) {
          grouped[item.countryCode] = { countryName: item.countryName, data: [] };
        }
        grouped[item.countryCode].data.push({ year: item.date, value: item.value });
      }
      for (const code of Object.keys(grouped)) {
        grouped[code].data.sort((x, y) => x.year.localeCompare(y.year));
      }
      proResults.push({
        indicator: { id: ind.id, name: ind.name, format: ind.format, tier: 'pro' },
        countries: grouped,
      });
    } catch {
      // skip
    }
  }

  const countryEntries = parsed.map((c) => ({ code: c.code, name: c.name }));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-b from-blue-800 to-white px-4 pt-10 pb-14 text-center">
        <Link href="/" className="text-blue-200 hover:text-white text-sm transition">
          &larr; Back to CountryCompare
        </Link>
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-white tracking-tight">
          {title}
        </h1>
        <p className="mt-2 text-lg text-blue-100">
          Economy Comparison ({yearRange})
        </p>
      </header>

      <main className="mx-auto max-w-6xl px-4 -mt-8">
        <CompareResultsClient
          freeResults={freeResults}
          proResults={proResults}
          countries={countryEntries}
        />
        {/* Related Comparisons */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Related Comparisons</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {relatedComparisons.map((item) => (
              <Link
                key={item.slug}
                href={`/compare/${item.slug}`}
                className="flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition text-gray-700 hover:text-blue-700 text-sm font-medium"
              >
                <span className="text-base leading-none">{countryCodeToFlag(item.codeA)}</span>
                <span className="text-base leading-none">{countryCodeToFlag(item.codeB)}</span>
                {item.nameA} vs {item.nameB}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
