import { NextResponse } from 'next/server';
import { fetchCountries } from '@/lib/worldbank';

export const revalidate = 86400;

export async function GET() {
  try {
    const countries = await fetchCountries();
    const sorted = countries.sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ countries: sorted });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
