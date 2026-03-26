export interface CountryInfo {
  slug: string;
  code: string;
  name: string;
}

export const COUNTRIES: CountryInfo[] = [
  { slug: 'united-states', code: 'US', name: 'United States' },
  { slug: 'china', code: 'CN', name: 'China' },
  { slug: 'japan', code: 'JP', name: 'Japan' },
  { slug: 'south-korea', code: 'KR', name: 'South Korea' },
  { slug: 'india', code: 'IN', name: 'India' },
  { slug: 'united-kingdom', code: 'GB', name: 'United Kingdom' },
  { slug: 'germany', code: 'DE', name: 'Germany' },
  { slug: 'france', code: 'FR', name: 'France' },
  { slug: 'brazil', code: 'BR', name: 'Brazil' },
  { slug: 'canada', code: 'CA', name: 'Canada' },
  { slug: 'australia', code: 'AU', name: 'Australia' },
  { slug: 'russia', code: 'RU', name: 'Russia' },
  { slug: 'mexico', code: 'MX', name: 'Mexico' },
  { slug: 'indonesia', code: 'ID', name: 'Indonesia' },
  { slug: 'turkey', code: 'TR', name: 'Turkey' },
  { slug: 'saudi-arabia', code: 'SA', name: 'Saudi Arabia' },
  { slug: 'italy', code: 'IT', name: 'Italy' },
  { slug: 'spain', code: 'ES', name: 'Spain' },
  { slug: 'netherlands', code: 'NL', name: 'Netherlands' },
  { slug: 'switzerland', code: 'CH', name: 'Switzerland' },
  { slug: 'poland', code: 'PL', name: 'Poland' },
  { slug: 'sweden', code: 'SE', name: 'Sweden' },
  { slug: 'norway', code: 'NO', name: 'Norway' },
  { slug: 'thailand', code: 'TH', name: 'Thailand' },
  { slug: 'vietnam', code: 'VN', name: 'Vietnam' },
  { slug: 'malaysia', code: 'MY', name: 'Malaysia' },
  { slug: 'philippines', code: 'PH', name: 'Philippines' },
  { slug: 'singapore', code: 'SG', name: 'Singapore' },
  { slug: 'israel', code: 'IL', name: 'Israel' },
  { slug: 'egypt', code: 'EG', name: 'Egypt' },
  { slug: 'south-africa', code: 'ZA', name: 'South Africa' },
  { slug: 'nigeria', code: 'NG', name: 'Nigeria' },
  { slug: 'argentina', code: 'AR', name: 'Argentina' },
  { slug: 'colombia', code: 'CO', name: 'Colombia' },
  { slug: 'chile', code: 'CL', name: 'Chile' },
  { slug: 'peru', code: 'PE', name: 'Peru' },
  { slug: 'pakistan', code: 'PK', name: 'Pakistan' },
  { slug: 'bangladesh', code: 'BD', name: 'Bangladesh' },
  { slug: 'new-zealand', code: 'NZ', name: 'New Zealand' },
  { slug: 'ireland', code: 'IE', name: 'Ireland' },
  { slug: 'denmark', code: 'DK', name: 'Denmark' },
  { slug: 'finland', code: 'FI', name: 'Finland' },
  { slug: 'belgium', code: 'BE', name: 'Belgium' },
  { slug: 'austria', code: 'AT', name: 'Austria' },
  { slug: 'portugal', code: 'PT', name: 'Portugal' },
  { slug: 'czechia', code: 'CZ', name: 'Czechia' },
  { slug: 'greece', code: 'GR', name: 'Greece' },
  { slug: 'hungary', code: 'HU', name: 'Hungary' },
  { slug: 'romania', code: 'RO', name: 'Romania' },
  { slug: 'ukraine', code: 'UA', name: 'Ukraine' },
];

export function findCountryBySlug(slug: string): CountryInfo | undefined {
  return COUNTRIES.find((c) => c.slug === slug);
}

export function parseCompareSlug(slug: string): { a: CountryInfo; b: CountryInfo } | null {
  const parts = slug.split('-vs-');
  if (parts.length !== 2) return null;

  const a = findCountryBySlug(parts[0]);
  const b = findCountryBySlug(parts[1]);

  if (!a || !b) return null;
  return { a, b };
}

export function getAllCompareSlugs(): string[] {
  const slugs: string[] = [];
  for (let i = 0; i < COUNTRIES.length; i++) {
    for (let j = i + 1; j < COUNTRIES.length; j++) {
      slugs.push(`${COUNTRIES[i].slug}-vs-${COUNTRIES[j].slug}`);
    }
  }
  return slugs;
}
