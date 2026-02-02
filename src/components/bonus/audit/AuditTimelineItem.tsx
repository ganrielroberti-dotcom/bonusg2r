import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Clock, User, Hash, ArrowRight, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AuditLogEntry, TABLE_LABELS, ACTION_CONFIG } from "./types";

interface AuditTimelineItemProps {
  entry: AuditLogEntry;
  isFirst?: boolean;
  isLast?: boolean;
}

const ActionIcons = {
  INSERT: PlusCircle,
  UPDATE: Pencil,
  DELETE: Trash2,
};

export function AuditTimelineItem({ entry, isFirst, isLast }: AuditTimelineItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const actionConfig = ACTION_CONFIG[entry.action];
  const ActionIcon = ActionIcons[entry.action];

  const getChangedFields = (): string[] => {
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
    return field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const changedFields = getChangedFields();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative flex gap-4"
    >
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center border-2
          ${actionConfig.colorClass}
        `}>
          <ActionIcon className="w-4 h-4" />
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-border/50 my-2" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <motion.div 
          className={`
            rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden
            hover:border-border transition-all duration-200
            ${isExpanded ? "ring-1 ring-primary/20" : ""}
          `}
        >
          {/* Header */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/20 transition-colors"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={`${actionConfig.colorClass} border font-medium`}>
                {actionConfig.label}
              </Badge>
              <Badge variant="secondary" className="font-mono text-xs">
                {TABLE_LABELS[entry.table_name] || entry.table_name}
              </Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {entry.changed_by_email || "Sistema"}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(entry.changed_at), { addSuffix: true, locale: ptBR })}
              </span>
              {changedFields.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {changedFields.length} campo{changedFields.length > 1 ? "s" : ""}
                </Badge>
              )}
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </button>

          {/* Expanded content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-border/50"
              >
                <div className="p-4 space-y-4 bg-background/30">
                  {/* Metadata row */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">ID:</span>
                      <code className="px-2 py-0.5 rounded bg-secondary/50 text-xs font-mono">
                        {entry.record_id.slice(0, 8)}...
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Data:</span>
                      <span className="text-xs">
                        {format(new Date(entry.changed_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                      </span>
                    </div>
                  </div>

                  {/* Changed fields */}
                  {changedFields.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Campos alterados
                      </h4>
                      <div className="space-y-2">
                        {changedFields.slice(0, 10).map((field) => {
                          const oldValue = entry.old_data?.[field];
                          const newValue = entry.new_data?.[field];
                          
                          return (
                            <div 
                              key={field} 
                              className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20 border border-border/30"
                            >
                              <Badge variant="outline" className="font-mono text-xs shrink-0 mt-0.5">
                                {formatFieldName(field)}
                              </Badge>
                              
                              <div className="flex-1 flex items-center gap-2 text-sm overflow-hidden">
                                {entry.action === "UPDATE" ? (
                                  <>
                                    <span className="text-red-400/80 line-through truncate max-w-[200px]">
                                      {formatValue(oldValue).slice(0, 50)}
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <span className="text-emerald-400 truncate max-w-[200px]">
                                      {formatValue(newValue).slice(0, 50)}
                                    </span>
                                  </>
                                ) : entry.action === "INSERT" ? (
                                  <span className="text-emerald-400 truncate">
                                    {formatValue(newValue).slice(0, 100)}
                                  </span>
                                ) : (
                                  <span className="text-red-400/80 truncate">
                                    {formatValue(oldValue).slice(0, 100)}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {changedFields.length > 10 && (
                          <p className="text-xs text-muted-foreground">
                            +{changedFields.length - 10} campos adicionais...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
