import { Database, Config, OSRecord, Employee, BonusCamadas } from "@/types/bonus";
import { STORAGE_KEY, DEFAULT_CONFIG, DEFAULT_EMPLOYEES, CRITERIA } from "@/lib/constants";

export function generateId(): string {
  return "id_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}

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

export function formatBRL(n: number): string {
  return Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatPercent(x: number): string {
  return Math.round((x || 0) * 100) + "%";
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

export function getMonthOS(db: Database, monthKey: string): OSRecord[] {
  return db.os.filter((r) => r.monthKey === monthKey);
}

export function getHorasTrabalhadas(db: Database, monthKey: string, empId: string): number {
  if (!db.horasTrabalhadas[monthKey]) return 0;
  return db.horasTrabalhadas[monthKey][empId] || 0;
}

export function setHorasTrabalhadas(db: Database, monthKey: string, empId: string, horas: number): void {
  if (!db.horasTrabalhadas[monthKey]) db.horasTrabalhadas[monthKey] = {};
  db.horasTrabalhadas[monthKey][empId] = Math.max(0, Number(horas || 0));
}

export function getDifficultyById(cfg: Config, id: string) {
  const found = cfg.difficultyWeights.find((d) => d.id === id);
  return found || cfg.difficultyWeights[1];
}

export function getDurationById(cfg: Config, id: string) {
  const found = cfg.durationWeights.find((d) => d.id === id);
  return found || cfg.durationWeights[0];
}

export function calcMedianCE(db: Database, mk: string): number {
  const os = getMonthOS(db, mk);
  const ceByEmp: Record<string, number> = {};
  
  for (const r of os) {
    if (!ceByEmp[r.employeeId]) ceByEmp[r.employeeId] = 0;
    ceByEmp[r.employeeId] += r.ceFinal || 0;
  }
  
  const values = Object.values(ceByEmp);
  if (values.length === 0) return 10;
  
  values.sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
}

export function calcMediaEquipeCEQ(db: Database, mk: string): number {
  const os = getMonthOS(db, mk);
  const ceqByEmp: Record<string, number> = {};
  
  for (const r of os) {
    if (!ceqByEmp[r.employeeId]) ceqByEmp[r.employeeId] = 0;
    ceqByEmp[r.employeeId] += r.ceQ || 0;
  }
  
  const values = Object.values(ceqByEmp);
  const total = values.reduce((a, b) => a + b, 0);
  return values.length > 0 ? total / values.length : 0;
}

export function calcBonusCamadas(
  cfg: Config,
  db: Database,
  mk: string,
  empId: string,
  empOsList: OSRecord[]
): BonusCamadas {
  const teto = cfg.bonusCap || 600;
  const weights = cfg.layerWeights || DEFAULT_CONFIG.layerWeights;
  const maxPts = cfg.maxPts || 16;
  const horasEsperadas = cfg.horasEsperadas || 220;

  const horasTrabalhadas = getHorasTrabalhadas(db, mk, empId);
  const fatorHoras = horasEsperadas > 0 ? Math.min(1, horasTrabalhadas / horasEsperadas) : 0;

  let ceTotal = 0, ceQTotal = 0, scoreTotal = 0, osDentroPrazo = 0;
  
  for (const os of empOsList) {
    ceTotal += os.ceFinal || 0;
    ceQTotal += os.ceQ || 0;
    scoreTotal += os.score || 0;
    const prazoCumprido = os.crit?.c_prazo || 0;
    if (prazoCumprido > 0) osDentroPrazo++;
  }

  const qtdOS = empOsList.length;
  const mediaPontuacao = qtdOS > 0 ? scoreTotal / qtdOS : 0;
  const taxaPrazo = qtdOS > 0 ? osDentroPrazo / qtdOS : 0;

  const ceReferencia = calcMedianCE(db, mk) * 1.2;
  const mediaEquipeCEQ = calcMediaEquipeCEQ(db, mk);

  // CAMADA 1: Esforço (50%) - baseado na taxa de prazo
  const fatorEsforco = taxaPrazo;
  const bonusEsforco = teto * weights.esforco * fatorEsforco;

  // CAMADA 2: Qualidade (40%)
  const fatorQualidade = maxPts > 0 ? mediaPontuacao / maxPts : 0;
  const bonusQualidade = teto * weights.qualidade * fatorQualidade;

  // CAMADA 3: Superação (10%)
  let bonusSuperacao = 0;
  let fatorSuperacao = 0;
  if (mediaEquipeCEQ > 0 && ceQTotal > mediaEquipeCEQ * 1.1) {
    fatorSuperacao = Math.min(1, (ceQTotal - mediaEquipeCEQ) / mediaEquipeCEQ);
    bonusSuperacao = teto * weights.superacao * fatorSuperacao;
  }

  const bonusCamadas = bonusEsforco + bonusQualidade + bonusSuperacao;
  const bonusTotal = bonusCamadas * fatorHoras;

  return {
    fatorEsforco,
    fatorQualidade,
    fatorSuperacao,
    fatorHoras,
    bonusEsforco,
    bonusQualidade,
    bonusSuperacao,
    bonusCamadas,
    bonusTotal,
    teto,
    ceReferencia,
    mediaEquipeCEQ,
    ceTotal,
    ceQTotal,
    mediaPontuacao,
    qtdOS,
    osDentroPrazo,
    taxaPrazo,
    horasTrabalhadas,
    horasEsperadas,
  };
}

export function calculateMaxPts(): number {
  return CRITERIA.reduce((sum, c) => sum + c.max, 0);
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
