const BASE_URL = 'https://api.worldbank.org/v2';

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
