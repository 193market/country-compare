/**
 * generate-video.ts
 * Picks 2 random countries, fetches World Bank data, generates narration script,
 * calls TopView AI API to create a video, downloads the result.
 */

import * as fs from 'fs';
import * as path from 'path';

const WB_BASE_URL = 'https://api.worldbank.org/v2';
const TOPVIEW_API_KEY = process.env.TOPVIEW_API_KEY || 'sk-5vXmUaBSD8HsTpRObkgUNNUUZU9c-X3kjS2pE0m2BpY';
const TOPVIEW_UID = process.env.TOPVIEW_UID || 'PEIwqZJbzzjWChXaVDWo';
const TOPVIEW_BASE = 'https://api.topview.ai/v1';
const OUTPUT_DIR = path.join(__dirname, 'output');

const POLL_INTERVAL_MS = 15_000; // 15 seconds
const MAX_POLL_MINUTES = 20;

interface Country {
  slug: string;
  code: string;
  name: string;
}

export const COUNTRIES: Country[] = [
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

export function pickTwo(): [Country, Country] {
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

export interface IndicatorData {
  name: string;
  format: string;
  vA: number | null;
  vB: number | null;
}

export function generateScript(a: Country, b: Country, data: IndicatorData[]): string {
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

export async function fetchCountryData(countryA: Country, countryB: Country): Promise<IndicatorData[]> {
  const codes = `${countryA.code};${countryB.code}`;
  const indicatorData: IndicatorData[] = [];

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

  return indicatorData;
}

// ──────────────────────────────────────────────
// TopView AI Integration (Video Avatar API)
// ──────────────────────────────────────────────

function topviewHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOPVIEW_API_KEY}`,
    'Topview-Uid': TOPVIEW_UID,
  };
}

async function submitVideoAvatarTask(script: string): Promise<string> {
  console.log('[video] Submitting Video Avatar task to TopView AI...');

  const body = {
    avatarSourceFrom: '1',   // default AI avatar
    aiAvatarId: '3327',      // default avatar
    audioSourceFrom: '1',    // text-to-speech
    ttsText: script,
    voiceSpeed: 1,
    modeType: '2',           // avatar4 (high quality)
  };

  const res = await fetch(`${TOPVIEW_BASE}/video_avatar/task/submit`, {
    method: 'POST',
    headers: topviewHeaders(),
    body: JSON.stringify(body),
  });

  const json: any = await res.json();
  console.log(`[video] Submit response: ${JSON.stringify(json)}`);

  if (!res.ok || (json.code !== '200' && json.code !== '0')) {
    throw new Error(`TopView submit error: ${JSON.stringify(json)}`);
  }

  const taskId = json.result?.taskId;
  if (!taskId) throw new Error(`TopView: no taskId in response: ${JSON.stringify(json)}`);

  console.log(`[video] TopView task submitted: ${taskId}`);
  return taskId;
}

interface TopViewQueryResult {
  status: string;
  videoUrl?: string;
}

async function queryVideoAvatarTask(taskId: string): Promise<TopViewQueryResult> {
  const res = await fetch(`${TOPVIEW_BASE}/video_avatar/task/query?taskId=${taskId}`, {
    method: 'GET',
    headers: topviewHeaders(),
  });

  const json: any = await res.json();
  if (!res.ok || (json.code !== '200' && json.code !== '0')) {
    throw new Error(`TopView query error: ${JSON.stringify(json)}`);
  }

  const result = json.result;
  const status = result?.status;

  if (status === 'fail' || status === 'error') {
    console.error(`[video] TopView task failed: ${result?.errorMsg || 'unknown error'}`);
    console.error(`[video] Full response:\n${JSON.stringify(result, null, 2)}`);
  }

  if (status === 'success' && result?.outputVideoUrl) {
    return { status: 'success', videoUrl: result.outputVideoUrl };
  }

  return { status: status || 'unknown' };
}

async function pollUntilReady(taskId: string): Promise<TopViewQueryResult> {
  const maxAttempts = Math.ceil((MAX_POLL_MINUTES * 60 * 1000) / POLL_INTERVAL_MS);

  for (let i = 0; i < maxAttempts; i++) {
    const result = await queryVideoAvatarTask(taskId);
    console.log(`[video] Poll ${i + 1}/${maxAttempts}: status=${result.status}`);

    if (result.status === 'success' && result.videoUrl) {
      return result;
    }

    if (result.status === 'fail' || result.status === 'error') {
      throw new Error('TopView video generation failed');
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(`TopView: timed out after ${MAX_POLL_MINUTES} minutes`);
}

async function downloadVideo(videoUrl: string, outputPath: string): Promise<void> {
  console.log(`[video] Downloading video from TopView...`);
  const res = await fetch(videoUrl);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  console.log(`[video] Video saved: ${outputPath} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
}

export interface VideoResult {
  success: boolean;
  countryA?: Country;
  countryB?: Country;
  scriptPath?: string;
  videoPath?: string;
  script?: string;
  error?: string;
}

export async function run(options?: {
  countryA?: Country;
  countryB?: Country;
}): Promise<VideoResult> {
  try {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // 1. Pick two random countries (or use provided ones)
    const [countryA, countryB] = options?.countryA && options?.countryB
      ? [options.countryA, options.countryB]
      : pickTwo();
    console.log(`[video] Selected: ${countryA.name} vs ${countryB.name}`);

    // 2. Fetch World Bank data
    const indicatorData = await fetchCountryData(countryA, countryB);

    // 3. Generate narration script
    const script = generateScript(countryA, countryB, indicatorData);
    const scriptPath = path.join(OUTPUT_DIR, 'script.txt');
    fs.writeFileSync(scriptPath, script, 'utf-8');
    console.log(`[video] Script saved: ${scriptPath}`);
    console.log(`[video] --- Script Preview ---`);
    console.log(script);
    console.log(`[video] --- End Script ---`);

    // 4. Submit to TopView AI (Video Avatar)
    const taskId = await submitVideoAvatarTask(script);

    // 5. Poll until video is ready
    const queryResult = await pollUntilReady(taskId);

    // 6. Download the video
    const videoPath = path.join(OUTPUT_DIR, 'video.mp4');
    await downloadVideo(queryResult.videoUrl!, videoPath);

    console.log(`[video] Done!`);
    console.log(`[video]   Script: ${scriptPath}`);
    console.log(`[video]   Video:  ${videoPath}`);

    return {
      success: true,
      countryA,
      countryB,
      scriptPath,
      videoPath,
      script,
    };
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
