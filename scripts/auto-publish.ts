/**
 * auto-publish.ts
 * Main orchestrator — runs article, dataset, and video generation in sequence
 */

import { run as runArticle } from './generate-article';
import { run as runDataset } from './generate-dataset';
import { run as runVideo } from './generate-video';

async function main() {
  console.log('='.repeat(60));
  console.log('  CountryCompare Auto-Publish Pipeline');
  console.log(`  ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  const results: { step: string; success: boolean; detail?: string }[] = [];

  // Step 1: Dev.to Article
  console.log('\n--- Step 1/3: Dev.to Article ---\n');
  const articleResult = await runArticle({ published: true });
  results.push({
    step: 'Dev.to Article',
    success: articleResult.success,
    detail: articleResult.success ? articleResult.url : articleResult.error,
  });

  // Step 2: Kaggle Dataset
  console.log('\n--- Step 2/3: Kaggle Dataset ---\n');
  const datasetResult = await runDataset();
  results.push({
    step: 'Kaggle Dataset',
    success: datasetResult.success,
    detail: datasetResult.success ? datasetResult.csvPath : datasetResult.error,
  });

  // Step 3: YouTube Video Prep
  console.log('\n--- Step 3/3: YouTube Video Narration ---\n');
  const videoResult = await runVideo();
  results.push({
    step: 'YouTube Narration',
    success: videoResult.success,
    detail: videoResult.success
      ? `Script: ${videoResult.scriptPath}, Audio: ${videoResult.audioPath}`
      : videoResult.error,
  });

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
