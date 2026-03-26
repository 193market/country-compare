/**
 * Convert ISO 3166-1 alpha-2 country code to flag emoji.
 * Works by mapping each letter to its regional indicator symbol.
 */
export function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  const upper = code.toUpperCase();
  const offset = 0x1F1E6 - 65; // 'A' = 65, Regional Indicator A = 0x1F1E6
  return String.fromCodePoint(upper.charCodeAt(0) + offset, upper.charCodeAt(1) + offset);
}
