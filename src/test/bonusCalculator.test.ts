import { describe, it, expect, beforeEach } from "vitest";
import {
  getDifficultyById,
  getDurationById,
  calculateMaxPts,
  getMonthOS,
  getHorasTrabalhadas,
  calcMedianCE,
  calcMediaEquipeCEQ,
  calcBonusCamadas,
  calculateOSMetrics,
} from "@/lib/bonusCalculator";
import { Config, Database, OSRecord } from "@/types/bonus";
import { DEFAULT_CONFIG, CRITERIA } from "@/lib/constants";

// ===== Test Data Fixtures =====
const createMockConfig = (overrides?: Partial<Config>): Config => ({
  ...DEFAULT_CONFIG,
  ...overrides,
});

const createMockOS = (overrides?: Partial<OSRecord>): OSRecord => ({
  id: "os-1",
  employeeId: "emp-1",
  employeeName: "Test Employee",
  role: "Técnico",
  monthKey: "2026-02",
  date: "2026-02-01",
  osId: "OS-001",
  cliente: "Cliente Teste",
  tipo: "manutencao",
  dificuldadeId: "media",
  duracaoId: "1d",
  duracaoMult: 1.0,
  valorOs: 1000,
  setor: "Produção",
  obs: "",
  crit: {
    c_desc: 2,
    c_fotos: 2,
    c_desloc: 1,
    c_pausa: 1,
    c_retrabalho: 2,
    c_prazo: 2,
    c_ferramentas: 2,
    c_materiais: 2,
    c_comunicacao: 2,
  },
  score: 16,
  ce: 1.0,
  ceFinal: 1.0,
  ceQ: 1.0,
  ...overrides,
});

const createMockDatabase = (
  os: OSRecord[] = [],
  horasTrabalhadas: Record<string, Record<string, number>> = {}
): Database => ({
  cfg: createMockConfig(),
  employees: [
    { id: "emp-1", name: "Employee 1", role: "Técnico" },
    { id: "emp-2", name: "Employee 2", role: "Eletricista" },
  ],
  horasTrabalhadas,
  os,
});

// ===== Tests =====

describe("Bonus Calculator - getDifficultyById", () => {
  const cfg = createMockConfig();

  it("should return correct difficulty for valid ID", () => {
    const result = getDifficultyById(cfg, "media");
    expect(result.id).toBe("media");
    expect(result.ce).toBe(1.0);
  });

  it("should return default difficulty for invalid ID", () => {
    const result = getDifficultyById(cfg, "invalid_id");
    expect(result).toBeDefined();
    expect(result.ce).toBeGreaterThan(0);
  });

  it("should return different CE values for different difficulties", () => {
    const facil = getDifficultyById(cfg, "facil");
    const dificil = getDifficultyById(cfg, "dificil");
    expect(dificil.ce).toBeGreaterThan(facil.ce);
  });
});

describe("Bonus Calculator - getDurationById", () => {
  const cfg = createMockConfig();

  it("should return correct duration for valid ID", () => {
    const result = getDurationById(cfg, "1d");
    expect(result.id).toBe("1d");
    expect(result.mult).toBe(1.0);
  });

  it("should return higher multiplier for longer durations", () => {
    const short = getDurationById(cfg, "1d");
    const long = getDurationById(cfg, "1s");
    expect(long.mult).toBeGreaterThan(short.mult);
  });

  it("should return default duration for invalid ID", () => {
    const result = getDurationById(cfg, "invalid_id");
    expect(result).toBeDefined();
    expect(result.mult).toBeGreaterThan(0);
  });
});

describe("Bonus Calculator - calculateMaxPts", () => {
  it("should calculate correct maximum points from criteria", () => {
    const maxPts = calculateMaxPts();
    const expected = CRITERIA.reduce((sum, c) => sum + c.max, 0);
    expect(maxPts).toBe(expected);
    expect(maxPts).toBe(16); // Based on current CRITERIA
  });
});

describe("Bonus Calculator - getMonthOS", () => {
  it("should filter OS records by month", () => {
    const os = [
      createMockOS({ id: "os-1", monthKey: "2026-02" }),
      createMockOS({ id: "os-2", monthKey: "2026-02" }),
      createMockOS({ id: "os-3", monthKey: "2026-01" }),
    ];
    const db = createMockDatabase(os);

    const result = getMonthOS(db, "2026-02");
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.monthKey === "2026-02")).toBe(true);
  });

  it("should return empty array for month with no OS", () => {
    const db = createMockDatabase([]);
    const result = getMonthOS(db, "2026-12");
    expect(result).toHaveLength(0);
  });
});

describe("Bonus Calculator - getHorasTrabalhadas", () => {
  it("should return hours for existing employee/month", () => {
    const db = createMockDatabase([], {
      "2026-02": { "emp-1": 180, "emp-2": 200 },
    });

    expect(getHorasTrabalhadas(db, "2026-02", "emp-1")).toBe(180);
    expect(getHorasTrabalhadas(db, "2026-02", "emp-2")).toBe(200);
  });

  it("should return 0 for non-existing month", () => {
    const db = createMockDatabase([], {});
    expect(getHorasTrabalhadas(db, "2026-12", "emp-1")).toBe(0);
  });

  it("should return 0 for non-existing employee", () => {
    const db = createMockDatabase([], {
      "2026-02": { "emp-1": 180 },
    });
    expect(getHorasTrabalhadas(db, "2026-02", "emp-3")).toBe(0);
  });
});

describe("Bonus Calculator - calcMedianCE", () => {
  it("should calculate median CE correctly for odd number of employees", () => {
    const os = [
      createMockOS({ employeeId: "emp-1", ceFinal: 10 }),
      createMockOS({ employeeId: "emp-2", ceFinal: 20 }),
      createMockOS({ employeeId: "emp-3", ceFinal: 30 }),
    ];
    const db = createMockDatabase(os);

    const median = calcMedianCE(db, "2026-02");
    expect(median).toBe(20); // Middle value
  });

  it("should calculate median CE correctly for even number of employees", () => {
    const os = [
      createMockOS({ employeeId: "emp-1", ceFinal: 10 }),
      createMockOS({ employeeId: "emp-2", ceFinal: 20 }),
    ];
    const db = createMockDatabase(os);

    const median = calcMedianCE(db, "2026-02");
    expect(median).toBe(15); // Average of two middle values
  });

  it("should return default value (10) for empty OS list", () => {
    const db = createMockDatabase([]);
    const median = calcMedianCE(db, "2026-02");
    expect(median).toBe(10);
  });

  it("should aggregate CE by employee", () => {
    const os = [
      createMockOS({ id: "os-1", employeeId: "emp-1", ceFinal: 5 }),
      createMockOS({ id: "os-2", employeeId: "emp-1", ceFinal: 5 }), // Total: 10
      createMockOS({ id: "os-3", employeeId: "emp-2", ceFinal: 20 }),
    ];
    const db = createMockDatabase(os);

    const median = calcMedianCE(db, "2026-02");
    expect(median).toBe(15); // (10 + 20) / 2
  });
});

describe("Bonus Calculator - calcMediaEquipeCEQ", () => {
  it("should calculate average CEQ across employees", () => {
    const os = [
      createMockOS({ employeeId: "emp-1", ceQ: 8 }),
      createMockOS({ employeeId: "emp-2", ceQ: 12 }),
    ];
    const db = createMockDatabase(os);

    const avg = calcMediaEquipeCEQ(db, "2026-02");
    expect(avg).toBe(10); // (8 + 12) / 2
  });

  it("should return 0 for empty OS list", () => {
    const db = createMockDatabase([]);
    const avg = calcMediaEquipeCEQ(db, "2026-02");
    expect(avg).toBe(0);
  });
});

describe("Bonus Calculator - calcBonusCamadas", () => {
  it("should calculate full bonus for perfect employee", () => {
    const os = [
      createMockOS({
        employeeId: "emp-1",
        score: 16,
        ceFinal: 20,
        ceQ: 20,
        crit: { c_prazo: 2 }, // Prazo cumprido
      }),
    ];
    const db = createMockDatabase(os, {
      "2026-02": { "emp-1": 220 }, // Full hours
    });
    const cfg = createMockConfig();

    const result = calcBonusCamadas(cfg, db, "2026-02", "emp-1", os);

    expect(result.fatorHoras).toBe(1); // Full hours
    expect(result.fatorEsforco).toBe(1); // 100% prazo
    expect(result.fatorQualidade).toBe(1); // Perfect score
    expect(result.bonusTotal).toBeGreaterThan(0);
  });

  it("should apply hours factor correctly", () => {
    const os = [createMockOS({ employeeId: "emp-1", score: 16 })];
    
    const db110 = createMockDatabase(os, {
      "2026-02": { "emp-1": 110 }, // Half hours
    });
    const db220 = createMockDatabase(os, {
      "2026-02": { "emp-1": 220 }, // Full hours
    });
    const cfg = createMockConfig();

    const result110 = calcBonusCamadas(cfg, db110, "2026-02", "emp-1", os);
    const result220 = calcBonusCamadas(cfg, db220, "2026-02", "emp-1", os);

    expect(result110.fatorHoras).toBe(0.5);
    expect(result220.fatorHoras).toBe(1);
    expect(result220.bonusTotal).toBeGreaterThan(result110.bonusTotal);
  });

  it("should cap hours factor at 1", () => {
    const os = [createMockOS({ employeeId: "emp-1" })];
    const db = createMockDatabase(os, {
      "2026-02": { "emp-1": 300 }, // Over expected
    });
    const cfg = createMockConfig();

    const result = calcBonusCamadas(cfg, db, "2026-02", "emp-1", os);
    expect(result.fatorHoras).toBe(1); // Capped at 1
  });

  it("should return zero bonus for zero hours", () => {
    const os = [createMockOS({ employeeId: "emp-1", score: 16 })];
    const db = createMockDatabase(os, {
      "2026-02": { "emp-1": 0 },
    });
    const cfg = createMockConfig();

    const result = calcBonusCamadas(cfg, db, "2026-02", "emp-1", os);
    expect(result.fatorHoras).toBe(0);
    expect(result.bonusTotal).toBe(0);
  });

  it("should calculate quality factor based on average score", () => {
    const os = [
      createMockOS({ id: "os-1", employeeId: "emp-1", score: 8 }),
      createMockOS({ id: "os-2", employeeId: "emp-1", score: 16 }),
    ];
    const db = createMockDatabase(os, {
      "2026-02": { "emp-1": 220 },
    });
    const cfg = createMockConfig();

    const result = calcBonusCamadas(cfg, db, "2026-02", "emp-1", os);
    expect(result.mediaPontuacao).toBe(12); // (8 + 16) / 2
    expect(result.fatorQualidade).toBe(0.75); // 12 / 16
  });

  it("should respect bonus cap", () => {
    const os = [createMockOS({ employeeId: "emp-1", score: 16, crit: { c_prazo: 2 } })];
    const db = createMockDatabase(os, {
      "2026-02": { "emp-1": 220 },
    });
    const cfg = createMockConfig({ bonusCap: 600 });

    const result = calcBonusCamadas(cfg, db, "2026-02", "emp-1", os);
    expect(result.teto).toBe(600);
    expect(result.bonusTotal).toBeLessThanOrEqual(600);
  });
});

describe("Bonus Calculator - calculateOSMetrics", () => {
  it("should calculate correct metrics for OS", () => {
    const cfg = createMockConfig();
    const critValues = {
      c_desc: 2,
      c_fotos: 2,
      c_desloc: 1,
      c_pausa: 1,
      c_retrabalho: 2,
      c_prazo: 2,
      c_ferramentas: 2,
      c_materiais: 2,
      c_comunicacao: 2,
    };

    const result = calculateOSMetrics(critValues, cfg, "media", "1d");

    expect(result.score).toBe(16);
    expect(result.maxPts).toBe(16);
    expect(result.ce).toBe(1.0); // media difficulty
    expect(result.ceFinal).toBe(1.0); // 1.0 * 1.0
    expect(result.ceQ).toBe(1.0); // 1.0 * (16/16)
  });

  it("should apply difficulty multiplier correctly", () => {
    const cfg = createMockConfig();
    const critValues = { c_desc: 2 };

    const facil = calculateOSMetrics(critValues, cfg, "facil", "1d");
    const dificil = calculateOSMetrics(critValues, cfg, "dificil", "1d");

    expect(dificil.ce).toBeGreaterThan(facil.ce);
    expect(dificil.ceFinal).toBeGreaterThan(facil.ceFinal);
  });

  it("should apply duration multiplier correctly", () => {
    const cfg = createMockConfig();
    const critValues = { c_desc: 2 };

    const short = calculateOSMetrics(critValues, cfg, "media", "1d");
    const long = calculateOSMetrics(critValues, cfg, "media", "1s");

    expect(long.ceFinal).toBeGreaterThan(short.ceFinal);
    expect(long.dur.mult).toBeGreaterThan(short.dur.mult);
  });

  it("should calculate CEQ proportionally to score", () => {
    const cfg = createMockConfig();
    
    const halfScore = calculateOSMetrics(
      { c_desc: 1, c_fotos: 1, c_desloc: 1, c_pausa: 1, c_retrabalho: 1, c_prazo: 1, c_ferramentas: 1, c_materiais: 1 },
      cfg,
      "media",
      "1d"
    );
    const fullScore = calculateOSMetrics(
      { c_desc: 2, c_fotos: 2, c_desloc: 1, c_pausa: 1, c_retrabalho: 2, c_prazo: 2, c_ferramentas: 2, c_materiais: 2, c_comunicacao: 2 },
      cfg,
      "media",
      "1d"
    );

    expect(fullScore.ceQ).toBeGreaterThan(halfScore.ceQ);
  });
});

describe("Bonus Calculator - Layer Weights", () => {
  it("should respect layer weights configuration", () => {
    const os = [
      createMockOS({
        employeeId: "emp-1",
        score: 16,
        crit: { c_prazo: 2 },
      }),
    ];
    const db = createMockDatabase(os, {
      "2026-02": { "emp-1": 220 },
    });
    const cfg = createMockConfig({
      layerWeights: { esforco: 0.5, qualidade: 0.4, superacao: 0.1 },
    });

    const result = calcBonusCamadas(cfg, db, "2026-02", "emp-1", os);

    // With full scores, bonus should follow weights
    const expectedEsforco = 600 * 0.5 * 1; // teto * weight * factor
    const expectedQualidade = 600 * 0.4 * 1;

    expect(result.bonusEsforco).toBe(expectedEsforco);
    expect(result.bonusQualidade).toBe(expectedQualidade);
  });
});
