import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Config, Employee, OSRecord, Database } from "@/types/bonus";
import { DEFAULT_CONFIG } from "@/lib/constants";

interface LoadingState {
  initial: boolean;
  refreshing: boolean;
  config: boolean;
  employees: boolean;
  os: boolean;
  horas: boolean;
}

const initialLoadingState: LoadingState = {
  initial: true,
  refreshing: false,
  config: false,
  employees: false,
  os: false,
  horas: false,
};

export function useDataFetcher(user: User | null) {
  const [db, setDB] = useState<Database>({
    cfg: { ...DEFAULT_CONFIG },
    employees: [],
    horasTrabalhadas: {},
    os: [],
  });
  const [loading, setLoading] = useState<LoadingState>(initialLoadingState);
  const [error, setError] = useState<string | null>(null);

  const setLoadingState = useCallback((key: keyof LoadingState, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(initialLoadingState);
      return;
    }
    
    setLoadingState("refreshing", true);
    setError(null);
    
    try {
      // Fetch all data in parallel
      const [configResult, employeesResult, osResult, horasResult] = await Promise.all([
        supabase.from("config").select("*").limit(1).single(),
        supabase.from("employees").select("*").order("name"),
        supabase.from("os_records").select("*").order("date", { ascending: false }),
        supabase.from("horas_trabalhadas").select("*"),
      ]);

      // Build config
      const configData = configResult.data;
      const cfg: Config = configData ? {
        bonusCap: Number(configData.bonus_cap) || DEFAULT_CONFIG.bonusCap,
        maxPts: configData.max_pts || DEFAULT_CONFIG.maxPts,
        horasEsperadas: configData.horas_esperadas || DEFAULT_CONFIG.horasEsperadas,
        layerWeights: (configData.layer_weights as unknown as Config["layerWeights"]) || DEFAULT_CONFIG.layerWeights,
        durationWeights: (configData.duration_weights as unknown as Config["durationWeights"]) || DEFAULT_CONFIG.durationWeights,
        difficultyWeights: (configData.difficulty_weights as unknown as Config["difficultyWeights"]) || DEFAULT_CONFIG.difficultyWeights,
      } : { ...DEFAULT_CONFIG };

      // Build employees
      const employees: Employee[] = (employeesResult.data || []).map((e) => ({
        id: e.id,
        name: e.name,
        role: e.role,
        email: e.email,
      }));

      // Build OS records
      const os: OSRecord[] = (osResult.data || []).map((r) => ({
        id: r.id,
        employeeId: r.employee_id,
        employeeName: r.employee_name,
        role: r.employee_role,
        monthKey: r.month_key,
        date: r.date,
        osId: r.os_id,
        cliente: r.cliente,
        tipo: r.tipo,
        dificuldadeId: r.dificuldade_id,
        duracaoId: r.duracao_id,
        duracaoMult: Number(r.duracao_mult),
        valorOs: Number(r.valor_os),
        setor: r.setor,
        obs: r.obs,
        crit: r.crit as Record<string, number> || {},
        score: r.score,
        ce: Number(r.ce),
        ceFinal: Number(r.ce_final),
        ceQ: Number(r.ce_q),
      }));

      // Build horas trabalhadas
      const horasTrabalhadas: { [monthKey: string]: { [empId: string]: number } } = {};
      for (const h of horasResult.data || []) {
        if (!horasTrabalhadas[h.month_key]) {
          horasTrabalhadas[h.month_key] = {};
        }
        horasTrabalhadas[h.month_key][h.employee_id] = Number(h.horas);
      }

      setDB({ cfg, employees, horasTrabalhadas, os });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar dados";
      console.error("Error fetching data:", err);
      setError(message);
    } finally {
      setLoading({ ...initialLoadingState, initial: false });
    }
  }, [user, setLoadingState]);

  return {
    db,
    loading,
    error,
    fetchData,
    isLoading: loading.initial || loading.refreshing,
  };
}
