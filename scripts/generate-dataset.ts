/**
 * generate-dataset.ts
 * Fetches 50 countries × 5 indicators from World Bank API, generates CSV, uploads to Kaggle
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const WB_BASE_URL = 'https://api.worldbank.org/v2';
const OUTPUT_DIR = path.join(__dirname, 'output');
const KAGGLE_USER = 'market193';
const DATASET_SLUG = 'world-economic-indicators-50-countries';

const COUNTRIES = [
  { code: 'US', name: 'United States' }, { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' }, { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' }, { code: 'FR', name: 'France' },
  { code: 'BR', name: 'Brazil' }, { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' }, { code: 'RU', name: 'Russia' },
  { code: 'MX', name: 'Mexico' }, { code: 'ID', name: 'Indonesia' },
  { code: 'TR', name: 'Turkey' }, { code: 'SA', name: 'Saudi Arabia' },
  { code: 'IT', name: 'Italy' }, { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' }, { code: 'CH', name: 'Switzerland' },
  { code: 'PL', name: 'Poland' }, { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' }, { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' }, { code: 'MY', name: 'Malaysia' },
  { code: 'PH', name: 'Philippines' }, { code: 'SG', name: 'Singapore' },
  { code: 'IL', name: 'Israel' }, { code: 'EG', name: 'Egypt' },
  { code: 'ZA', name: 'South Africa' }, { code: 'NG', name: 'Nigeria' },
  { code: 'AR', name: 'Argentina' }, { code: 'CO', name: 'Colombia' },
  { code: 'CL', name: 'Chile' }, { code: 'PE', name: 'Peru' },
  { code: 'PK', name: 'Pakistan' }, { code: 'BD', name: 'Bangladesh' },
  { code: 'NZ', name: 'New Zealand' }, { code: 'IE', name: 'Ireland' },
  { code: 'DK', name: 'Denmark' }, { code: 'FI', name: 'Finland' },
  { code: 'BE', name: 'Belgium' }, { code: 'AT', name: 'Austria' },
  { code: 'PT', name: 'Portugal' }, { code: 'CZ', name: 'Czechia' },
  { code: 'GR', name: 'Greece' }, { code: 'HU', name: 'Hungary' },
  { code: 'RO', name: 'Romania' }, { code: 'UA', name: 'Ukraine' },
];

const INDICATORS = [
  { id: 'NY.GDP.MKTP.CD', col: 'gdp_usd' },
  { id: 'SP.POP.TOTL', col: 'population' },
  { id: 'SL.UEM.TOTL.ZS', col: 'unemployment_pct' },
  { id: 'FP.CPI.TOTL.ZG', col: 'cpi_inflation_pct' },
  { id: 'SP.DYN.LE00.IN', col: 'life_expectancy' },
];

async function fetchIndicator(indicatorId: string): Promise<any[]> {
  const codes = COUNTRIES.map((c) => c.code).join(';');
  const url = `${WB_BASE_URL}/country/${codes}/indicator/${indicatorId}?format=json&date=2000:2024&per_page=10000`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`World Bank API error: ${res.status}`);
  const json: any = await res.json();
  return json[1] || [];
}

export async function run(): Promise<{ success: boolean; csvPath?: string; error?: string }> {
  try {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // 1. Fetch all indicator data
    const dataMap: Map<string, Record<string, number | null>> = new Map();

    for (const ind of INDICATORS) {
      console.log(`[dataset] Fetching ${ind.col}...`);
      const raw = await fetchIndicator(ind.id);

      for (const entry of raw) {
        const code = entry.country?.id;
        const year = entry.date;
        const value = entry.value;
        if (!code || !year) continue;

        const key = `${code}_${year}`;
        if (!dataMap.has(key)) {
          dataMap.set(key, {});
        }
        dataMap.get(key)![ind.col] = value;
      }
    }

    // 2. Build CSV
    const header = 'country_code,country_name,year,gdp_usd,population,unemployment_pct,cpi_inflation_pct,life_expectancy';
    const rows: string[] = [header];
    const nameMap = new Map(COUNTRIES.map((c) => [c.code, c.name]));

    for (const country of COUNTRIES) {
      for (let year = 2000; year <= 2024; year++) {
        const key = `${country.code}_${year}`;
        const d = dataMap.get(key) || {};
        const row = [
          country.code,
          `"${country.name}"`,
          year,
          d.gdp_usd ?? '',
          d.population ?? '',
          d.unemployment_pct !== undefined && d.unemployment_pct !== null ? (d.unemployment_pct as number).toFixed(2) : '',
          d.cpi_inflation_pct !== undefined && d.cpi_inflation_pct !== null ? (d.cpi_inflation_pct as number).toFixed(2) : '',
          d.life_expectancy !== undefined && d.life_expectancy !== null ? (d.life_expectancy as number).toFixed(2) : '',
        ].join(',');
        rows.push(row);
      }
    }

    const csvPath = path.join(OUTPUT_DIR, 'country_compare_economic_data_2024.csv');
    fs.writeFileSync(csvPath, rows.join('\n'), 'utf-8');
    console.log(`[dataset] CSV written: ${csvPath} (${rows.length - 1} rows)`);

    // 3. Create dataset-metadata.json for Kaggle
    const metadata = {
      title: 'World Economic Indicators - 50 Countries (2000-2024)',
      id: `${KAGGLE_USER}/${DATASET_SLUG}`,
      licenses: [{ name: 'CC0-1.0' }],
      description: `Economic indicators for 50 countries from 2000 to 2024, sourced from the World Bank Open Data API.\n\nIncludes: GDP (USD), Population, Unemployment Rate (%), CPI Inflation (%), Life Expectancy (years).\n\nExplore this data interactively at https://country-compare.com\n\nData is updated periodically from the World Bank API (https://api.worldbank.org/v2).`,
      resources: [
        {
          path: 'country_compare_economic_data_2024.csv',
          description: '50 countries × 5 indicators × 25 years of economic data',
        },
      ],
    };

    const metadataPath = path.join(OUTPUT_DIR, 'dataset-metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    console.log(`[dataset] Metadata written: ${metadataPath}`);

    // 4. Upload to Kaggle
    console.log(`[dataset] Uploading to Kaggle...`);
    try {
      // Try update first (if dataset exists)
      execSync(`kaggle datasets version -p "${OUTPUT_DIR}" -m "Auto-update ${new Date().toISOString().split('T')[0]}"`, {
        stdio: 'pipe',
        encoding: 'utf-8',
      });
      console.log(`[dataset] Kaggle dataset updated successfully`);
    } catch {
      // First time: create new dataset
      try {
        execSync(`kaggle datasets create -p "${OUTPUT_DIR}"`, {
          stdio: 'pipe',
          encoding: 'utf-8',
        });
        console.log(`[dataset] Kaggle dataset created successfully`);
      } catch (createErr: any) {
        console.error(`[dataset] Kaggle upload failed: ${createErr.message}`);
        console.log(`[dataset] CSV is saved locally. You can upload manually via: kaggle datasets create -p "${OUTPUT_DIR}"`);
      }
    }

    const kaggleUrl = `https://www.kaggle.com/datasets/${KAGGLE_USER}/${DATASET_SLUG}`;
    console.log(`[dataset] Kaggle URL: ${kaggleUrl}`);

    return { success: true, csvPath };
  } catch (error: any) {
    console.error(`[dataset] Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Direct execution
if (require.main === module) {
  run().then((result) => {
    process.exit(result.success ? 0 : 1);
  });
}
