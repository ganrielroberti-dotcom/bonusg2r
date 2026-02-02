// Bonus calculation logic for G2R Bonus Management

import { Config, OSRecord, BonusCamadas, Database } from "@/types/bonus";
import { DEFAULT_CONFIG, CRITERIA } from "@/lib/constants";

export function getDifficultyById(cfg: Config, id: string) {
  const found = cfg.difficultyWeights.find((d) => d.id === id);
  return found || cfg.difficultyWeights[1] || DEFAULT_CONFIG.difficultyWeights[1];
}

export function getDurationById(cfg: Config, id: string) {
  const found = cfg.durationWeights.find((d) => d.id === id);
  return found || cfg.durationWeights[0] || DEFAULT_CONFIG.durationWeights[0];
}

export function calculateMaxPts(): number {
  return CRITERIA.reduce((sum, c) => sum + c.max, 0);
}

export function getMonthOS(db: Database, monthKey: string): OSRecord[] {
  return db.os.filter((r) => r.monthKey === monthKey);
}

export function getHorasTrabalhadas(db: Database, monthKey: string, empId: string): number {
  if (!db.horasTrabalhadas[monthKey]) return 0;
  return db.horasTrabalhadas[monthKey][empId] || 0;
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

export function calculateOSMetrics(
  critValues: Record<string, number>,
  cfg: Config,
  dificuldadeId: string,
  duracaoId: string
) {
  const score = Object.values(critValues).reduce((a, b) => a + b, 0);
  const diff = getDifficultyById(cfg, dificuldadeId);
  const dur = getDurationById(cfg, duracaoId);
  const ce = diff.ce;
  const ceFinal = ce * dur.mult;
  const maxPts = cfg.maxPts || 16;
  const q = maxPts > 0 ? score / maxPts : 0;
  const ceQ = ceFinal * q;
  return { score, maxPts, ce, ceFinal, ceQ, diff, dur };
}
