/**
 * generate-video.ts
 * Picks 2 random countries, fetches World Bank data, generates narration script,
 * then creates two video types:
 *   1. Chart video (Remotion) — 16:9 animated data visualization for YouTube
 *   2. Avatar video (TopView AI) — AI presenter for YouTube Shorts/Reels
 *
 * Usage:
 *   ts-node generate-video.ts              → both videos
 *   ts-node generate-video.ts --chart      → chart only
 *   ts-node generate-video.ts --avatar     → avatar only
 */

import * as fs from 'fs';
import * as path from 'path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const WB_BASE_URL = 'https://api.worldbank.org/v2';
const TOPVIEW_API_KEY = process.env.TOPVIEW_API_KEY || 'sk-5vXmUaBSD8HsTpRObkgUNNUUZU9c-X3kjS2pE0m2BpY';
const TOPVIEW_UID = process.env.TOPVIEW_UID || 'PEIwqZJbzzjWChXaVDWo';
const TOPVIEW_BASE = 'https://api.topview.ai/v1';
const OUTPUT_DIR = path.join(__dirname, 'output');
const REMOTION_ENTRY = path.join(__dirname, 'remotion', 'src', 'index.tsx');

const POLL_INTERVAL_MS = 15_000;
const MAX_POLL_MINUTES = 20;

interface Country {
  slug: string;
  code: string;
  name: string;
}

export type VideoMode = 'both' | 'chart' | 'avatar';

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

// ═══════════════════════════════════════════════
// World Bank Data
// ═══════════════════════════════════════════════

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

export interface IndicatorData {
  name: string;
  format: string;
  vA: number | null;
  vB: number | null;
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

// ═══════════════════════════════════════════════
// Narration Script
// ═══════════════════════════════════════════════

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

// ═══════════════════════════════════════════════
// Edge TTS (Microsoft) — free, for Remotion chart video
// ═══════════════════════════════════════════════

async function generateAudio(text: string, outputPath: string): Promise<void> {
  console.log(`[video] Generating TTS audio via Edge TTS (${text.length} chars)...`);

  const tts = new MsEdgeTTS();
  await tts.setMetadata('en-US-AriaNeural', OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

  const { audioStream } = tts.toStream(text);

  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    audioStream.on('data', (chunk: any) => {
      if (chunk instanceof Buffer) chunks.push(chunk);
    });
    audioStream.on('end', () => resolve());
    audioStream.on('error', (err: Error) => reject(err));
  });

  const buffer = Buffer.concat(chunks);
  fs.writeFileSync(outputPath, buffer);
  console.log(`[video] Audio saved: ${outputPath} (${(buffer.length / 1024).toFixed(0)} KB)`);
}

// ═══════════════════════════════════════════════
// Remotion — Chart animated video (16:9)
// ═══════════════════════════════════════════════

async function renderChartVideo(
  countryA: Country,
  countryB: Country,
  indicatorData: IndicatorData[],
  audioPath: string,
  outputPath: string
): Promise<void> {
  console.log('[chart] Bundling Remotion composition...');

  // Copy audio to output dir as "audio.mp3" so Remotion staticFile() can find it
  const staticAudioPath = path.join(OUTPUT_DIR, 'audio.mp3');
  if (audioPath !== staticAudioPath) {
    fs.copyFileSync(audioPath, staticAudioPath);
  }

  const bundled = await bundle({
    entryPoint: REMOTION_ENTRY,
    publicDir: OUTPUT_DIR,
  });

  console.log('[chart] Bundle complete. Selecting composition...');

  const FPS = 30;
  const totalDurationFrames = (5 + 5 * 9 + 10 + 7) * FPS; // 67s

  const inputProps = {
    countryA,
    countryB,
    indicators: indicatorData.map((d) => ({
      name: d.name,
      valueA: d.vA,
      valueB: d.vB,
      format: d.format,
      label: d.name,
    })),
    audioDurationInFrames: totalDurationFrames,
  };

  const composition = await selectComposition({
    serveUrl: bundled,
    id: 'CountryComparison',
    inputProps,
  });

  composition.durationInFrames = totalDurationFrames;

  console.log(`[chart] Rendering ${totalDurationFrames} frames (${totalDurationFrames / FPS}s) at 1920x1080...`);

  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps,
  });

  console.log(`[chart] Video rendered: ${outputPath}`);
}

// ═══════════════════════════════════════════════
// TopView AI — Avatar video (portrait, for Shorts)
// ═══════════════════════════════════════════════

function topviewHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOPVIEW_API_KEY}`,
    'Topview-Uid': TOPVIEW_UID,
  };
}

async function submitAvatarTask(script: string): Promise<string> {
  console.log('[avatar] Submitting Video Avatar task to TopView AI...');

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
  console.log(`[avatar] Submit response: code=${json.code}, taskId=${json.result?.taskId}`);

  if (!res.ok || (json.code !== '200' && json.code !== '0')) {
    throw new Error(`TopView submit error: ${JSON.stringify(json)}`);
  }

  const taskId = json.result?.taskId;
  if (!taskId) throw new Error(`TopView: no taskId in response`);

  return taskId;
}

async function queryAvatarTask(taskId: string): Promise<{ status: string; videoUrl?: string }> {
  const res = await fetch(`${TOPVIEW_BASE}/video_avatar/task/query?taskId=${taskId}`, {
    method: 'GET',
    headers: topviewHeaders(),
  });

  const json: any = await res.json();
  if (!res.ok || (json.code !== '200' && json.code !== '0')) {
    throw new Error(`TopView query error: ${JSON.stringify(json)}`);
  }

  const result = json.result;
  if (result?.status === 'fail') {
    console.error(`[avatar] Task failed: ${result?.errorMsg || 'unknown'}`);
  }

  if (result?.status === 'success' && result?.outputVideoUrl) {
    return { status: 'success', videoUrl: result.outputVideoUrl };
  }

  return { status: result?.status || 'unknown' };
}

async function pollAvatarUntilReady(taskId: string): Promise<string> {
  const maxAttempts = Math.ceil((MAX_POLL_MINUTES * 60 * 1000) / POLL_INTERVAL_MS);

  for (let i = 0; i < maxAttempts; i++) {
    const result = await queryAvatarTask(taskId);
    console.log(`[avatar] Poll ${i + 1}/${maxAttempts}: status=${result.status}`);

    if (result.status === 'success' && result.videoUrl) {
      return result.videoUrl;
    }

    if (result.status === 'fail' || result.status === 'error') {
      throw new Error('TopView avatar video generation failed');
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(`TopView: timed out after ${MAX_POLL_MINUTES} minutes`);
}

async function renderAvatarVideo(script: string, outputPath: string): Promise<void> {
  const taskId = await submitAvatarTask(script);

  const videoUrl = await pollAvatarUntilReady(taskId);

  console.log(`[avatar] Downloading video...`);
  const res = await fetch(videoUrl);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  console.log(`[avatar] Video saved: ${outputPath} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
}

// ═══════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════

export interface VideoResult {
  success: boolean;
  countryA?: Country;
  countryB?: Country;
  scriptPath?: string;
  chartVideoPath?: string;
  avatarVideoPath?: string;
  script?: string;
  error?: string;
  // Legacy compat
  videoPath?: string;
}

export async function run(options?: {
  countryA?: Country;
  countryB?: Country;
  mode?: VideoMode;
}): Promise<VideoResult> {
  const mode = options?.mode || 'both';

  try {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // 1. Pick two random countries (or use provided ones)
    const [countryA, countryB] =
      options?.countryA && options?.countryB
        ? [options.countryA, options.countryB]
        : pickTwo();
    console.log(`[video] Selected: ${countryA.name} vs ${countryB.name}`);
    console.log(`[video] Mode: ${mode}`);

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

    let chartVideoPath: string | undefined;
    let avatarVideoPath: string | undefined;

    // 4a. Chart video (Remotion + Edge TTS)
    if (mode === 'both' || mode === 'chart') {
      console.log('\n' + '='.repeat(50));
      console.log('  Generating Chart Video (Remotion)');
      console.log('='.repeat(50) + '\n');

      const audioPath = path.join(OUTPUT_DIR, 'audio.mp3');
      await generateAudio(script, audioPath);

      chartVideoPath = path.join(OUTPUT_DIR, 'video-chart.mp4');
      await renderChartVideo(countryA, countryB, indicatorData, audioPath, chartVideoPath);
    }

    // 4b. Avatar video (TopView AI)
    if (mode === 'both' || mode === 'avatar') {
      console.log('\n' + '='.repeat(50));
      console.log('  Generating Avatar Video (TopView AI)');
      console.log('='.repeat(50) + '\n');

      avatarVideoPath = path.join(OUTPUT_DIR, 'video-avatar.mp4');
      await renderAvatarVideo(script, avatarVideoPath);
    }

    console.log(`\n[video] Done!`);
    console.log(`[video]   Script: ${scriptPath}`);
    if (chartVideoPath) console.log(`[video]   Chart:  ${chartVideoPath}`);
    if (avatarVideoPath) console.log(`[video]   Avatar: ${avatarVideoPath}`);

    return {
      success: true,
      countryA,
      countryB,
      scriptPath,
      chartVideoPath,
      avatarVideoPath,
      script,
      videoPath: chartVideoPath || avatarVideoPath, // legacy compat
    };
  } catch (error: any) {
    console.error(`[video] Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Direct execution
if (require.main === module) {
  const args = process.argv.slice(2);
  let mode: VideoMode = 'both';
  if (args.includes('--chart')) mode = 'chart';
  if (args.includes('--avatar')) mode = 'avatar';

  run({ mode }).then((result) => {
    process.exit(result.success ? 0 : 1);
  });
}
