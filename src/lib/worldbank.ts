const BASE_URL = 'https://api.worldbank.org/v2';

// Chat API용 함수 (datalens에서 이식)
export async function getIndicator(
  countryCode: string,
  indicatorId: string,
  startYear?: number,
  endYear?: number
): Promise<{ year: string; value: number | null; country: string }[]> {
  const dateRange = startYear && endYear ? `&date=${startYear}:${endYear}` : '';
  const url = `${BASE_URL}/country/${countryCode}/indicator/${indicatorId}?format=json&per_page=100${dateRange}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`World Bank API error: ${res.status}`);
  const data = await res.json();
  if (!data[1]) return [];
  return data[1]
    .filter((d: { value: number | null }) => d.value !== null)
    .map((d: { date: string; value: number | null; country: { value: string } }) => ({
      year: d.date,
      value: d.value,
      country: d.country.value,
    }))
    .sort((a: { year: string }, b: { year: string }) => parseInt(a.year) - parseInt(b.year));
}

export async function compareCountries(
  countryCodes: string[],
  indicatorId: string,
  startYear?: number,
  endYear?: number
): Promise<Record<string, { year: string; value: number | null; country: string }[]>> {
  const results: Record<string, { year: string; value: number | null; country: string }[]> = {};
  await Promise.all(
    countryCodes.map(async (code) => {
      results[code] = await getIndicator(code, indicatorId, startYear, endYear);
    })
  );
  return results;
}

export interface Country {
  id: string;
  name: string;
}

export interface IndicatorData {
  countryCode: string;
  countryName: string;
  date: string;
  value: number | null;
}

export async function fetchCountries(): Promise<Country[]> {
  const res = await fetch(
    `${BASE_URL}/country?format=json&per_page=300`,
    { next: { revalidate: 86400 } }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch countries: ${res.status}`);
  }

  const json = await res.json();
  const data = json[1];

  if (!Array.isArray(data)) {
    throw new Error('Unexpected response format from World Bank API');
  }

  return data.map((c: { id: string; iso2Code: string; name: string }) => ({
    id: c.iso2Code,
    name: c.name,
  }));
}

export async function fetchIndicator(
  countryCodes: string[],
  indicatorId: string
): Promise<IndicatorData[]> {
  const codes = countryCodes.join(';');
  const res = await fetch(
    `${BASE_URL}/country/${codes}/indicator/${indicatorId}?format=json&date=2000:2024&per_page=500`,
    { next: { revalidate: 86400 } }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch indicator ${indicatorId}: ${res.status}`);
  }

  const json = await res.json();
  const data = json[1];

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(
    (d: { country: { id: string; value: string }; date: string; value: number | null }) => ({
      countryCode: d.country.id,
      countryName: d.country.value,
      date: d.date,
      value: d.value,
    })
  );
}
