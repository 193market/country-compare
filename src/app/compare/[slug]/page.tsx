import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { parseCompareSlug, getAllCompareSlugs } from '@/lib/countries';
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

  const { a, b } = parsed;
  const ogUrl = `/api/og?a=${encodeURIComponent(a.name)}&b=${encodeURIComponent(b.name)}&codeA=${a.code}&codeB=${b.code}`;
  return {
    title: `${a.name} vs ${b.name} Economy Comparison | CountryCompare`,
    description: `Compare GDP, population, unemployment, inflation and life expectancy between ${a.name} and ${b.name} with interactive charts and data from World Bank.`,
    openGraph: {
      title: `${a.name} vs ${b.name} Economy Comparison`,
      description: `Compare economic indicators between ${a.name} and ${b.name} with World Bank data.`,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${a.name} vs ${b.name} Economy Comparison`,
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

  const { a, b } = parsed;

  // Fetch free indicators
  const freeResults: CompareResult[] = [];
  for (const ind of FREE_INDICATORS) {
    try {
      const raw = await fetchIndicator([a.code, b.code], ind.id);
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
      const raw = await fetchIndicator([a.code, b.code], ind.id);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-b from-blue-800 to-white px-4 pt-10 pb-14 text-center">
        <Link href="/" className="text-blue-200 hover:text-white text-sm transition">
          &larr; Back to CountryCompare
        </Link>
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-white tracking-tight">
          {a.name} vs {b.name}
        </h1>
        <p className="mt-2 text-lg text-blue-100">
          Economy Comparison (2014&ndash;2024)
        </p>
      </header>

      <main className="mx-auto max-w-6xl px-4 -mt-8">
        <CompareResultsClient
          freeResults={freeResults}
          proResults={proResults}
          codeA={a.code}
          codeB={b.code}
          nameA={a.name}
          nameB={b.name}
        />
      </main>
    </div>
  );
}
