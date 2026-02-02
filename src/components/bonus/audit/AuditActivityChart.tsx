import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, CartesianGrid } from "recharts";
import { format, parseISO, subDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart3, TrendingUp } from "lucide-react";
import { AuditLogEntry } from "./types";

interface AuditActivityChartProps {
  entries: AuditLogEntry[];
}

export function AuditActivityChart({ entries }: AuditActivityChartProps) {
  const chartData = useMemo(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, 13);
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    const countsByDay = new Map<string, { inserts: number; updates: number; deletes: number }>();
    
    days.forEach(day => {
      const key = format(day, "yyyy-MM-dd");
      countsByDay.set(key, { inserts: 0, updates: 0, deletes: 0 });
    });

    entries.forEach(entry => {
      const dateKey = format(parseISO(entry.changed_at), "yyyy-MM-dd");
      const current = countsByDay.get(dateKey);
      if (current) {
        if (entry.action === "INSERT") current.inserts++;
        else if (entry.action === "UPDATE") current.updates++;
        else if (entry.action === "DELETE") current.deletes++;
      }
    });

    return days.map(day => {
      const key = format(day, "yyyy-MM-dd");
      const counts = countsByDay.get(key) || { inserts: 0, updates: 0, deletes: 0 };
      return {
        date: key,
        label: format(day, "dd/MM", { locale: ptBR }),
        dayName: format(day, "EEE", { locale: ptBR }),
        total: counts.inserts + counts.updates + counts.deletes,
        ...counts,
      };
    });
  }, [entries]);

  const totalActivity = chartData.reduce((sum, d) => sum + d.total, 0);
  const avgActivity = totalActivity / chartData.length;
  const maxDay = chartData.reduce((max, d) => d.total > max.total ? d : max, chartData[0]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card rounded-xl border border-border/40 overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm sm:text-base">Atividade dos Últimos 14 Dias</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              Distribuição temporal de alterações no sistema
            </p>
          </div>
        </div>
        
        {/* Quick stats */}
        <div className="flex items-center gap-4 sm:gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-success" />
              <span className="text-muted-foreground hidden sm:inline">Criações</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-muted-foreground hidden sm:inline">Atualizações</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
              <span className="text-muted-foreground hidden sm:inline">Exclusões</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-3 sm:p-4">
        <div className="h-[140px] sm:h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="insertGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="updateGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="deleteGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.3}
                vertical={false}
              />
              <XAxis 
                dataKey="label" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                axisLine={{ stroke: 'hsl(var(--border))', opacity: 0.5 }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '10px',
                  fontSize: '11px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: '4px' }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    inserts: 'Criações',
                    updates: 'Atualizações',
                    deletes: 'Exclusões',
                  };
                  return [value, labels[name] || name];
                }}
                labelFormatter={(label) => `📅 ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="inserts" 
                stackId="1"
                stroke="hsl(var(--success))" 
                strokeWidth={2}
                fill="url(#insertGrad)" 
              />
              <Area 
                type="monotone" 
                dataKey="updates" 
                stackId="1"
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fill="url(#updateGrad)" 
              />
              <Area 
                type="monotone" 
                dataKey="deletes" 
                stackId="1"
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                fill="url(#deleteGrad)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer stats */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3 border-t border-border/30 bg-secondary/10 text-[10px] sm:text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Total: <strong className="text-foreground">{totalActivity}</strong> alterações</span>
        </div>
        <div className="text-muted-foreground">
          Média: <strong className="text-foreground">{avgActivity.toFixed(1)}</strong>/dia
        </div>
        {maxDay && maxDay.total > 0 && (
          <div className="text-muted-foreground">
            Pico: <strong className="text-foreground">{maxDay.total}</strong> em {maxDay.label}
          </div>
        )}
      </div>
    </motion.div>
  );
}
