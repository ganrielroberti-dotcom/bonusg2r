// Number helper utilities for G2R Bonus Management

export function generateId(): string {
  return "id_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
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
