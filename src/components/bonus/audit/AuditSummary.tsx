import { motion } from "framer-motion";
import { BonusCamadas, Config, Employee, OSRecord } from "@/types/bonus";
import { formatBRL, formatPercent } from "@/lib/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  Target,
  Clock,
  Award,
  BarChart3,
  Zap,
  User,
  Briefcase,
  Trophy,
  Gauge,
  Timer,
  Star,
} from "lucide-react";

interface AuditSummaryProps {
  employee: Employee;
  monthKey: string;
  osList: OSRecord[];
  camadas: BonusCamadas;
  cfg: Config;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
};

export function AuditSummary({
  employee,
  monthKey,
  osList,
  camadas,
  cfg,
}: AuditSummaryProps) {
  const qualityPercent = camadas.ceTotal > 0 
    ? (camadas.ceQTotal / camadas.ceTotal) * 100 
    : 0;
  
  const bonusPercentOfCap = camadas.teto > 0 
    ? (camadas.bonusTotal / camadas.teto) * 100 
    : 0;

  const bonusStatus = bonusPercentOfCap >= 80 ? "excellent" : bonusPercentOfCap >= 50 ? "good" : "low";
  const statusColors = {
    excellent: "from-success/20 to-success/5 border-success/30",
    good: "from-primary/20 to-primary/5 border-primary/30",
    low: "from-warning/20 to-warning/5 border-warning/30",
  };

  return (
    <motion.div 
      className="space-y-5 sm:space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Banner */}
      <motion.div 
        variants={itemVariants}
        className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${statusColors[bonusStatus]} p-5 sm:p-6`}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-success/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Employee Info */}
          <div className="flex items-start gap-4">
            <motion.div 
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-2xl sm:text-3xl font-bold text-primary-foreground shadow-lg shrink-0"
              whileHover={{ scale: 1.05, rotate: [-1, 1, -1, 0] }}
            >
              {employee.name.charAt(0)}
            </motion.div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                {employee.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs gap-1">
                  <Briefcase className="w-3 h-3" />
                  {employee.role}
                </Badge>
                <Badge variant="outline" className="text-xs gap-1">
                  <Clock className="w-3 h-3" />
                  {monthKey}
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Bonus Display */}
          <div className="text-left lg:text-right">
            <div className="flex items-center gap-2 lg:justify-end">
              <Trophy className="w-5 h-5 text-primary" />
              <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider font-medium">
                Bônus Total
              </p>
            </div>
            <motion.p 
              className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary mt-1"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            >
              {formatBRL(camadas.bonusTotal)}
            </motion.p>
            <div className="flex items-center gap-2 mt-2 lg:justify-end">
              <div className="flex-1 lg:flex-none lg:w-32 h-2 rounded-full bg-secondary/50 overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-primary to-success rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(bonusPercentOfCap, 100)}%` }}
                  transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {bonusPercentOfCap.toFixed(0)}% do teto
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <motion.div 
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
        variants={containerVariants}
      >
        <MetricCard
          icon={<BarChart3 className="w-5 h-5" />}
          label="Total OS"
          value={String(camadas.qtdOS)}
          hint="Ordens executadas"
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <MetricCard
          icon={<Zap className="w-5 h-5" />}
          label="CE Total"
          value={camadas.ceTotal.toFixed(2)}
          hint="Soma CE final"
          color="text-success"
          bgColor="bg-success/10"
        />
        <MetricCard
          icon={<Target className="w-5 h-5" />}
          label="CE Qualidade"
          value={camadas.ceQTotal.toFixed(2)}
          hint="CE qualificado"
          color="text-warning"
          bgColor="bg-warning/10"
        />
        <MetricCard
          icon={<Star className="w-5 h-5" />}
          label="Taxa Qualidade"
          value={`${qualityPercent.toFixed(0)}%`}
          hint="CEQ / CE Total"
          color="text-primary"
          bgColor="bg-primary/10"
        />
      </motion.div>

      {/* Layer Details Card */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-border/30 bg-gradient-to-br from-card/80 via-card/50 to-transparent backdrop-blur-sm">
          <CardContent className="p-0">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 sm:p-5 border-b border-border/20">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Sistema de Bônus por Camadas</h3>
                <p className="text-xs text-muted-foreground">Detalhamento do cálculo de bonificação</p>
              </div>
            </div>

            {/* Layers */}
            <div className="p-4 sm:p-5 space-y-3">
              <LayerRow
                name="Esforço"
                weight="50%"
                factor={camadas.fatorEsforco}
                bonus={camadas.bonusEsforco}
                description={`${camadas.osDentroPrazo}/${camadas.qtdOS} OS no prazo (${formatPercent(camadas.taxaPrazo)})`}
                colorClass="text-success bg-success/10 border-success/20"
                icon={<Gauge className="w-4 h-4" />}
              />
              <LayerRow
                name="Qualidade"
                weight="40%"
                factor={camadas.fatorQualidade}
                bonus={camadas.bonusQualidade}
                description={`Média: ${camadas.mediaPontuacao.toFixed(1)} / ${cfg.maxPts} pts`}
                colorClass="text-primary bg-primary/10 border-primary/20"
                icon={<Star className="w-4 h-4" />}
              />
              <LayerRow
                name="Superação"
                weight="10%"
                factor={camadas.fatorSuperacao}
                bonus={camadas.bonusSuperacao}
                description={`CEQ: ${camadas.ceQTotal.toFixed(2)} | Média equipe: ${camadas.mediaEquipeCEQ.toFixed(2)}`}
                colorClass="text-warning bg-warning/10 border-warning/20"
                icon={<Trophy className="w-4 h-4" />}
              />
            </div>

            {/* Summary */}
            <div className="border-t border-border/20 p-4 sm:p-5 bg-secondary/10 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">Bônus das Camadas</span>
                <span className="font-bold text-lg">{formatBRL(camadas.bonusCamadas)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Timer className="w-4 h-4" />
                  Fator Horas ({camadas.horasTrabalhadas}h / {camadas.horasEsperadas}h)
                </span>
                <span className="font-mono">× {formatPercent(camadas.fatorHoras)}</span>
              </div>
              <div className="mt-3 p-4 rounded-xl bg-gradient-to-r from-primary/15 via-primary/10 to-success/10 border border-primary/20">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-primary flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Bônus Final
                  </span>
                  <span className="font-black text-2xl text-primary">
                    {formatBRL(camadas.bonusTotal)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  hint,
  color,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  color: string;
  bgColor: string;
}) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="border-border/30 bg-gradient-to-br from-card/80 to-transparent backdrop-blur-sm overflow-hidden group hover:border-border/50 transition-all">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start justify-between mb-2">
            <span className={`p-1.5 sm:p-2 rounded-lg ${bgColor} ${color} group-hover:scale-110 transition-transform`}>
              {icon}
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold">{value}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5 hidden sm:block">{hint}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function LayerRow({
  name,
  weight,
  factor,
  bonus,
  description,
  colorClass,
  icon,
}: {
  name: string;
  weight: string;
  factor: number;
  bonus: number;
  description: string;
  colorClass: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.div 
      className={`p-3 sm:p-4 rounded-xl border ${colorClass}`}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={colorClass.split(' ')[0]}>{icon}</span>
          <span className={`font-semibold ${colorClass.split(' ')[0]}`}>{name}</span>
          <Badge variant="secondary" className="text-[10px] h-5">{weight}</Badge>
        </div>
        <span className="font-bold text-lg">{formatBRL(bonus)}</span>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mt-2 text-xs sm:text-sm text-muted-foreground">
        <span>{description}</span>
        <Badge variant="outline" className="w-fit text-[10px]">
          Fator: {formatPercent(factor)}
        </Badge>
      </div>
    </motion.div>
  );
}
