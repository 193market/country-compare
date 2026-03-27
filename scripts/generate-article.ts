/**
 * generate-article.ts
 * Picks 2 random countries, fetches World Bank data, generates a blog post, publishes to Dev.to
 */

const DEVTO_API_KEY = '16M5fLTX8Ee3PKVAqS428W6g';
const DEVTO_API_URL = 'https://dev.to/api/articles';
const WB_BASE_URL = 'https://api.worldbank.org/v2';
const SITE_URL = 'https://country-compare.com';

interface Country {
  slug: string;
  code: string;
  name: string;
}

const COUNTRIES: Country[] = [
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

const INDICATORS = [
  { id: 'NY.GDP.MKTP.CD', name: 'GDP (USD)', format: 'billions' },
  { id: 'SP.POP.TOTL', name: 'Population', format: 'millions' },
  { id: 'SL.UEM.TOTL.ZS', name: 'Unemployment Rate', format: 'percent' },
  { id: 'FP.CPI.TOTL.ZG', name: 'CPI Inflation', format: 'percent' },
  { id: 'SP.DYN.LE00.IN', name: 'Life Expectancy', format: 'years' },
];

function pickTwo(): [Country, Country] {
  const shuffled = [...COUNTRIES].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

async function fetchIndicator(codes: string, indicatorId: string): Promise<any[]> {
  const url = `${WB_BASE_URL}/country/${codes}/indicator/${indicatorId}?format=json&date=2000:2024&per_page=500`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`World Bank API error: ${res.status}`);
  const json: any = await res.json();
  return json[1] || [];
}

function getLatestValue(data: any[], countryCode: string): { value: number | null; year: string } {
  const filtered = data
    .filter((d: any) => d.countryiso3code || d.country?.id === countryCode || d.countryiso2code === countryCode)
    .filter((d: any) => d.value !== null)
    .sort((a: any, b: any) => Number(b.date) - Number(a.date));

  // Try matching by country.id (ISO2)
  const match = data
    .filter((d: any) => d.country?.id === countryCode && d.value !== null)
    .sort((a: any, b: any) => Number(b.date) - Number(a.date));

  if (match.length > 0) {
    return { value: match[0].value, year: match[0].date };
  }
  return { value: null, year: '' };
}

function formatValue(value: number | null, format: string): string {
  if (value === null) return 'N/A';
  switch (format) {
    case 'billions':
      return `$${(value / 1e9).toFixed(1)}B`;
    case 'millions':
      return `${(value / 1e6).toFixed(1)}M`;
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'years':
      return `${value.toFixed(1)} years`;
    default:
      return value.toLocaleString();
  }
}

function generateArticle(
  a: Country,
  b: Country,
  data: { name: string; format: string; valueA: number | null; valueB: number | null; yearA: string; yearB: string }[]
): string {
  const compareUrl = `${SITE_URL}/compare/${a.slug}-vs-${b.slug}`;
  const profileA = `${SITE_URL}/country/${a.slug}`;
  const profileB = `${SITE_URL}/country/${b.slug}`;

  const facts = data.map((d, i) => {
    const vA = formatValue(d.valueA, d.format);
    const vB = formatValue(d.valueB, d.format);

    let analysis = '';
    if (d.valueA !== null && d.valueB !== null && d.valueB !== 0) {
      const ratio = d.valueA / d.valueB;
      if (d.format === 'billions' || d.format === 'millions') {
        if (ratio > 1.5) analysis = `${a.name}'s ${d.name.toLowerCase()} is ${ratio.toFixed(1)}x larger than ${b.name}'s.`;
        else if (ratio < 0.67) analysis = `${b.name}'s ${d.name.toLowerCase()} is ${(1 / ratio).toFixed(1)}x larger than ${a.name}'s.`;
        else analysis = `Both countries have comparable ${d.name.toLowerCase()}.`;
      } else if (d.format === 'percent') {
        const diff = Math.abs(d.valueA - d.valueB);
        if (diff > 5) analysis = `${d.valueA > d.valueB ? a.name : b.name} has a significantly higher ${d.name.toLowerCase()} at ${d.valueA > d.valueB ? vA : vB} vs ${d.valueA > d.valueB ? vB : vA}.`;
        else analysis = `Both countries show similar ${d.name.toLowerCase()} rates — ${a.name} at ${vA} and ${b.name} at ${vB}.`;
      } else {
        analysis = `${a.name} stands at ${vA} while ${b.name} is at ${vB}.`;
      }
    }

    return `### ${i + 1}. ${d.name}\n\n| | ${a.name} | ${b.name} |\n|---|---|---|\n| **${d.name}** | ${vA} (${d.yearA}) | ${vB} (${d.yearB}) |\n\n${analysis}`;
  });

  return `How do ${a.name} and ${b.name} stack up economically? I pulled real data from the World Bank API to find out. Here are 5 facts that might surprise you.

All data comes from the [World Bank Open Data](https://data.worldbank.org/) API — free, no authentication required.

## The Comparison

${facts.join('\n\n')}

## Interactive Charts & More

Want to see 25 years of historical trends for these indicators? Check out the full interactive comparison:

**[${a.name} vs ${b.name} — Full Comparison](${compareUrl})**

You can also explore individual country profiles:
- [${a.name} Economic Profile](${profileA})
- [${b.name} Economic Profile](${profileB})

## About CountryCompare

[CountryCompare](${SITE_URL}) is a free tool I built that lets you compare economic indicators between 200+ countries using World Bank data.

- **50 indicators** across Economy, Labor, Society, Energy, Environment, and Trade
- **Interactive charts** with 25 years of historical data
- **PDF reports** and **CSV exports**
- **1,290 auto-generated comparison pages**
- Built with Next.js, Chart.js, and Tailwind CSS

The free tier lets you compare 2 countries across 5 key indicators. Pro ($9/mo) unlocks all 50 indicators and up to 10-country comparisons.

---

*Data sourced from the World Bank Open Data API. Built with [CountryCompare](${SITE_URL}).*`;
}

export async function run(options: { published?: boolean } = {}): Promise<{ success: boolean; url?: string; error?: string }> {
  const published = options.published ?? true;

  try {
    // 1. Pick two random countries
    const [countryA, countryB] = pickTwo();
    console.log(`[article] Selected: ${countryA.name} vs ${countryB.name}`);

    // 2. Fetch data from World Bank API
    const codes = `${countryA.code};${countryB.code}`;
    const indicatorData: { name: string; format: string; valueA: number | null; valueB: number | null; yearA: string; yearB: string }[] = [];

    for (const ind of INDICATORS) {
      console.log(`[article] Fetching ${ind.name}...`);
      const raw = await fetchIndicator(codes, ind.id);
      const latestA = getLatestValue(raw, countryA.code);
      const latestB = getLatestValue(raw, countryB.code);
      indicatorData.push({
        name: ind.name,
        format: ind.format,
        valueA: latestA.value,
        valueB: latestB.value,
        yearA: latestA.year,
        yearB: latestB.year,
      });
    }

    // 3. Generate article
    const title = `${countryA.name} vs ${countryB.name}: 5 Economic Facts You Didn't Know`;
    const body = generateArticle(countryA, countryB, indicatorData);

    console.log(`[article] Generated: "${title}"`);
    console.log(`[article] Publishing (published=${published})...`);

    // 4. Publish to Dev.to
    const res = await fetch(DEVTO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': DEVTO_API_KEY,
      },
      body: JSON.stringify({
        article: {
          title,
          published,
          tags: ['webdev', 'data', 'opensource', 'showdev'],
          body_markdown: body,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Dev.to API error ${res.status}: ${errText}`);
    }

    const result: any = await res.json();
    const url = result.url;
    console.log(`[article] Published: ${url}`);
    return { success: true, url };
  } catch (error: any) {
    console.error(`[article] Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Direct execution
if (require.main === module) {
  // When run directly, check for --draft flag
  const isDraft = process.argv.includes('--draft');
  run({ published: !isDraft }).then((result) => {
    process.exit(result.success ? 0 : 1);
  });
}
