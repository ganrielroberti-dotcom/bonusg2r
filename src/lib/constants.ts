import { Criterion, Config, Employee } from "@/types/bonus";

export const STORAGE_KEY = "g2r_bonus_db_v2";

export const CRITERIA: Criterion[] = [
  { id: "c_desc", title: "Descrição técnica clara", desc: "Descreve o problema e a solução de forma objetiva", max: 2 },
  { id: "c_fotos", title: "Fotos relevantes anexadas", desc: "Mostram claramente a intervenção", max: 2 },
  { id: "c_desloc", title: "Deslocamento preenchido", desc: "Distância registrada coerente", max: 1 },
  { id: "c_pausa", title: "Pausa registrada (se houver)", desc: "Justificada com horário e motivo", max: 1 },
  { id: "c_retrabalho", title: "Sem erros / retrabalho", desc: "OS aprovada sem revisões", max: 2 },
  { id: "c_prazo", title: "Prazo cumprido", desc: "Execução dentro do tempo médio estimado", max: 2 },
  { id: "c_ferramentas", title: "Organização de ferramentas", desc: "Nenhuma perda + maleta organizada", max: 2 },
  { id: "c_materiais", title: "Controle de materiais", desc: "Caixa identificada + organizada", max: 2 },
  { id: "c_comunicacao", title: "Comunicação Clara", desc: "Clareza na comunicação com cliente e equipe", max: 2 },
];

export const DEFAULT_CONFIG: Config = {
  bonusCap: 600,
  maxPts: 16,
  horasEsperadas: 220,
  layerWeights: {
    esforco: 0.50,
    qualidade: 0.40,
    superacao: 0.10,
  },
  durationWeights: [
    { id: "1d", label: "Até 1 dia", mult: 1.0 },
    { id: "2-3d", label: "2-3 dias", mult: 2.0 },
    { id: "4-5d", label: "4-5 dias", mult: 3.5 },
    { id: "1s", label: "1 semana", mult: 5.0 },
    { id: "2s", label: "2 semanas", mult: 8.0 },
    { id: "1m", label: "Mês todo", mult: 12.0 },
  ],
  difficultyWeights: [
    { id: "facil", label: "Fácil", ce: 0.7, desc: "Tarefa simples, baixo risco, execução rápida" },
    { id: "media", label: "Média", ce: 1.0, desc: "OS padrão (referência) — esforço médio" },
    { id: "dificil", label: "Difícil", ce: 1.5, desc: "Diagnóstico/trabalho complexo ou acesso difícil" },
    { id: "muito_dificil", label: "Muito difícil", ce: 1.8, desc: "Alta complexidade/risco/urgência" },
  ],
};

export const DEFAULT_EMPLOYEES: Employee[] = [
  { id: "emp_1", name: "Sanderlei", role: "Auxiliar" },
  { id: "emp_2", name: "Gustavo", role: "Eletricista" },
];

export const OS_TYPES = [
  { value: "manutencao", label: "Manutenção" },
  { value: "instalacao", label: "Instalação" },
  { value: "montagem_painel", label: "Montagem de Painel" },
  { value: "outros", label: "Outros" },
];
