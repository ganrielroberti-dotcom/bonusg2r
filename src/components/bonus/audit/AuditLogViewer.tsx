import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { History, Filter, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuditLog, AuditLogEntry } from "@/hooks/useCachedQueries";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const TABLE_LABELS: Record<string, string> = {
  os_records: "Ordens de Serviço",
  employees: "Colaboradores",
  config: "Configurações",
  horas_trabalhadas: "Horas Trabalhadas",
};

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  INSERT: { label: "Criação", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  UPDATE: { label: "Atualização", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  DELETE: { label: "Exclusão", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

interface AuditLogViewerProps {
  className?: string;
}

export function AuditLogViewer({ className }: AuditLogViewerProps) {
  const [tableName, setTableName] = useState<string>("all");
  const [limit, setLimit] = useState<number>(50);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filters = useMemo(() => ({
    tableName: tableName !== "all" ? tableName : undefined,
    limit,
  }), [tableName, limit]);

  const { data: auditLogs, isLoading, refetch, isFetching } = useAuditLog(filters);

  const getChangedFields = (entry: AuditLogEntry): string[] => {
    if (entry.action === "INSERT") {
      return Object.keys(entry.new_data || {}).filter(k => !["id", "created_at", "updated_at"].includes(k));
    }
    if (entry.action === "DELETE") {
      return Object.keys(entry.old_data || {}).filter(k => !["id", "created_at", "updated_at"].includes(k));
    }
    if (entry.action === "UPDATE" && entry.old_data && entry.new_data) {
      return Object.keys(entry.new_data).filter(k => {
        if (["updated_at"].includes(k)) return false;
        return JSON.stringify(entry.old_data![k]) !== JSON.stringify(entry.new_data![k]);
      });
    }
    return [];
  };

  const formatFieldName = (field: string): string => {
    return field
      .replace(/_/g, " ")
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <CardTitle>Log de Auditoria</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
        <CardDescription>
          Histórico de alterações em OS, colaboradores e configurações
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              Tabela
            </Label>
            <Select value={tableName} onValueChange={setTableName}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="os_records">Ordens de Serviço</SelectItem>
                <SelectItem value="employees">Colaboradores</SelectItem>
                <SelectItem value="config">Configurações</SelectItem>
                <SelectItem value="horas_trabalhadas">Horas Trabalhadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Limite</Label>
            <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Log List */}
        {isLoading ? (
          <LoadingSkeleton variant="list" count={5} />
        ) : auditLogs?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma alteração registrada.
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {auditLogs?.map((entry) => {
              const actionInfo = ACTION_LABELS[entry.action];
              const changedFields = getChangedFields(entry);
              const isExpanded = expandedId === entry.id;

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-border/50 rounded-lg bg-secondary/20 overflow-hidden"
                >
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-secondary/40 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge className={actionInfo.color} variant="outline">
                        {actionInfo.label}
                      </Badge>
                      <Badge variant="secondary">
                        {TABLE_LABELS[entry.table_name] || entry.table_name}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        por <strong>{entry.changed_by_email || "Sistema"}</strong>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(entry.changed_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {changedFields.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {changedFields.length} campo(s)
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border/50 p-3 bg-background/50"
                    >
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground mb-1">
                              ID do Registro
                            </div>
                            <code className="text-xs bg-secondary px-2 py-1 rounded">
                              {entry.record_id}
                            </code>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground mb-1">
                              Data/Hora
                            </div>
                            <span className="text-xs">
                              {new Date(entry.changed_at).toLocaleString("pt-BR")}
                            </span>
                          </div>
                        </div>

                        {changedFields.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground mb-2">
                              Campos alterados
                            </div>
                            <div className="space-y-1">
                              {changedFields.map((field) => {
                                const oldValue = entry.old_data?.[field];
                                const newValue = entry.new_data?.[field];
                                return (
                                  <div key={field} className="flex items-start gap-2 text-xs">
                                    <Badge variant="outline" className="font-mono">
                                      {formatFieldName(field)}
                                    </Badge>
                                    {entry.action === "UPDATE" && (
                                      <>
                                        <span className="text-destructive line-through">
                                          {JSON.stringify(oldValue)?.slice(0, 50)}
                                        </span>
                                        <span className="text-muted-foreground">→</span>
                                        <span className="text-primary">
                                          {JSON.stringify(newValue)?.slice(0, 50)}
                                        </span>
                                      </>
                                    )}
                                    {entry.action === "INSERT" && (
                                      <span className="text-primary">
                                        {JSON.stringify(newValue)?.slice(0, 100)}
                                      </span>
                                    )}
                                    {entry.action === "DELETE" && (
                                      <span className="text-destructive">
                                        {JSON.stringify(oldValue)?.slice(0, 100)}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
