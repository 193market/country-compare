import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  const upper = code.toUpperCase();
  const offset = 0x1F1E6 - 65;
  return String.fromCodePoint(upper.charCodeAt(0) + offset, upper.charCodeAt(1) + offset);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const nameA = searchParams.get('a') || 'Country A';
  const nameB = searchParams.get('b') || 'Country B';
  const codeA = searchParams.get('codeA') || '';
  const codeB = searchParams.get('codeB') || '';

  const flagA = countryCodeToFlag(codeA);
  const flagB = countryCodeToFlag(codeB);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 40,
          }}
        >
          <span style={{ fontSize: 32, color: '#93c5fd', fontWeight: 600 }}>
            CountryCompare
          </span>
        </div>

        {/* Countries */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 40,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 80 }}>{flagA}</span>
            <span style={{ fontSize: 36, color: 'white', fontWeight: 700 }}>{nameA}</span>
          </div>

          <span
            style={{
              fontSize: 48,
              color: '#fbbf24',
              fontWeight: 700,
            }}
          >
            vs
          </span>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 80 }}>{flagB}</span>
            <span style={{ fontSize: 36, color: 'white', fontWeight: 700 }}>{nameB}</span>
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            marginTop: 40,
          }}
        >
          <span style={{ fontSize: 22, color: '#bfdbfe' }}>
            Economy Comparison &middot; 50+ Indicators &middot; World Bank Data
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
