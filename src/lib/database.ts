// Re-export all utilities from modular files for backwards compatibility
// This file can be deprecated once all imports are updated

export { formatBRL, formatPercent } from "./formatters";
export { todayISO, currentMonthKey, monthKeyFromDate } from "./dateHelpers";
export { generateId, clampInt, toNum } from "./numberHelpers";
export {
  getDifficultyById,
  getDurationById,
  calculateMaxPts,
  getMonthOS,
  getHorasTrabalhadas,
  calcMedianCE,
  calcMediaEquipeCEQ,
  calcBonusCamadas,
} from "./bonusCalculator";

// Legacy exports for localStorage (deprecated - now using Supabase)
import { Database, Config, OSRecord, Employee } from "@/types/bonus";
import { STORAGE_KEY, DEFAULT_CONFIG, DEFAULT_EMPLOYEES } from "@/lib/constants";

export function loadDatabase(): Database | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDatabase(db: Database): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function ensureDatabase(): Database {
  let db = loadDatabase();
  if (!db) {
    db = {
      cfg: { ...DEFAULT_CONFIG },
      employees: [...DEFAULT_EMPLOYEES],
      horasTrabalhadas: {},
      os: [],
    };
    saveDatabase(db);
  }

  // Ensure all config fields exist
  if (!db.cfg) db.cfg = { ...DEFAULT_CONFIG };
  if (!db.cfg.difficultyWeights) db.cfg.difficultyWeights = DEFAULT_CONFIG.difficultyWeights;
  if (!db.cfg.durationWeights) db.cfg.durationWeights = DEFAULT_CONFIG.durationWeights;
  if (db.cfg.bonusCap === undefined) db.cfg.bonusCap = DEFAULT_CONFIG.bonusCap;
  if (!db.cfg.maxPts) db.cfg.maxPts = DEFAULT_CONFIG.maxPts;
  if (!db.cfg.layerWeights) db.cfg.layerWeights = DEFAULT_CONFIG.layerWeights;
  if (!db.cfg.horasEsperadas) db.cfg.horasEsperadas = DEFAULT_CONFIG.horasEsperadas;
  if (!db.employees) db.employees = [];
  if (!db.horasTrabalhadas) db.horasTrabalhadas = {};
  if (!db.os) db.os = [];

  saveDatabase(db);
  return db;
}

export function setHorasTrabalhadas(db: Database, monthKey: string, empId: string, horas: number): void {
  if (!db.horasTrabalhadas[monthKey]) db.horasTrabalhadas[monthKey] = {};
  db.horasTrabalhadas[monthKey][empId] = Math.max(0, Number(horas || 0));
}

export function upsertOS(db: Database, rec: OSRecord): void {
  const idx = db.os.findIndex((r) => r.id === rec.id);
  if (idx >= 0) {
    db.os[idx] = rec;
  } else {
    db.os.push(rec);
  }
  saveDatabase(db);
}

export function deleteOS(db: Database, osId: string): void {
  db.os = db.os.filter((r) => r.id !== osId);
  saveDatabase(db);
}

export function addEmployee(db: Database, employee: Employee): void {
  db.employees.push(employee);
  saveDatabase(db);
}

export function deleteEmployee(db: Database, empId: string): void {
  db.employees = db.employees.filter((e) => e.id !== empId);
  saveDatabase(db);
}

export function exportToCSV(rows: (string | number)[][], filename: string): void {
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\r\n");
  
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
