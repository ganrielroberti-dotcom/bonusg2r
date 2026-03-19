/**
 * Parser for Auvo "Relatório de Apontamento de Horas" XLS files.
 * These files are actually HTML tables saved as .xls.
 *
 * Logic:
 * - For each OS (task), if there's a Check-out row, use "Tempo total de trabalho na Tarefa".
 * - For OS without Check-out but with pause events, calculate work time from pause intervals:
 *   work = (check-in → first pause-start) + (each pause-end → next pause-start).
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

interface TaskEvent {
  event: string;
  tempoCorrido: string;
  tempoTotal: string;
}

interface TaskGroup {
  taskId: string;
  name: string;
  events: TaskEvent[];
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

  const daysMatch = remaining.match(/(\d+)\s+dias?\s+e\s+/i);
  if (daysMatch) {
    totalHours += parseInt(daysMatch[1], 10) * 24;
    remaining = remaining.replace(daysMatch[0], "").trim();
  }

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
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Calculate work time from pause intervals for OS without Check-out.
 * Work intervals: (check-in → first Pausa-início) + (each Pausa-fim → next Pausa-início)
 * Uses the "Tempo corrido" column which tracks elapsed time since check-in.
 */
function calculateWorkFromPauses(events: TaskEvent[]): number {
  let workMinutes = 0;
  let lastCorridoAtPauseFim = 0;

  for (const e of events) {
    if (e.event === "Pausa - início") {
      const corrido = parseTimeString(e.tempoCorrido);
      workMinutes += corrido - lastCorridoAtPauseFim;
    } else if (e.event === "Pausa - fim") {
      lastCorridoAtPauseFim = parseTimeString(e.tempoCorrido);
    }
  }

  return workMinutes;
}

/**
 * Parse the HTML table from the Auvo XLS report.
 */
export function parseAuvoHoursReport(htmlContent: string): ImportParseResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const rows = doc.querySelectorAll("tr.resultado");

  const monthKey = extractMonthKey(htmlContent);

  // Group events by taskId + employee name
  const taskGroups: Record<string, TaskGroup> = {};

  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    if (cells.length < 8) return;

    const taskId = cells[1]?.textContent?.trim() || "";
    const employeeName = cells[3]?.textContent?.trim() || "";
    const eventType = cells[4]?.textContent?.trim() || "";
    const tempoCorrido = cells[6]?.textContent?.trim() || "-";
    const tempoTotal = cells[7]?.textContent?.trim() || "-";

    if (!employeeName) return;

    const key = `${taskId}|${employeeName}`;
    if (!taskGroups[key]) {
      taskGroups[key] = { taskId, name: employeeName, events: [] };
    }
    taskGroups[key].events.push({ event: eventType, tempoCorrido, tempoTotal });
  });

  // Calculate hours per employee
  const employeeHours: Record<string, { totalMinutes: number; osIds: Set<string> }> = {};

  function addTime(name: string, minutes: number, taskId: string) {
    if (minutes <= 0) return;
    if (!employeeHours[name]) {
      employeeHours[name] = { totalMinutes: 0, osIds: new Set() };
    }
    employeeHours[name].totalMinutes += minutes;
    employeeHours[name].osIds.add(taskId);
  }

  for (const task of Object.values(taskGroups)) {
    const hasCheckout = task.events.some((e) => e.event === "Check-out");

    if (hasCheckout) {
      // Use Check-out's "Tempo total de trabalho na Tarefa"
      for (const e of task.events) {
        if (e.event === "Check-out" && e.tempoTotal !== "-") {
          addTime(task.name, parseTimeString(e.tempoTotal), task.taskId);
        }
      }
    } else {
      // Calculate from pause intervals
      const workMinutes = calculateWorkFromPauses(task.events);
      addTime(task.name, workMinutes, task.taskId);
    }
  }

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
