import { useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Loader2, Clock, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuvoSync } from "@/hooks/useAuvoIntegration";
import { useBonus } from "@/contexts/BonusContext";
import { AuvoUserMapping } from "./AuvoUserMapping";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AuvoHoursReport() {
  const { db, monthKey, setMonthKey } = useBonus();
  const { isSyncing, lastSync, hoursCache, triggerSync, fetchLastSync, fetchHoursCache } = useAuvoSync();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshData = useCallback(() => {
    fetchLastSync(monthKey);
    fetchHoursCache(monthKey);
  }, [monthKey, fetchLastSync, fetchHoursCache]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auto-refresh every 15 min
  useEffect(() => {
    intervalRef.current = setInterval(refreshData, 15 * 60 * 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshData]);

  const handleSync = async () => {
    await triggerSync(monthKey);
    refreshData();
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="default" className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]"><CheckCircle2 className="w-3 h-3 mr-1" />Sucesso</Badge>;
      case "partial":
        return <Badge variant="default" className="bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]"><AlertCircle className="w-3 h-3 mr-1" />Parcial</Badge>;
      case "error":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Erro</Badge>;
      case "running":
        return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Executando</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Relatório de Horas (Auvo)</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">{monthKey}</span>
          <Button
            onClick={handleSync}
            disabled={isSyncing}
            size="sm"
            className="btn-primary-glow gap-1.5"
          >
            {isSyncing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {isSyncing ? "Sincronizando..." : "Atualizar agora"}
          </Button>
        </div>
      </div>

      {/* Last sync info */}
      {lastSync && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground p-3 rounded-lg bg-secondary/30 border border-border/50">
          <Info className="w-4 h-4 shrink-0" />
          <span>
            Última sincronização:{" "}
            {lastSync.finished_at
              ? formatDistanceToNow(new Date(lastSync.finished_at), { addSuffix: true, locale: ptBR })
              : "em andamento"}
          </span>
          {statusBadge(lastSync.status)}
          <span>
            {lastSync.employees_count} colaboradores · {lastSync.tasks_count} tasks
          </span>
        </div>
      )}

      {/* Hours table */}
      {hoursCache.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colaborador</TableHead>
              <TableHead className="text-right">Horas Calculadas</TableHead>
              <TableHead className="text-right">Tasks</TableHead>
              <TableHead>Última Sync</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hoursCache.map((row) => {
              const emp = db.employees.find((e) => e.id === row.employee_id);
              const taskCount = Array.isArray(row.tasks_detail) ? row.tasks_detail.length : 0;
              return (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{emp?.name || row.employee_id}</TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    {row.total_hours.toFixed(1)}h
                  </TableCell>
                  <TableCell className="text-right">{taskCount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.synced_at
                      ? formatDistanceToNow(new Date(row.synced_at), { addSuffix: true, locale: ptBR })
                      : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum dado sincronizado para este mês.</p>
          <p className="text-xs mt-1">Configure o mapeamento de usuários e clique em "Atualizar agora".</p>
        </div>
      )}

      {/* User mapping section */}
      <div className="border-t border-border/50 pt-6">
        <AuvoUserMapping />
      </div>
    </motion.div>
  );
}
