import { motion } from "framer-motion";
import { History, AlertCircle } from "lucide-react";
import { AuditLogEntry } from "./types";
import { AuditTimelineItem } from "./AuditTimelineItem";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

interface AuditTimelineProps {
  entries: AuditLogEntry[];
  isLoading?: boolean;
}

export function AuditTimeline({ entries, isLoading }: AuditTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton variant="list" count={5} />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
          <History className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nenhuma alteração encontrada
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Ajuste os filtros ou aguarde novas alterações serem registradas no sistema.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline entries */}
      <div className="space-y-0">
        {entries.map((entry, index) => (
          <AuditTimelineItem
            key={entry.id}
            entry={entry}
            isFirst={index === 0}
            isLast={index === entries.length - 1}
          />
        ))}
      </div>

      {/* Load more indicator */}
      {entries.length >= 50 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 py-4 text-muted-foreground"
        >
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">
            Exibindo os {entries.length} registros mais recentes
          </span>
        </motion.div>
      )}
    </div>
  );
}
