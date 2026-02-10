// G2R Bonus Management Types

export interface Employee {
  id: string;
  name: string;
  role: string;
}

export interface Criterion {
  id: string;
  title: string;
  desc: string;
  max: number;
}

export interface DifficultyWeight {
  id: string;
  label: string;
  ce: number;
  desc: string;
}

export interface DurationWeight {
  id: string;
  label: string;
  mult: number;
}

export interface LayerWeights {
  esforco: number;
  qualidade: number;
  superacao: number;
}

export interface Config {
  bonusCap: number;
  maxPts: number;
  horasEsperadas: number;
  layerWeights: LayerWeights;
  durationWeights: DurationWeight[];
  difficultyWeights: DifficultyWeight[];
}

export interface OSRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  monthKey: string;
  date: string;
  osId: string;
  cliente: string;
  tipo: string;
  dificuldadeId: string;
  duracaoId: string;
  duracaoMult: number;
  valorOs: number;
  setor: string;
  obs: string;
  crit: Record<string, number>;
  score: number;
  ce: number;
  ceFinal: number;
  ceQ: number;
}

export interface HorasTrabalhadas {
  [monthKey: string]: {
    [empId: string]: number;
  };
}

export interface Database {
  cfg: Config;
  employees: Employee[];
  horasTrabalhadas: HorasTrabalhadas;
  os: OSRecord[];
}

export interface BonusCamadas {
  fatorEsforco: number;
  fatorQualidade: number;
  fatorSuperacao: number;
  fatorHoras: number;
  bonusEsforco: number;
  bonusQualidade: number;
  bonusSuperacao: number;
  bonusCamadas: number;
  bonusTotal: number;
  teto: number;
  ceReferencia: number;
  mediaEquipeCEQ: number;
  ceTotal: number;
  ceQTotal: number;
  mediaPontuacao: number;
  qtdOS: number;
  osDentroPrazo: number;
  taxaPrazo: number;
  horasTrabalhadas: number;
  horasEsperadas: number;
}

export type TabType = 'os' | 'colaboradores' | 'config' | 'horasAuvo';
export type SortType = 'data_desc' | 'data_asc' | 'score_desc' | 'score_asc' | 'ceq_desc' | 'ceq_asc';
