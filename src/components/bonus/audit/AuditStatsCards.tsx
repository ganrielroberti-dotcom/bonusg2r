import { motion } from "framer-motion";
import { Activity, PlusCircle, Pencil, Trash2, Users, Database } from "lucide-react";
import { AuditStats } from "./types";

interface AuditStatsCardsProps {
  stats: AuditStats;
  isLoading?: boolean;
}

const statCards = [
  { 
    key: "total", 
    label: "Total de Registros", 
    icon: Activity,
    gradient: "from-primary/20 to-primary/5",
    iconColor: "text-primary"
  },
  { 
    key: "inserts", 
    label: "Criações", 
    icon: PlusCircle,
    gradient: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-400"
  },
  { 
    key: "updates", 
    label: "Atualizações", 
    icon: Pencil,
    gradient: "from-blue-500/20 to-blue-500/5",
    iconColor: "text-blue-400"
  },
  { 
    key: "deletes", 
    label: "Exclusões", 
    icon: Trash2,
    gradient: "from-red-500/20 to-red-500/5",
    iconColor: "text-red-400"
  },
  { 
    key: "uniqueUsers", 
    label: "Usuários Ativos", 
    icon: Users,
    gradient: "from-violet-500/20 to-violet-500/5",
    iconColor: "text-violet-400"
  },
  { 
    key: "tablesAffected", 
    label: "Tabelas Afetadas", 
    icon: Database,
    gradient: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-400"
  },
];

export function AuditStatsCards({ stats, isLoading }: AuditStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        const value = stats[card.key as keyof AuditStats];
        
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`
              relative overflow-hidden rounded-xl border border-border/50 
              bg-gradient-to-br ${card.gradient} backdrop-blur-sm
              p-4 group hover:border-border transition-all duration-300
            `}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {card.label}
                </p>
                <p className={`text-2xl font-bold ${isLoading ? "animate-pulse" : ""}`}>
                  {isLoading ? "—" : value.toLocaleString("pt-BR")}
                </p>
              </div>
              <div className={`p-2 rounded-lg bg-background/50 ${card.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            
            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className={`absolute -inset-1 bg-gradient-to-r ${card.gradient} blur-xl opacity-30`} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
