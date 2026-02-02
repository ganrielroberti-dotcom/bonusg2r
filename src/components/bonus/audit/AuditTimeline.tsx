import { motion } from "framer-motion";
import { History, Search, Inbox } from "lucide-react";
import { AuditLogEntry } from "./types";
import { AuditTimelineItem } from "./AuditTimelineItem";
import { Skeleton } from "@/components/ui/skeleton";

interface AuditTimelineProps {
  entries: AuditLogEntry[];
  isLoading?: boolean;
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AuditTimeline({ entries, isLoading }: AuditTimelineProps) {
  if (isLoading) {
    return <TimelineSkeleton />;
  }

  if (entries.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4"
      >
        <motion.div 
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-secondary/30 flex items-center justify-center mb-4 sm:mb-5"
          animate={{ 
            y: [0, -5, 0],
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Inbox className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
        </motion.div>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
          Nenhuma alteração encontrada
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
          Ajuste os filtros de busca ou aguarde novas alterações serem registradas no sistema.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="relative">
      {/* Entries */}
      <motion.div 
        className="space-y-0"
        initial="hidden"
        animate="visible"
      >
        {entries.map((entry, index) => (
          <AuditTimelineItem
            key={entry.id}
            entry={entry}
            isFirst={index === 0}
            isLast={index === entries.length - 1}
            index={index}
          />
        ))}
      </motion.div>

      {/* Load more indicator */}
      {entries.length >= 50 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-2 py-4 mt-2"
        >
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-[10px] sm:text-xs text-muted-foreground px-3 py-1.5 rounded-full bg-secondary/30">
            Mostrando os {entries.length} registros mais recentes
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </motion.div>
      )}
    </div>
  );
}
