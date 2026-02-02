import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, History, Sparkles } from "lucide-react";
import { useAuditLog } from "@/hooks/useCachedQueries";
import { AuditLogFilters, AuditStats } from "./types";
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
      transition={{ duration: 0.4 }}
      className={`space-y-5 sm:space-y-6 ${className || ""}`}
    >
      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 via-transparent to-transparent p-5 sm:p-6"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-success/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <motion.div 
            className="p-3 rounded-xl bg-primary/10 text-primary w-fit ring-1 ring-primary/20"
            whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.3 }}
          >
            <Shield className="w-7 h-7 sm:w-8 sm:h-8" />
          </motion.div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                Log de Auditoria
              </h2>
              <motion.span 
                className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full bg-gradient-to-r from-primary/20 to-success/20 text-primary border border-primary/20"
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-3 h-3" />
                Pro
              </motion.span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-lg">
              Rastreamento completo e seguro de todas as alterações realizadas no sistema. 
              Transparência total para auditoria e compliance.
            </p>
          </div>
        </div>
      </motion.div>

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

      {/* Timeline Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-xl border border-border/40 overflow-hidden"
      >
        {/* Section header */}
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-border/30 bg-secondary/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10">
              <History className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm sm:text-base">Timeline de Alterações</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Histórico cronológico detalhado</p>
            </div>
          </div>
          <span className="text-[10px] sm:text-xs text-muted-foreground px-2.5 py-1 rounded-full bg-secondary/50">
            {filteredLogs.length} registro{filteredLogs.length !== 1 ? "s" : ""}
          </span>
        </div>
        
        {/* Timeline content */}
        <div className="p-4 sm:p-5">
          <AuditTimeline entries={filteredLogs} isLoading={isLoading} />
        </div>
      </motion.div>
    </motion.div>
  );
}
