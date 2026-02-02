// Date helper utilities for G2R Bonus Management

export function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthKeyFromDate(isoDate: string): string {
  return isoDate && isoDate.length >= 7 ? isoDate.slice(0, 7) : "";
}

export function getMonthRange(monthKey: string): { start: Date; end: Date } | null {
  if (!monthKey || monthKey.length < 7) return null;
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0); // Last day of month
  return { start, end };
}
