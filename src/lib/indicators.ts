export interface Indicator {
  id: string;
  name: string;
  format: 'billions' | 'millions' | 'percent' | 'number';
}

export const INDICATORS: Indicator[] = [
  { id: 'NY.GDP.MKTP.CD', name: 'GDP (USD)', format: 'billions' },
  { id: 'SP.POP.TOTL', name: 'Population', format: 'millions' },
  { id: 'SL.UEM.TOTL.ZS', name: 'Unemployment Rate (%)', format: 'percent' },
  { id: 'FP.CPI.TOTL.ZG', name: 'CPI Inflation (%)', format: 'percent' },
  { id: 'SP.DYN.LE00.IN', name: 'Life Expectancy (years)', format: 'number' },
];
