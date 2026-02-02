// Number helper utilities for G2R Bonus Management

/**
 * Generates a valid UUID v4 for database compatibility
 */
export function generateId(): string {
  // Generate a UUID v4 compatible with PostgreSQL
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function clampInt(v: unknown, min: number, max: number): number {
  let n = parseInt(String(v), 10);
  if (isNaN(n)) n = 0;
  if (n < min) n = min;
  if (n > max) n = max;
  return n;
}

export function toNum(v: unknown): number {
  const n = Number(String(v || "").replace(",", "."));
  return isFinite(n) ? n : 0;
}

export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
