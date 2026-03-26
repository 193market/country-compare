import { MetadataRoute } from 'next';
import { getAllCompareSlugs } from '@/lib/countries';

const BASE_URL = 'https://country-compare-wheat.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const compareSlugs = getAllCompareSlugs();

  const compareUrls = compareSlugs.map((slug) => ({
    url: `${BASE_URL}/compare/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    ...compareUrls,
  ];
}
