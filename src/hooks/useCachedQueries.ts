import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Config, Employee, OSRecord } from "@/types/bonus";
import { DEFAULT_CONFIG } from "@/lib/constants";

// ===== Query Keys =====
export const queryKeys = {
  config: ["config"] as const,
  employees: ["employees"] as const,
  osRecords: (monthKey?: string) => ["os_records", monthKey] as const,
  horasTrabalhadas: (monthKey?: string) => ["horas_trabalhadas", monthKey] as const,
  auditLog: (filters?: AuditLogFilters) => ["audit_log", filters] as const,
};

// ===== Types =====
interface AuditLogFilters {
  tableName?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_by: string | null;
  changed_by_email: string | null;
  changed_at: string;
}

// ===== Config Query =====
export function useConfig() {
  return useQuery({
    queryKey: queryKeys.config,
    queryFn: async (): Promise<Config> => {
      const { data, error } = await supabase
        .from("config")
        .select("*")
        .limit(1)
        .single();

      if (error || !data) {
        console.warn("Using default config:", error?.message);
        return DEFAULT_CONFIG;
      }

      return {
        bonusCap: data.bonus_cap,
        maxPts: data.max_pts,
        horasEsperadas: data.horas_esperadas,
        layerWeights: data.layer_weights as unknown as Config["layerWeights"],
        durationWeights: data.duration_weights as unknown as Config["durationWeights"],
        difficultyWeights: data.difficulty_weights as unknown as Config["difficultyWeights"],
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });
}

// ===== Employees Query =====
export function useEmployees() {
  return useQuery({
    queryKey: queryKeys.employees,
    queryFn: async (): Promise<Employee[]> => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching employees:", error);
        return [];
      }

      return data.map((emp) => ({
        id: emp.id,
        name: emp.name,
        role: emp.role,
      }));
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });
}

// ===== OS Records Query =====
export function useOSRecords(monthKey?: string) {
  return useQuery({
    queryKey: queryKeys.osRecords(monthKey),
    queryFn: async (): Promise<OSRecord[]> => {
      let query = supabase
        .from("os_records")
        .select("*")
        .order("date", { ascending: false });

      if (monthKey) {
        query = query.eq("month_key", monthKey);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching OS records:", error);
        return [];
      }

      return data.map((os) => ({
        id: os.id,
        employeeId: os.employee_id,
        employeeName: os.employee_name,
        role: os.employee_role,
        monthKey: os.month_key,
        date: os.date,
        osId: os.os_id,
        cliente: os.cliente,
        tipo: os.tipo,
        dificuldadeId: os.dificuldade_id,
        duracaoId: os.duracao_id,
        duracaoMult: os.duracao_mult,
        valorOs: os.valor_os,
        setor: os.setor,
        obs: os.obs,
        crit: os.crit as Record<string, number>,
        score: os.score,
        ce: os.ce,
        ceFinal: os.ce_final,
        ceQ: os.ce_q,
      }));
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

// ===== Audit Log Query =====
export function useAuditLog(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: queryKeys.auditLog(filters),
    queryFn: async (): Promise<AuditLogEntry[]> => {
      let query = supabase
        .from("audit_log")
        .select("*")
        .order("changed_at", { ascending: false })
        .limit(filters?.limit || 100);

      if (filters?.tableName) {
        query = query.eq("table_name", filters.tableName);
      }
      if (filters?.startDate) {
        query = query.gte("changed_at", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("changed_at", filters.endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching audit log:", error);
        return [];
      }

      return data as AuditLogEntry[];
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes cache
  });
}

// ===== Prefetch Utilities =====
export function usePrefetchConfig() {
  // This can be used to prefetch config on app load
  return useConfig();
}
