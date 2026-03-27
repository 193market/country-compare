/**
 * generate-video.ts
 * Picks 2 random countries, fetches data, generates narration script, calls ElevenLabs TTS
 */

import * as fs from 'fs';
import * as path from 'path';

const WB_BASE_URL = 'https://api.worldbank.org/v2';
const ELEVENLABS_API_KEY = 'sk_6375129fa2e5aab3dd3ac209304a485b9cbdcc620ee5b6d5';
const ELEVENLABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel (default)
const OUTPUT_DIR = path.join(__dirname, 'output');

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
  { id: 'NY.GDP.MKTP.CD', name: 'GDP', format: 'billions' },
  { id: 'SP.POP.TOTL', name: 'population', format: 'millions' },
  { id: 'SL.UEM.TOTL.ZS', name: 'unemployment rate', format: 'percent' },
  { id: 'FP.CPI.TOTL.ZG', name: 'inflation rate', format: 'percent' },
  { id: 'SP.DYN.LE00.IN', name: 'life expectancy', format: 'years' },
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
  const match = data
    .filter((d: any) => d.country?.id === countryCode && d.value !== null)
    .sort((a: any, b: any) => Number(b.date) - Number(a.date));
  if (match.length > 0) return { value: match[0].value, year: match[0].date };
  return { value: null, year: '' };
}

function formatSpoken(value: number | null, format: string): string {
  if (value === null) return 'data not available';
  switch (format) {
    case 'billions': {
      const b = value / 1e9;
      if (b >= 1000) return `${(b / 1000).toFixed(1)} trillion dollars`;
      return `${b.toFixed(0)} billion dollars`;
    }
    case 'millions': {
      const m = value / 1e6;
      if (m >= 1000) return `${(m / 1000).toFixed(1)} billion people`;
      return `${m.toFixed(0)} million people`;
    }
    case 'percent':
      return `${value.toFixed(1)} percent`;
    case 'years':
      return `${value.toFixed(1)} years`;
    default:
      return String(value);
  }
}

function generateScript(
  a: Country,
  b: Country,
  data: { name: string; format: string; vA: number | null; vB: number | null }[]
): string {
  const lines: string[] = [];

  lines.push(`Today we compare ${a.name} and ${b.name}. Two very different economies. Let's look at 5 key indicators.\n`);

  for (const d of data) {
    const spokenA = formatSpoken(d.vA, d.format);
    const spokenB = formatSpoken(d.vB, d.format);

    if (d.name === 'GDP') {
      lines.push(`First, GDP. ${a.name} has a GDP of ${spokenA}, while ${b.name} sits at ${spokenB}.\n`);
    } else if (d.name === 'population') {
      lines.push(`Population wise, ${a.name} has ${spokenA}, compared to ${b.name} with ${spokenB}.\n`);
    } else if (d.name === 'unemployment rate') {
      lines.push(`The unemployment rate in ${a.name} is ${spokenA}, versus ${spokenB} in ${b.name}.\n`);
    } else if (d.name === 'inflation rate') {
      lines.push(`For inflation, ${a.name} is at ${spokenA}, and ${b.name} at ${spokenB}.\n`);
    } else if (d.name === 'life expectancy') {
      lines.push(`Life expectancy in ${a.name} is ${spokenA}, while in ${b.name} it's ${spokenB}.\n`);
    }
  }

  lines.push(`That's ${a.name} versus ${b.name}. For the full interactive comparison with charts and 50 indicators, visit country-compare.com.`);

  return lines.join('');
}

async function generateAudio(text: string, outputPath: string): Promise<void> {
  console.log(`[video] Calling ElevenLabs TTS (${text.length} chars)...`);

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ElevenLabs API error ${res.status}: ${errText}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  console.log(`[video] Audio saved: ${outputPath} (${(buffer.length / 1024).toFixed(0)} KB)`);
}

export async function run(): Promise<{ success: boolean; scriptPath?: string; audioPath?: string; error?: string }> {
  try {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // 1. Pick two random countries
    const [countryA, countryB] = pickTwo();
    console.log(`[video] Selected: ${countryA.name} vs ${countryB.name}`);

    // 2. Fetch data
    const codes = `${countryA.code};${countryB.code}`;
    const indicatorData: { name: string; format: string; vA: number | null; vB: number | null }[] = [];

    for (const ind of INDICATORS) {
      console.log(`[video] Fetching ${ind.name}...`);
      const raw = await fetchIndicator(codes, ind.id);
      const latestA = getLatestValue(raw, countryA.code);
      const latestB = getLatestValue(raw, countryB.code);
      indicatorData.push({
        name: ind.name,
        format: ind.format,
        vA: latestA.value,
        vB: latestB.value,
      });
    }

    // 3. Generate narration script
    const script = generateScript(countryA, countryB, indicatorData);
    const scriptPath = path.join(OUTPUT_DIR, 'narration_script.txt');
    fs.writeFileSync(scriptPath, script, 'utf-8');
    console.log(`[video] Script saved: ${scriptPath}`);
    console.log(`[video] --- Script Preview ---`);
    console.log(script);
    console.log(`[video] --- End Script ---`);

    // 4. Generate audio via ElevenLabs
    const audioPath = path.join(OUTPUT_DIR, 'narration.mp3');
    await generateAudio(script, audioPath);

    return { success: true, scriptPath, audioPath };
  } catch (error: any) {
    console.error(`[video] Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Direct execution
if (require.main === module) {
  run().then((result) => {
    process.exit(result.success ? 0 : 1);
  });
}
