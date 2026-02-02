import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDataFetcher } from "@/hooks/useDataFetcher";
import { useOSOperations } from "@/hooks/useOSOperations";
import { useEmployeeOperations } from "@/hooks/useEmployeeOperations";
import { useConfigOperations } from "@/hooks/useConfigOperations";
import { useHorasOperations } from "@/hooks/useHorasOperations";
import { OSRecord, TabType, Config, Database } from "@/types/bonus";
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
  error: string | null;
  
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
  const [monthKey, setMonthKey] = useState<string>(() => currentMonthKey());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabType>("os");

  // Use the data fetcher hook
  const { db, isLoading, error, fetchData } = useDataFetcher(user);

  // Use operation hooks with unified refresh callback
  const osOperations = useOSOperations({ isGestor, onSuccess: fetchData });
  const employeeOperations = useEmployeeOperations({ isGestor, onSuccess: fetchData });
  const configOperations = useConfigOperations({ isGestor, onSuccess: fetchData });
  const horasOperations = useHorasOperations({ isGestor, monthKey, onSuccess: fetchData });

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-select first employee when list loads
  useEffect(() => {
    if (db.employees.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(db.employees[0].id);
    }
  }, [db.employees, selectedEmployeeId]);

  // Filter OS by month
  const getMonthOSList = useCallback(() => {
    return db.os.filter((r) => r.monthKey === monthKey);
  }, [db.os, monthKey]);

  // Wrapper functions to maintain API compatibility
  const saveOS = useCallback(async (rec: OSRecord) => {
    await osOperations.saveOS(rec);
  }, [osOperations]);

  const removeOS = useCallback(async (id: string) => {
    await osOperations.removeOS(id);
  }, [osOperations]);

  const addEmployee = useCallback(async (name: string, role: string, email: string) => {
    await employeeOperations.addEmployee(name, role, email);
  }, [employeeOperations]);

  const removeEmployee = useCallback(async (id: string) => {
    await employeeOperations.removeEmployee(id);
  }, [employeeOperations]);

  const setHorasTrabalhadas = useCallback(async (empId: string, horas: number) => {
    await horasOperations.setHorasTrabalhadas(empId, horas);
  }, [horasOperations]);

  const updateConfig = useCallback(async (cfg: Partial<Config>) => {
    await configOperations.updateConfig(cfg);
  }, [configOperations]);

  const value: BonusContextValue = {
    db,
    monthKey,
    setMonthKey,
    selectedEmployeeId,
    setSelectedEmployeeId,
    activeTab,
    setActiveTab,
    isLoading,
    error,
    saveOS,
    removeOS,
    getMonthOSList,
    addEmployee,
    removeEmployee,
    setHorasTrabalhadas,
    updateConfig,
    refreshDB: fetchData,
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
