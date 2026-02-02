import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format, parseISO, subDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AuditLogEntry } from "./types";

interface AuditActivityChartProps {
  entries: AuditLogEntry[];
}

export function AuditActivityChart({ entries }: AuditActivityChartProps) {
  const chartData = useMemo(() => {
    // Get last 14 days
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

  const maxValue = Math.max(...chartData.map(d => d.total), 1);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Atividade dos Últimos 14 Dias</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Distribuição de alterações por dia
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-muted-foreground">Criações</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-muted-foreground">Atualizações</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-muted-foreground">Exclusões</span>
          </div>
        </div>
      </div>

      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={0}>
            <XAxis 
              dataKey="label" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  inserts: 'Criações',
                  updates: 'Atualizações',
                  deletes: 'Exclusões',
                };
                return [value, labels[name] || name];
              }}
              labelFormatter={(label) => `Data: ${label}`}
            />
            <Bar dataKey="inserts" stackId="a" fill="hsl(160, 84%, 39%)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="updates" stackId="a" fill="hsl(217, 91%, 60%)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="deletes" stackId="a" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
