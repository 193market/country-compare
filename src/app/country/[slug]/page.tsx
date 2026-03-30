import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { COUNTRIES, findCountryBySlug } from '@/lib/countries';
import { countryCodeToFlag } from '@/lib/flags';
import { fetchIndicator } from '@/lib/worldbank';
import { FREE_INDICATORS, PRO_INDICATORS } from '@/lib/indicators';
import CountryProfileClient from './CountryProfileClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const KEY_STAT_INDICATORS = [
  { id: 'NY.GDP.MKTP.CD', label: 'GDP', format: 'billions' },
  { id: 'SP.POP.TOTL', label: 'Population', format: 'millions' },
  { id: 'SL.UEM.TOTL.ZS', label: 'Unemployment', format: 'percent' },
  { id: 'SP.DYN.LE00.IN', label: 'Life Expectancy', format: 'number' },
];

const POPULAR_PARTNERS = ['US', 'CN', 'JP', 'DE', 'GB', 'IN', 'FR', 'BR', 'KR', 'AU'];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const country = findCountryBySlug(slug);
  if (!country) return { title: 'Not Found' };

  const ogUrl = `/api/og?a=${encodeURIComponent(country.name)}&b=World&codeA=${country.code}&codeB=WD`;
  return {
    title: `${country.name} Economy - GDP, Population & Key Indicators | CountryCompare`,
    description: `Explore ${country.name}'s economic profile with GDP, population, unemployment rate, and 50+ indicators. Data from World Bank.`,
    openGraph: {
      title: `${country.name} Economic Profile`,
      description: `Explore ${country.name}'s economy with 50+ indicators from World Bank data.`,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${country.name} Economic Profile`,
      images: [ogUrl],
    },
  };
}

export const dynamicParams = true;
export const revalidate = 86400; // 24시간 캐시

export function generateStaticParams() {
  // 주요 국가 15개만 빌드 시 사전 생성, 나머지는 첫 방문 시 ISR
  const popular = [
    'united-states', 'china', 'japan', 'south-korea', 'india',
    'germany', 'united-kingdom', 'france', 'brazil', 'canada',
    'australia', 'singapore', 'netherlands', 'sweden', 'norway',
  ];
  return popular.map((slug) => ({ slug }));
}

export default async function CountryProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const country = findCountryBySlug(slug);
  if (!country) notFound();

  const flag = countryCodeToFlag(country.code);

  // Fetch free indicators
  const freeIndicators: { id: string; name: string; format: string; tier: string; data: { year: string; value: number | null }[] }[] = [];
  for (const ind of FREE_INDICATORS) {
    try {
      const raw = await fetchIndicator([country.code], ind.id);
      const data = raw
        .filter((r) => r.countryCode === country.code)
        .map((r) => ({ year: r.date, value: r.value }))
        .sort((a, b) => a.year.localeCompare(b.year));
      freeIndicators.push({ id: ind.id, name: ind.name, format: ind.format, tier: 'free', data });
    } catch {
      // skip
    }
  }

  // Fetch pro sample indicators (blurred)
  const proSample = PRO_INDICATORS.slice(0, 6);
  const proIndicators: typeof freeIndicators = [];
  for (const ind of proSample) {
    try {
      const raw = await fetchIndicator([country.code], ind.id);
      const data = raw
        .filter((r) => r.countryCode === country.code)
        .map((r) => ({ year: r.date, value: r.value }))
        .sort((a, b) => a.year.localeCompare(b.year));
      proIndicators.push({ id: ind.id, name: ind.name, format: ind.format, tier: 'pro', data });
    } catch {
      // skip
    }
  }

  // Build key stats
  const keyStats = KEY_STAT_INDICATORS.map((stat) => {
    const ind = freeIndicators.find((f) => f.id === stat.id);
    if (!ind || ind.data.length === 0) {
      return { label: stat.label, value: null, prevValue: null, format: stat.format };
    }
    const withValues = ind.data.filter((d) => d.value !== null);
    const latest = withValues.length > 0 ? withValues[withValues.length - 1].value : null;
    const prev = withValues.length > 1 ? withValues[withValues.length - 2].value : null;
    return { label: stat.label, value: latest, prevValue: prev, format: stat.format };
  });

  // Build comparison links
  const partners = POPULAR_PARTNERS.filter((c) => c !== country.code).slice(0, 6);
  const comparisonLinks = partners.map((partnerCode) => {
    const partner = COUNTRIES.find((c) => c.code === partnerCode);
    if (!partner) return null;
    return {
      slug: `${country.slug}-vs-${partner.slug}`,
      name: partner.name,
      flag: countryCodeToFlag(partner.code),
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="bg-gradient-to-b from-blue-800 to-white dark:from-blue-900 dark:to-gray-900 px-4 pt-10 pb-14 text-center">
        <Link href="/" className="text-blue-200 hover:text-white text-sm transition">
          &larr; Back to CountryCompare
        </Link>
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-white tracking-tight">
          <span className="mr-3 text-4xl sm:text-5xl">{flag}</span>
          {country.name}
        </h1>
        <p className="mt-2 text-lg text-blue-100">Economic Profile</p>
      </header>

      <main className="mx-auto max-w-6xl px-4 -mt-8">
        <CountryProfileClient
          countryCode={country.code}
          countryName={country.name}
          countryFlag={flag}
          freeIndicators={freeIndicators}
          proIndicators={proIndicators}
          keyStats={keyStats}
          comparisonLinks={comparisonLinks}
        />
      </main>
    </div>
  );
}
