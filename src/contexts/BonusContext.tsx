import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Database, OSRecord, Employee, TabType, Config } from "@/types/bonus";
import {
  ensureDatabase,
  saveDatabase,
  generateId,
  upsertOS,
  deleteOS as dbDeleteOS,
  addEmployee as dbAddEmployee,
  deleteEmployee as dbDeleteEmployee,
  currentMonthKey,
  getMonthOS,
  setHorasTrabalhadas as dbSetHorasTrabalhadas,
} from "@/lib/database";

interface BonusContextValue {
  db: Database;
  monthKey: string;
  setMonthKey: (mk: string) => void;
  selectedEmployeeId: string;
  setSelectedEmployeeId: (id: string) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  
  // OS Operations
  saveOS: (rec: OSRecord) => void;
  removeOS: (id: string) => void;
  getMonthOSList: () => OSRecord[];
  
  // Employee Operations
  addEmployee: (name: string, role: string) => void;
  removeEmployee: (id: string) => void;
  
  // Hours Operations
  setHorasTrabalhadas: (empId: string, horas: number) => void;
  
  // Config Operations
  updateConfig: (cfg: Partial<Config>) => void;
  
  // Misc
  refreshDB: () => void;
  resetAll: () => void;
}

const BonusContext = createContext<BonusContextValue | null>(null);

export function BonusProvider({ children }: { children: React.ReactNode }) {
  const [db, setDB] = useState<Database>(() => ensureDatabase());
  const [monthKey, setMonthKey] = useState<string>(() => currentMonthKey());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabType>("os");

  useEffect(() => {
    if (db.employees.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(db.employees[0].id);
    }
  }, [db.employees, selectedEmployeeId]);

  const refreshDB = useCallback(() => {
    setDB(ensureDatabase());
  }, []);

  const saveOS = useCallback((rec: OSRecord) => {
    const currentDB = ensureDatabase();
    upsertOS(currentDB, rec);
    setDB({ ...currentDB });
  }, []);

  const removeOS = useCallback((id: string) => {
    const currentDB = ensureDatabase();
    dbDeleteOS(currentDB, id);
    setDB({ ...currentDB });
  }, []);

  const getMonthOSList = useCallback(() => {
    return getMonthOS(db, monthKey);
  }, [db, monthKey]);

  const addEmployee = useCallback((name: string, role: string) => {
    const currentDB = ensureDatabase();
    dbAddEmployee(currentDB, { id: generateId(), name, role });
    setDB({ ...currentDB });
  }, []);

  const removeEmployee = useCallback((id: string) => {
    const currentDB = ensureDatabase();
    dbDeleteEmployee(currentDB, id);
    setDB({ ...currentDB });
  }, []);

  const setHorasTrabalhadas = useCallback((empId: string, horas: number) => {
    const currentDB = ensureDatabase();
    dbSetHorasTrabalhadas(currentDB, monthKey, empId, horas);
    saveDatabase(currentDB);
    setDB({ ...currentDB });
  }, [monthKey]);

  const updateConfig = useCallback((cfg: Partial<Config>) => {
    const currentDB = ensureDatabase();
    currentDB.cfg = { ...currentDB.cfg, ...cfg };
    saveDatabase(currentDB);
    setDB({ ...currentDB });
  }, []);

  const resetAll = useCallback(() => {
    localStorage.removeItem("g2r_bonus_db_v2");
    window.location.reload();
  }, []);

  const value: BonusContextValue = {
    db,
    monthKey,
    setMonthKey,
    selectedEmployeeId,
    setSelectedEmployeeId,
    activeTab,
    setActiveTab,
    saveOS,
    removeOS,
    getMonthOSList,
    addEmployee,
    removeEmployee,
    setHorasTrabalhadas,
    updateConfig,
    refreshDB,
    resetAll,
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
