import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, History } from "lucide-react";
import { useAuditLog } from "@/hooks/useCachedQueries";
import { AuditLogFilters, AuditStats, AuditLogEntry } from "./types";
import { AuditStatsCards } from "./AuditStatsCards";
import { AuditFilters } from "./AuditFilters";
import { AuditTimeline } from "./AuditTimeline";
import { AuditActivityChart } from "./AuditActivityChart";

interface AuditLogViewerProps {
  className?: string;
}

export function AuditLogViewer({ className }: AuditLogViewerProps) {
  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: 50,
  });

  const queryFilters = useMemo(() => ({
    tableName: filters.tableName,
    startDate: filters.startDate,
    endDate: filters.endDate,
    limit: filters.limit || 50,
  }), [filters.tableName, filters.startDate, filters.endDate, filters.limit]);

  const { data: auditLogs = [], isLoading, refetch, isFetching } = useAuditLog(queryFilters);

  // Client-side filtering for search and action
  const filteredLogs = useMemo(() => {
    let result = auditLogs;

    if (filters.action) {
      result = result.filter(log => log.action === filters.action);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(log => 
        log.changed_by_email?.toLowerCase().includes(term) ||
        log.record_id.toLowerCase().includes(term) ||
        JSON.stringify(log.new_data).toLowerCase().includes(term) ||
        JSON.stringify(log.old_data).toLowerCase().includes(term)
      );
    }

    return result;
  }, [auditLogs, filters.action, filters.searchTerm]);

  // Calculate stats
  const stats: AuditStats = useMemo(() => {
    const uniqueUsers = new Set(filteredLogs.map(l => l.changed_by_email).filter(Boolean));
    const tablesAffected = new Set(filteredLogs.map(l => l.table_name));

    return {
      total: filteredLogs.length,
      inserts: filteredLogs.filter(l => l.action === "INSERT").length,
      updates: filteredLogs.filter(l => l.action === "UPDATE").length,
      deletes: filteredLogs.filter(l => l.action === "DELETE").length,
      uniqueUsers: uniqueUsers.size,
      tablesAffected: tablesAffected.size,
    };
  }, [filteredLogs]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.tableName) count++;
    if (filters.action) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.searchTerm) count++;
    return count;
  }, [filters]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`space-y-6 ${className || ""}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            Log de Auditoria
            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              Beta
            </span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Rastreamento completo de todas as alterações no sistema
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <AuditStatsCards stats={stats} isLoading={isLoading} />

      {/* Activity Chart */}
      <AuditActivityChart entries={auditLogs} />

      {/* Filters */}
      <AuditFilters
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        activeFiltersCount={activeFiltersCount}
      />

      {/* Timeline */}
      <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <History className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Timeline de Alterações</h3>
          <span className="text-xs text-muted-foreground ml-auto">
            {filteredLogs.length} registro{filteredLogs.length !== 1 ? "s" : ""}
          </span>
        </div>
        
        <AuditTimeline entries={filteredLogs} isLoading={isLoading} />
      </div>
    </motion.div>
  );
}
