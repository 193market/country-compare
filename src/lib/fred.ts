const FRED_BASE_URL = "https://api.stlouisfed.org/fred";

export const FRED_SERIES: Record<string, string> = {
  FEDFUNDS: "Federal Funds Rate",
  CPIAUCSL: "US CPI (Consumer Price Index)",
  UNRATE: "US Unemployment Rate",
  GDP: "US GDP",
  SP500: "S&P 500",
  GOLDAMGBD228NLBM: "Gold Price",
  MORTGAGE30US: "30-Year Mortgage Rate",
  T10Y2Y: "10Y-2Y Treasury Spread",
};

function getApiKey(): string {
  const key = process.env.FRED_API_KEY;
  if (!key) throw new Error("FRED_API_KEY not configured");
  return key;
}

export async function getFredSeries(
  seriesId: string,
  startDate?: string,
  endDate?: string
): Promise<{ date: string; value: string }[]> {
  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: getApiKey(),
    file_type: "json",
  });
  if (startDate) params.set("observation_start", startDate);
  if (endDate) params.set("observation_end", endDate);

  const res = await fetch(
    `${FRED_BASE_URL}/series/observations?${params.toString()}`
  );
  if (!res.ok) throw new Error(`FRED API error: ${res.status}`);

  const data = await res.json();
  return (data.observations || []).map(
    (obs: { date: string; value: string }) => ({
      date: obs.date,
      value: obs.value,
    })
  );
}

export async function searchFredSeries(
  query: string
): Promise<{ id: string; title: string; frequency: string }[]> {
  const params = new URLSearchParams({
    search_text: query,
    api_key: getApiKey(),
    file_type: "json",
    limit: "10",
  });

  const res = await fetch(
    `${FRED_BASE_URL}/series/search?${params.toString()}`
  );
  if (!res.ok) throw new Error(`FRED search error: ${res.status}`);

  const data = await res.json();
  return (data.seriess || []).map(
    (s: { id: string; title: string; frequency: string }) => ({
      id: s.id,
      title: s.title,
      frequency: s.frequency,
    })
  );
}
