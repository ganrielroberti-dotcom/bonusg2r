import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { OSRecord, Employee, TabType, Config, Database } from "@/types/bonus";
import { DEFAULT_CONFIG } from "@/lib/constants";

interface BonusContextValue {
  db: Database;
  monthKey: string;
  setMonthKey: (mk: string) => void;
  selectedEmployeeId: string;
  setSelectedEmployeeId: (id: string) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isLoading: boolean;
  
  // OS Operations
  saveOS: (rec: OSRecord) => Promise<void>;
  removeOS: (id: string) => Promise<void>;
  getMonthOSList: () => OSRecord[];
  
  // Employee Operations
  addEmployee: (name: string, role: string, email: string) => Promise<void>;
  removeEmployee: (id: string) => Promise<void>;
  
  // Hours Operations
  setHorasTrabalhadas: (empId: string, horas: number) => Promise<void>;
  
  // Config Operations
  updateConfig: (cfg: Partial<Config>) => Promise<void>;
  
  // Misc
  refreshDB: () => Promise<void>;
}

const BonusContext = createContext<BonusContextValue | null>(null);

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function BonusProvider({ children }: { children: React.ReactNode }) {
  const { user, isGestor } = useAuth();
  const [db, setDB] = useState<Database>({
    cfg: { ...DEFAULT_CONFIG },
    employees: [],
    horasTrabalhadas: {},
    os: [],
  });
  const [monthKey, setMonthKey] = useState<string>(() => currentMonthKey());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabType>("os");
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch config
      const { data: configData } = await supabase
        .from("config")
        .select("*")
        .limit(1)
        .single();

      // Fetch employees
      const { data: employeesData } = await supabase
        .from("employees")
        .select("*")
        .order("name");

      // Fetch OS records
      const { data: osData } = await supabase
        .from("os_records")
        .select("*")
        .order("date", { ascending: false });

      // Fetch horas trabalhadas
      const { data: horasData } = await supabase
        .from("horas_trabalhadas")
        .select("*");

      // Build database object
      const cfg: Config = configData ? {
        bonusCap: Number(configData.bonus_cap) || DEFAULT_CONFIG.bonusCap,
        maxPts: configData.max_pts || DEFAULT_CONFIG.maxPts,
        horasEsperadas: configData.horas_esperadas || DEFAULT_CONFIG.horasEsperadas,
        layerWeights: (configData.layer_weights as unknown as Config["layerWeights"]) || DEFAULT_CONFIG.layerWeights,
        durationWeights: (configData.duration_weights as unknown as Config["durationWeights"]) || DEFAULT_CONFIG.durationWeights,
        difficultyWeights: (configData.difficulty_weights as unknown as Config["difficultyWeights"]) || DEFAULT_CONFIG.difficultyWeights,
      } : { ...DEFAULT_CONFIG };

      const employees: Employee[] = (employeesData || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        role: e.role,
        email: e.email,
      }));

      const os: OSRecord[] = (osData || []).map((r: any) => ({
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
        crit: r.crit || {},
        score: r.score,
        ce: Number(r.ce),
        ceFinal: Number(r.ce_final),
        ceQ: Number(r.ce_q),
      }));

      const horasTrabalhadas: { [monthKey: string]: { [empId: string]: number } } = {};
      for (const h of horasData || []) {
        if (!horasTrabalhadas[h.month_key]) {
          horasTrabalhadas[h.month_key] = {};
        }
        horasTrabalhadas[h.month_key][h.employee_id] = Number(h.horas);
      }

      setDB({ cfg, employees, horasTrabalhadas, os });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (db.employees.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(db.employees[0].id);
    }
  }, [db.employees, selectedEmployeeId]);

  const saveOS = useCallback(async (rec: OSRecord) => {
    if (!isGestor) return;
    
    const osRecord = {
      id: rec.id,
      employee_id: rec.employeeId,
      employee_name: rec.employeeName,
      employee_role: rec.role,
      month_key: rec.monthKey,
      date: rec.date,
      os_id: rec.osId,
      cliente: rec.cliente,
      tipo: rec.tipo,
      dificuldade_id: rec.dificuldadeId,
      duracao_id: rec.duracaoId,
      duracao_mult: rec.duracaoMult,
      valor_os: rec.valorOs,
      setor: rec.setor,
      obs: rec.obs,
      crit: rec.crit,
      score: rec.score,
      ce: rec.ce,
      ce_final: rec.ceFinal,
      ce_q: rec.ceQ,
    };

    const { error } = await supabase
      .from("os_records")
      .upsert(osRecord, { onConflict: "id" });

    if (error) {
      console.error("Error saving OS:", error);
      throw error;
    }

    await fetchData();
  }, [isGestor, fetchData]);

  const removeOS = useCallback(async (id: string) => {
    if (!isGestor) return;
    
    const { error } = await supabase
      .from("os_records")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting OS:", error);
      throw error;
    }

    await fetchData();
  }, [isGestor, fetchData]);

  const getMonthOSList = useCallback(() => {
    return db.os.filter((r) => r.monthKey === monthKey);
  }, [db.os, monthKey]);

  const addEmployee = useCallback(async (name: string, role: string, email: string) => {
    if (!isGestor) return;
    
    const { error } = await supabase
      .from("employees")
      .insert({ name, role, email });

    if (error) {
      console.error("Error adding employee:", error);
      throw error;
    }

    await fetchData();
  }, [isGestor, fetchData]);

  const removeEmployee = useCallback(async (id: string) => {
    if (!isGestor) return;
    
    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting employee:", error);
      throw error;
    }

    await fetchData();
  }, [isGestor, fetchData]);

  const setHorasTrabalhadas = useCallback(async (empId: string, horas: number) => {
    if (!isGestor) return;
    
    const { error } = await supabase
      .from("horas_trabalhadas")
      .upsert(
        { month_key: monthKey, employee_id: empId, horas },
        { onConflict: "month_key,employee_id" }
      );

    if (error) {
      console.error("Error setting horas:", error);
      throw error;
    }

    await fetchData();
  }, [isGestor, monthKey, fetchData]);

  const updateConfig = useCallback(async (cfg: Partial<Config>) => {
    if (!isGestor) return;
    
    const updateData: any = {};
    if (cfg.bonusCap !== undefined) updateData.bonus_cap = cfg.bonusCap;
    if (cfg.maxPts !== undefined) updateData.max_pts = cfg.maxPts;
    if (cfg.horasEsperadas !== undefined) updateData.horas_esperadas = cfg.horasEsperadas;
    if (cfg.layerWeights) updateData.layer_weights = cfg.layerWeights;
    if (cfg.durationWeights) updateData.duration_weights = cfg.durationWeights;
    if (cfg.difficultyWeights) updateData.difficulty_weights = cfg.difficultyWeights;

    const { data: existingConfig } = await supabase
      .from("config")
      .select("id")
      .limit(1)
      .single();

    if (existingConfig) {
      const { error } = await supabase
        .from("config")
        .update(updateData)
        .eq("id", existingConfig.id);

      if (error) {
        console.error("Error updating config:", error);
        throw error;
      }
    } else {
      const { error } = await supabase
        .from("config")
        .insert(updateData);

      if (error) {
        console.error("Error creating config:", error);
        throw error;
      }
    }

    await fetchData();
  }, [isGestor, fetchData]);

  const refreshDB = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const value: BonusContextValue = {
    db,
    monthKey,
    setMonthKey,
    selectedEmployeeId,
    setSelectedEmployeeId,
    activeTab,
    setActiveTab,
    isLoading,
    saveOS,
    removeOS,
    getMonthOSList,
    addEmployee,
    removeEmployee,
    setHorasTrabalhadas,
    updateConfig,
    refreshDB,
  };

  return <BonusContext.Provider value={value}>{children}</BonusContext.Provider>;
}

export function useBonus() {
  const context = useContext(BonusContext);
  if (!context) {
    throw new Error("useBonus must be used within a BonusProvider");
  }
  return context;
}
