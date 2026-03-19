/**
 * Parser for Auvo "Relatório de Apontamento de Horas" XLS files.
 * These files are actually HTML tables saved as .xls.
 *
 * Logic:
 * - For each Check-out row, read "Tempo total de trabalho na Tarefa" (col 8).
 * - Time can be "X dias e HH:MM:SS" or just "HH:MM:SS".
 * - Sum per employee name.
 */

export interface ParsedEmployeeHours {
  name: string;
  totalMinutes: number;
  totalFormatted: string;
  osCount: number;
}

export interface ImportParseResult {
  monthKey: string;
  employees: ParsedEmployeeHours[];
  totalRows: number;
}

/**
 * Parse time string like "3 dias e 02:19:31", "1 dia e 01:15:26", or "00:39:07"
 * Returns total minutes (decimal).
 */
export function parseTimeString(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "-") return 0;

  let totalHours = 0;
  let remaining = trimmed;

  // Check for "X dias e" or "X dia e" pattern
  const daysMatch = remaining.match(/(\d+)\s+dias?\s+e\s+/i);
  if (daysMatch) {
    totalHours += parseInt(daysMatch[1], 10) * 24;
    remaining = remaining.replace(daysMatch[0], "").trim();
  }

  // Parse HH:MM:SS
  const timeParts = remaining.match(/(\d+):(\d+):(\d+)/);
  if (timeParts) {
    const h = parseInt(timeParts[1], 10);
    const m = parseInt(timeParts[2], 10);
    const s = parseInt(timeParts[3], 10);
    totalHours += h;
    return (totalHours * 60) + m + (s / 60);
  }

  return 0;
}

export function formatMinutesToHHMM(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/**
 * Extract month key from report header (e.g. "Data Inicio: 01/02/2026" → "2026-02")
 */
function extractMonthKey(html: string): string {
  const match = html.match(/Data\s+Inicio:\s*(\d{2})\/(\d{2})\/(\d{4})/i);
  if (match) {
    return `${match[3]}-${match[2]}`;
  }
  // Fallback: current month
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Parse the HTML table from the Auvo XLS report.
 */
export function parseAuvoHoursReport(htmlContent: string): ImportParseResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const rows = doc.querySelectorAll("tr.resultado");

  const monthKey = extractMonthKey(htmlContent);
  const employeeHours: Record<string, { totalMinutes: number; osIds: Set<string> }> = {};

  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    if (cells.length < 8) return;

    const taskId = cells[1]?.textContent?.trim() || "";
    const employeeName = cells[3]?.textContent?.trim() || "";
    const eventType = cells[4]?.textContent?.trim() || "";
    const tempoTotal = cells[7]?.textContent?.trim() || "-";

    if (!employeeName) return;

    // Only count Check-out rows — they have "Tempo total de trabalho na Tarefa"
    if (eventType === "Check-out" && tempoTotal !== "-") {
      if (!employeeHours[employeeName]) {
        employeeHours[employeeName] = { totalMinutes: 0, osIds: new Set() };
      }
      employeeHours[employeeName].totalMinutes += parseTimeString(tempoTotal);
      employeeHours[employeeName].osIds.add(taskId);
    }
  });

  const employees: ParsedEmployeeHours[] = Object.entries(employeeHours)
    .map(([name, data]) => ({
      name,
      totalMinutes: data.totalMinutes,
      totalFormatted: formatMinutesToHHMM(data.totalMinutes),
      osCount: data.osIds.size,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    monthKey,
    employees,
    totalRows: rows.length,
  };
}
