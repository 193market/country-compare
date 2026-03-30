/**
 * auto-publish.ts
 * Main orchestrator — runs article, dataset, dual video generation, and YouTube upload.
 * All steps use the same randomly selected country pair.
 */

import { run as runArticle } from './generate-article';
import { run as runDataset } from './generate-dataset';
import { run as runVideo, pickTwo, VideoMode } from './generate-video';
import { uploadToYouTube } from './upload-youtube';

async function main() {
  const args = process.argv.slice(2);
  const isDraft = args.includes('--draft');

  // Video mode: default 'both', can be overridden
  let videoMode: VideoMode = 'both';
  if (args.includes('--chart-only')) videoMode = 'chart';
  if (args.includes('--avatar-only')) videoMode = 'avatar';

  console.log('='.repeat(60));
  console.log('  CountryCompare Auto-Publish Pipeline');
  console.log(`  ${new Date().toISOString()}`);
  if (isDraft) console.log('  MODE: DRAFT (YouTube → unlisted)');
  console.log(`  VIDEO: ${videoMode}`);
  console.log('='.repeat(60));

  // Pick countries once, reuse across all steps
  const [countryA, countryB] = pickTwo();
  console.log(`\n  Countries: ${countryA.name} vs ${countryB.name}\n`);

  const results: { step: string; success: boolean; detail?: string }[] = [];

  // Step 1: Dev.to Article
  console.log('\n--- Step 1/4: Dev.to Article ---\n');
  const articleResult = await runArticle({ published: !isDraft });
  results.push({
    step: 'Dev.to Article',
    success: articleResult.success,
    detail: articleResult.success ? articleResult.url : articleResult.error,
  });

  // Step 2: Kaggle Dataset
  console.log('\n--- Step 2/4: Kaggle Dataset ---\n');
  const datasetResult = await runDataset();
  results.push({
    step: 'Kaggle Dataset',
    success: datasetResult.success,
    detail: datasetResult.success ? datasetResult.csvPath : datasetResult.error,
  });

  // Step 3: Video Generation (Chart + Avatar)
  console.log('\n--- Step 3/4: Video Generation ---\n');
  const videoResult = await runVideo({ countryA, countryB, mode: videoMode });
  results.push({
    step: `Video Generation (${videoMode})`,
    success: videoResult.success,
    detail: videoResult.success
      ? [
          videoResult.chartVideoPath && `Chart: ${videoResult.chartVideoPath}`,
          videoResult.avatarVideoPath && `Avatar: ${videoResult.avatarVideoPath}`,
        ].filter(Boolean).join(', ')
      : videoResult.error,
  });

  // Step 4: YouTube Upload (both videos if available)
  console.log('\n--- Step 4/4: YouTube Upload ---\n');
  if (videoResult.success && videoResult.script) {
    const ytResult = await uploadToYouTube({
      countryA,
      countryB,
      script: videoResult.script,
      chartVideoPath: videoResult.chartVideoPath,
      avatarVideoPath: videoResult.avatarVideoPath,
      privacyStatus: isDraft ? 'unlisted' : 'public',
    });
    results.push({
      step: 'YouTube Upload',
      success: ytResult.success,
      detail: ytResult.success
        ? [
            ytResult.chartUrl && `Main: ${ytResult.chartUrl}`,
            ytResult.avatarUrl && `Shorts: ${ytResult.avatarUrl}`,
          ].filter(Boolean).join(', ')
        : ytResult.error,
    });
  } else {
    console.log('[auto] Skipping YouTube upload — video generation failed');
    results.push({
      step: 'YouTube Upload',
      success: false,
      detail: 'Skipped: video not available',
    });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('  Pipeline Summary');
  console.log('='.repeat(60));

  for (const r of results) {
    const icon = r.success ? 'OK' : 'FAIL';
    console.log(`  [${icon}] ${r.step}`);
    if (r.detail) console.log(`       ${r.detail}`);
  }

  const failed = results.filter((r) => !r.success).length;
  console.log(`\n  Total: ${results.length - failed}/${results.length} succeeded`);
  console.log('='.repeat(60));

  process.exit(failed > 0 ? 1 : 0);
}

main();
