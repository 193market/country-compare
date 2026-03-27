/**
 * upload-youtube.ts
 * Uploads a video to YouTube using the Data API v3 with OAuth2 credentials.
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
  videoPath?: string;
  privacyStatus?: 'public' | 'unlisted' | 'private';
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

export async function uploadToYouTube(options: UploadOptions): Promise<{
  success: boolean;
  videoId?: string;
  url?: string;
  error?: string;
}> {
  try {
    const { countryA, countryB, script, privacyStatus = 'public' } = options;
    const videoPath = options.videoPath || path.join(OUTPUT_DIR, 'video.mp4');

    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found: ${videoPath}`);
    }

    console.log(`[youtube] Uploading: ${countryA.name} vs ${countryB.name}`);
    console.log(`[youtube] Privacy: ${privacyStatus}`);
    console.log(`[youtube] File: ${videoPath}`);

    const auth = getOAuth2Client();
    const youtube = google.youtube({ version: 'v3', auth });

    const slug = `${countryA.slug}-vs-${countryB.slug}`;
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

    const fileSize = fs.statSync(videoPath).size;
    console.log(`[youtube] File size: ${(fileSize / 1024 / 1024).toFixed(1)} MB`);

    const res = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: title.slice(0, 100), // YouTube title limit
          description,
          tags,
          categoryId: '22', // People & Blogs
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

    const videoId = res.data.id;
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    console.log(`[youtube] Upload complete!`);
    console.log(`[youtube] Video ID: ${videoId}`);
    console.log(`[youtube] URL: ${url}`);

    return { success: true, videoId: videoId!, url };
  } catch (error: any) {
    console.error(`[youtube] Upload failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Direct execution — reads script.txt from output dir
if (require.main === module) {
  const args = process.argv.slice(2);
  const isDraft = args.includes('--draft');
  const privacyStatus = isDraft ? 'unlisted' : 'public';

  // Read country info and script from output files
  const scriptPath = path.join(OUTPUT_DIR, 'script.txt');
  if (!fs.existsSync(scriptPath)) {
    console.error(`[youtube] No script found at ${scriptPath}. Run generate-video first.`);
    process.exit(1);
  }

  const script = fs.readFileSync(scriptPath, 'utf-8');

  // Parse country names from script: "Today we compare X and Y."
  const match = script.match(/Today we compare (.+?) and (.+?)\./);
  if (!match) {
    console.error('[youtube] Could not parse country names from script.');
    process.exit(1);
  }

  // Try to find countries from a shared list
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
