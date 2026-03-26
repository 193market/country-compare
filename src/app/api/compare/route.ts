import { NextRequest, NextResponse } from 'next/server';
import { fetchIndicator } from '@/lib/worldbank';
import { INDICATORS } from '@/lib/indicators';

export const revalidate = 86400;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const countriesParam = searchParams.get('countries');
  const indicatorParam = searchParams.get('indicator');

  if (!countriesParam || !indicatorParam) {
    return NextResponse.json(
      { error: 'Missing required parameters: countries, indicator' },
      { status: 400 }
    );
  }

  const countryCodes = countriesParam.split(',').map((c) => c.trim().toUpperCase());
  const indicator = INDICATORS.find((i) => i.id === indicatorParam);

  if (!indicator) {
    return NextResponse.json(
      { error: `Unknown indicator: ${indicatorParam}`, available: INDICATORS.map((i) => i.id) },
      { status: 400 }
    );
  }

  try {
    const raw = await fetchIndicator(countryCodes, indicatorParam);

    // Group by country
    const grouped: Record<string, { countryName: string; data: { year: string; value: number | null }[] }> = {};

    for (const item of raw) {
      if (!grouped[item.countryCode]) {
        grouped[item.countryCode] = { countryName: item.countryName, data: [] };
      }
      grouped[item.countryCode].data.push({ year: item.date, value: item.value });
    }

    // Sort each country's data by year ascending
    for (const code of Object.keys(grouped)) {
      grouped[code].data.sort((a, b) => a.year.localeCompare(b.year));
    }

    return NextResponse.json({
      indicator: { id: indicator.id, name: indicator.name, format: indicator.format },
      countries: grouped,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
