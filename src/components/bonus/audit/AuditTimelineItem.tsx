import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Clock, User, Hash, ArrowRight, PlusCircle, Pencil, Trash2, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AuditLogEntry, TABLE_LABELS, ACTION_CONFIG } from "./types";
import { toast } from "sonner";

interface AuditTimelineItemProps {
  entry: AuditLogEntry;
  isFirst?: boolean;
  isLast?: boolean;
  index: number;
}

const ActionIcons = {
  INSERT: PlusCircle,
  UPDATE: Pencil,
  DELETE: Trash2,
};

const actionColors = {
  INSERT: { 
    bg: "bg-success/10", 
    border: "border-success/30", 
    text: "text-success",
    ring: "ring-success/20",
    glow: "shadow-[0_0_20px_-5px_hsl(var(--success)/0.4)]"
  },
  UPDATE: { 
    bg: "bg-primary/10", 
    border: "border-primary/30", 
    text: "text-primary",
    ring: "ring-primary/20",
    glow: "shadow-[0_0_20px_-5px_hsl(var(--primary)/0.4)]"
  },
  DELETE: { 
    bg: "bg-destructive/10", 
    border: "border-destructive/30", 
    text: "text-destructive",
    ring: "ring-destructive/20",
    glow: "shadow-[0_0_20px_-5px_hsl(var(--destructive)/0.4)]"
  },
};

export function AuditTimelineItem({ entry, isFirst, isLast, index }: AuditTimelineItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const actionConfig = ACTION_CONFIG[entry.action];
  const colors = actionColors[entry.action];
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

  const handleCopyId = () => {
    navigator.clipboard.writeText(entry.record_id);
    setCopiedId(true);
    toast.success("ID copiado para a área de transferência");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const changedFields = getChangedFields();

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        delay: index * 0.03,
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      className="relative flex gap-3 sm:gap-4"
    >
      {/* Timeline connector */}
      <div className="flex flex-col items-center shrink-0">
        <motion.div 
          className={`
            w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center 
            border-2 ${colors.border} ${colors.bg} ${colors.text}
            transition-all duration-300
            ${isExpanded ? colors.glow : ""}
          `}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ActionIcon className="w-4 h-4" />
        </motion.div>
        {!isLast && (
          <motion.div 
            className={`w-0.5 flex-1 my-2 ${colors.bg}`}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: index * 0.03 + 0.2 }}
            style={{ originY: 0 }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4 sm:pb-6 min-w-0">
        <motion.div 
          layout
          className={`
            glass-card rounded-xl border border-border/40 overflow-hidden
            transition-all duration-300
            ${isExpanded ? `ring-1 ${colors.ring} ${colors.glow}` : "hover:border-border/60"}
          `}
        >
          {/* Header */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 text-left hover:bg-secondary/10 transition-colors"
          >
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <Badge className={`${colors.bg} ${colors.text} ${colors.border} border text-[10px] sm:text-xs font-semibold`}>
                {actionConfig.label}
              </Badge>
              <Badge variant="secondary" className="font-mono text-[10px] sm:text-xs bg-secondary/50">
                {TABLE_LABELS[entry.table_name] || entry.table_name}
              </Badge>
              <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="truncate max-w-[120px] sm:max-w-none">
                  {entry.changed_by_email || "Sistema"}
                </span>
              </span>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(entry.changed_at), { addSuffix: true, locale: ptBR })}
              </span>
              {changedFields.length > 0 && (
                <Badge variant="outline" className="text-[10px] sm:text-xs h-5">
                  {changedFields.length} campo{changedFields.length > 1 ? "s" : ""}
                </Badge>
              )}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </div>
          </button>

          {/* Expanded content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="border-t border-border/30 overflow-hidden"
              >
                <div className="p-3 sm:p-4 space-y-4 bg-background/20">
                  {/* Metadata row */}
                  <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button 
                          onClick={handleCopyId}
                          className="flex items-center gap-2 px-2 py-1 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                        >
                          <Hash className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                          <code className="text-[10px] sm:text-xs font-mono">
                            {entry.record_id.slice(0, 8)}...
                          </code>
                          {copiedId ? (
                            <Check className="w-3 h-3 text-success" />
                          ) : (
                            <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Clique para copiar ID completo</TooltipContent>
                    </Tooltip>
                    
                    <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-secondary/30">
                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                      <span className="text-[10px] sm:text-xs">
                        {format(new Date(entry.changed_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                      </span>
                    </div>
                  </div>

                  {/* Changed fields */}
                  {changedFields.length > 0 && (
                    <motion.div 
                      className="space-y-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <h4 className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.bg} ${colors.text}`} />
                        Campos alterados
                      </h4>
                      <div className="space-y-2">
                        {changedFields.slice(0, 10).map((field, idx) => {
                          const oldValue = entry.old_data?.[field];
                          const newValue = entry.new_data?.[field];
                          
                          return (
                            <motion.div 
                              key={field}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.15 + idx * 0.03 }}
                              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-secondary/20 border border-border/20"
                            >
                              <Badge variant="outline" className="font-mono text-[10px] sm:text-xs shrink-0 w-fit">
                                {formatFieldName(field)}
                              </Badge>
                              
                              <div className="flex-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm overflow-hidden">
                                {entry.action === "UPDATE" ? (
                                  <>
                                    <span className="text-destructive/70 line-through truncate max-w-[150px] sm:max-w-[200px]">
                                      {formatValue(oldValue).slice(0, 50)}
                                    </span>
                                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                                    <span className="text-success truncate max-w-[150px] sm:max-w-[200px] font-medium">
                                      {formatValue(newValue).slice(0, 50)}
                                    </span>
                                  </>
                                ) : entry.action === "INSERT" ? (
                                  <span className="text-success truncate font-medium">
                                    {formatValue(newValue).slice(0, 100)}
                                  </span>
                                ) : (
                                  <span className="text-destructive/70 truncate">
                                    {formatValue(oldValue).slice(0, 100)}
                                  </span>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                        {changedFields.length > 10 && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground pl-3">
                            +{changedFields.length - 10} campos adicionais...
                          </p>
                        )}
                      </div>
                    </motion.div>
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
