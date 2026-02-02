// Audit Log Types

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

export interface AuditLogFilters {
  tableName?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
  limit?: number;
}

export interface AuditStats {
  total: number;
  inserts: number;
  updates: number;
  deletes: number;
  uniqueUsers: number;
  tablesAffected: number;
}

export const TABLE_LABELS: Record<string, string> = {
  os_records: "Ordens de Serviço",
  employees: "Colaboradores",
  config: "Configurações",
  horas_trabalhadas: "Horas Trabalhadas",
};

export const ACTION_CONFIG: Record<string, { label: string; icon: string; colorClass: string }> = {
  INSERT: { 
    label: "Criação", 
    icon: "plus-circle",
    colorClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
  },
  UPDATE: { 
    label: "Atualização", 
    icon: "pencil",
    colorClass: "text-blue-400 bg-blue-500/10 border-blue-500/20" 
  },
  DELETE: { 
    label: "Exclusão", 
    icon: "trash-2",
    colorClass: "text-red-400 bg-red-500/10 border-red-500/20" 
  },
};
