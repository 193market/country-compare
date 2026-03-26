import { MetadataRoute } from 'next';
import { getAllCompareSlugs, COUNTRIES } from '@/lib/countries';

const BASE_URL = 'https://country-compare.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const compareSlugs = getAllCompareSlugs();

  const compareUrls = compareSlugs.map((slug) => ({
    url: `${BASE_URL}/compare/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const countryUrls = COUNTRIES.map((c) => ({
    url: `${BASE_URL}/country/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    ...countryUrls,
    ...compareUrls,
  ];
}
