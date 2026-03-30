/**
 * upload-youtube.ts
 * Uploads videos to YouTube using the Data API v3 with OAuth2 credentials.
 * Supports uploading both chart video (main) and avatar video (Shorts).
 */

import * as fs from 'fs';
import * as path from 'path';
import { google } from 'googleapis';

const TOKEN_PATH = process.env.YOUTUBE_TOKEN_PATH || 'D:/193market/video/youtube_token.json';
const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || '';
const OUTPUT_DIR = path.join(__dirname, 'output');

interface Country {
  slug: string;
  code: string;
  name: string;
}

interface UploadOptions {
  countryA: Country;
  countryB: Country;
  script: string;
  chartVideoPath?: string;
  avatarVideoPath?: string;
  privacyStatus?: 'public' | 'unlisted' | 'private';
}

interface UploadResult {
  success: boolean;
  chartVideoId?: string;
  chartUrl?: string;
  avatarVideoId?: string;
  avatarUrl?: string;
  error?: string;
}

function getOAuth2Client() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET must be set in .env.local');
  }
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);

  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error(
      `YouTube token file not found at ${TOKEN_PATH}. ` +
      `Run OAuth2 flow first to generate the token.`
    );
  }

  const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  oauth2Client.setCredentials(tokenData);

  return oauth2Client;
}

async function uploadSingleVideo(
  youtube: any,
  videoPath: string,
  title: string,
  description: string,
  tags: string[],
  privacyStatus: string,
  isShort: boolean
): Promise<{ videoId: string; url: string }> {
  const fileSize = fs.statSync(videoPath).size;
  console.log(`[youtube] Uploading: ${title}`);
  console.log(`[youtube] File: ${videoPath} (${(fileSize / 1024 / 1024).toFixed(1)} MB)`);

  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: title.slice(0, 100),
        description,
        tags: isShort ? [...tags, 'Shorts'] : tags,
        categoryId: '22',
        defaultLanguage: 'en',
      },
      status: {
        privacyStatus,
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: fs.createReadStream(videoPath),
    },
  });

  const videoId = res.data.id!;
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  console.log(`[youtube] Upload complete! ${url}`);
  return { videoId, url };
}

export async function uploadToYouTube(options: UploadOptions): Promise<UploadResult> {
  try {
    const { countryA, countryB, script, privacyStatus = 'public' } = options;
    const chartVideoPath = options.chartVideoPath || path.join(OUTPUT_DIR, 'video-chart.mp4');
    const avatarVideoPath = options.avatarVideoPath || path.join(OUTPUT_DIR, 'video-avatar.mp4');

    const hasChart = fs.existsSync(chartVideoPath);
    const hasAvatar = fs.existsSync(avatarVideoPath);

    if (!hasChart && !hasAvatar) {
      throw new Error(`No video files found. Run generate-video first.`);
    }

    console.log(`[youtube] Privacy: ${privacyStatus}`);
    console.log(`[youtube] Chart video: ${hasChart ? 'yes' : 'no'}`);
    console.log(`[youtube] Avatar video: ${hasAvatar ? 'yes' : 'no'}`);

    const auth = getOAuth2Client();
    const youtube = google.youtube({ version: 'v3', auth });

    const slug = `${countryA.slug}-vs-${countryB.slug}`;
    const tags = [
      countryA.name,
      countryB.name,
      'economy',
      'GDP',
      'comparison',
      'data',
      'country-compare',
      'economics',
      'world economy',
      `${countryA.name} vs ${countryB.name}`,
    ];

    const result: UploadResult = { success: true };

    // Upload chart video (main YouTube video, 16:9)
    if (hasChart) {
      console.log('\n--- Uploading Chart Video (Main) ---\n');

      const title = `${countryA.name} vs ${countryB.name}: Economic Comparison 2024 | CountryCompare`;
      const description = [
        script,
        '',
        `Full interactive comparison:`,
        `https://country-compare.com/compare/${slug}`,
        '',
        `Subscribe for weekly country comparisons!`,
        '',
        `#economy #data #${countryA.name.replace(/\s+/g, '')} #${countryB.name.replace(/\s+/g, '')}`,
      ].join('\n');

      const uploaded = await uploadSingleVideo(
        youtube, chartVideoPath, title, description, tags, privacyStatus, false
      );
      result.chartVideoId = uploaded.videoId;
      result.chartUrl = uploaded.url;
    }

    // Upload avatar video (YouTube Shorts, portrait)
    if (hasAvatar) {
      console.log('\n--- Uploading Avatar Video (Shorts) ---\n');

      const title = `${countryA.name} vs ${countryB.name} Economy #Shorts`;
      const description = [
        `Quick economic comparison of ${countryA.name} and ${countryB.name}!`,
        '',
        `Full video with charts: ${result.chartUrl || `https://country-compare.com/compare/${slug}`}`,
        '',
        `Interactive comparison:`,
        `https://country-compare.com/compare/${slug}`,
        '',
        `#Shorts #economy #${countryA.name.replace(/\s+/g, '')} #${countryB.name.replace(/\s+/g, '')}`,
      ].join('\n');

      const uploaded = await uploadSingleVideo(
        youtube, avatarVideoPath, title, description, tags, privacyStatus, true
      );
      result.avatarVideoId = uploaded.videoId;
      result.avatarUrl = uploaded.url;
    }

    console.log('\n[youtube] All uploads complete!');
    if (result.chartUrl) console.log(`[youtube]   Main:   ${result.chartUrl}`);
    if (result.avatarUrl) console.log(`[youtube]   Shorts: ${result.avatarUrl}`);

    return result;
  } catch (error: any) {
    console.error(`[youtube] Upload failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Direct execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const isDraft = args.includes('--draft');
  const privacyStatus = isDraft ? 'unlisted' : 'public';

  const scriptPath = path.join(OUTPUT_DIR, 'script.txt');
  if (!fs.existsSync(scriptPath)) {
    console.error(`[youtube] No script found at ${scriptPath}. Run generate-video first.`);
    process.exit(1);
  }

  const script = fs.readFileSync(scriptPath, 'utf-8');

  const match = script.match(/Today we compare (.+?) and (.+?)\./);
  if (!match) {
    console.error('[youtube] Could not parse country names from script.');
    process.exit(1);
  }

  const { COUNTRIES } = require('./generate-video');
  const countryA = COUNTRIES.find((c: Country) => c.name === match[1]) || { slug: match[1].toLowerCase().replace(/\s+/g, '-'), code: 'XX', name: match[1] };
  const countryB = COUNTRIES.find((c: Country) => c.name === match[2]) || { slug: match[2].toLowerCase().replace(/\s+/g, '-'), code: 'XX', name: match[2] };

  uploadToYouTube({
    countryA,
    countryB,
    script,
    privacyStatus,
  }).then((result) => {
    process.exit(result.success ? 0 : 1);
  });
}
