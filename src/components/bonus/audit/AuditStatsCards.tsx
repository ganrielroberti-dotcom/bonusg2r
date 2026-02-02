import { motion } from "framer-motion";
import { Activity, PlusCircle, Pencil, Trash2, Users, Database, TrendingUp } from "lucide-react";
import { AuditStats } from "./types";

interface AuditStatsCardsProps {
  stats: AuditStats;
  isLoading?: boolean;
}

const statCards = [
  { 
    key: "total", 
    label: "Total", 
    icon: Activity,
    accentClass: "text-primary",
    bgClass: "bg-primary/10",
    ringClass: "ring-primary/20",
    glowClass: "shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)]"
  },
  { 
    key: "inserts", 
    label: "Criações", 
    icon: PlusCircle,
    accentClass: "text-success",
    bgClass: "bg-success/10",
    ringClass: "ring-success/20",
    glowClass: "shadow-[0_0_30px_-5px_hsl(var(--success)/0.3)]"
  },
  { 
    key: "updates", 
    label: "Atualizações", 
    icon: Pencil,
    accentClass: "text-primary",
    bgClass: "bg-primary/10",
    ringClass: "ring-primary/20",
    glowClass: "shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)]"
  },
  { 
    key: "deletes", 
    label: "Exclusões", 
    icon: Trash2,
    accentClass: "text-destructive",
    bgClass: "bg-destructive/10",
    ringClass: "ring-destructive/20",
    glowClass: "shadow-[0_0_30px_-5px_hsl(var(--destructive)/0.3)]"
  },
  { 
    key: "uniqueUsers", 
    label: "Usuários", 
    icon: Users,
    accentClass: "text-accent",
    bgClass: "bg-accent/10",
    ringClass: "ring-accent/20",
    glowClass: "shadow-[0_0_30px_-5px_hsl(var(--accent)/0.3)]"
  },
  { 
    key: "tablesAffected", 
    label: "Tabelas", 
    icon: Database,
    accentClass: "text-warning",
    bgClass: "bg-warning/10",
    ringClass: "ring-warning/20",
    glowClass: "shadow-[0_0_30px_-5px_hsl(var(--warning)/0.3)]"
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

export function AuditStatsCards({ stats, isLoading }: AuditStatsCardsProps) {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
    >
      {statCards.map((card) => {
        const Icon = card.icon;
        const value = stats[card.key as keyof AuditStats];
        
        return (
          <motion.div
            key={card.key}
            variants={itemVariants}
            whileHover={{ 
              y: -4, 
              scale: 1.02,
              transition: { duration: 0.2 } 
            }}
            whileTap={{ scale: 0.98 }}
            className={`
              glass-card relative overflow-hidden rounded-xl
              border border-border/40 
              p-4 cursor-default select-none
              group transition-all duration-300
              hover:border-border hover:${card.glowClass}
            `}
          >
            {/* Gradient overlay */}
            <div className={`absolute inset-0 ${card.bgClass} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            
            {/* Content */}
            <div className="relative z-10 flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  {card.label}
                </p>
                <motion.p 
                  className={`text-2xl font-black tracking-tight ${card.accentClass}`}
                  initial={false}
                  animate={isLoading ? { opacity: 0.5 } : { opacity: 1 }}
                >
                  {isLoading ? (
                    <span className="inline-block w-8 h-7 bg-muted/30 rounded animate-pulse" />
                  ) : (
                    <motion.span
                      key={value}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      {value.toLocaleString("pt-BR")}
                    </motion.span>
                  )}
                </motion.p>
              </div>
              
              <motion.div 
                className={`
                  p-2 rounded-lg ${card.bgClass} ${card.accentClass}
                  ring-1 ${card.ringClass}
                  group-hover:scale-110 transition-transform duration-300
                `}
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Icon className="w-4 h-4" />
              </motion.div>
            </div>

            {/* Animated border glow on hover */}
            <div className={`
              absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 
              transition-opacity duration-500 pointer-events-none
              ring-1 ${card.ringClass}
            `} />
            
            {/* Subtle shine effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden rounded-xl">
              <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/5 to-transparent rotate-12 translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
