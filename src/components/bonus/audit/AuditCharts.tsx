import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { OSRecord, Config, BonusCamadas } from "@/types/bonus";
import { CRITERIA } from "@/lib/constants";
import { clampInt } from "@/lib/database";

const PREMIUM_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--chart-4))",
  "hsl(var(--destructive))",
];

const tooltipStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)",
  fontSize: "12px",
};

export function CriteriaAverageChart({ osList }: { osList: OSRecord[] }) {
  const data = useMemo(() => {
    return CRITERIA.map((c, idx) => {
      const sum = osList.reduce((acc, os) => {
        const val = clampInt(os.crit?.[c.id] ?? 0, 0, c.max);
        return acc + val;
      }, 0);
      const avg = osList.length > 0 ? sum / osList.length : 0;
      return {
        name: c.title,
        media: Number(avg.toFixed(2)),
        max: c.max,
        percent: c.max > 0 ? Number(((avg / c.max) * 100).toFixed(0)) : 0,
        fill: PREMIUM_COLORS[idx % PREMIUM_COLORS.length],
      };
    });
  }, [osList]);

  return (
    <div className="h-[280px] sm:h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} horizontal={false} />
          <XAxis 
            type="number" 
            domain={[0, "dataMax"]} 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={85}
            tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            formatter={(value: number, name: string) => [
              name === "media" ? `${value} pts` : value,
              name === "media" ? "Média" : "Máximo",
            ]}
          />
          <Bar 
            dataKey="max" 
            fill="hsl(var(--secondary))" 
            radius={[0, 6, 6, 0]} 
            opacity={0.3}
            barSize={20}
          />
          <Bar 
            dataKey="media" 
            fill="url(#barGradient)" 
            radius={[0, 6, 6, 0]} 
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DifficultyPieChart({ osList, cfg }: { osList: OSRecord[]; cfg: Config }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    osList.forEach((os) => {
      counts[os.dificuldadeId] = (counts[os.dificuldadeId] || 0) + 1;
    });

    return cfg.difficultyWeights
      .map((d, idx) => ({
        name: d.label,
        value: counts[d.id] || 0,
        ce: d.ce,
        fill: PREMIUM_COLORS[idx % PREMIUM_COLORS.length],
      }))
      .filter((d) => d.value > 0);
  }, [osList, cfg]);

  if (data.length === 0) {
    return (
      <div className="h-[280px] sm:h-[320px] flex items-center justify-center text-muted-foreground text-sm">
        Sem dados de dificuldade
      </div>
    );
  }

  return (
    <div className="h-[280px] sm:h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            {data.map((entry, index) => (
              <linearGradient key={`gradient-${index}`} id={`pieGradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={entry.fill} stopOpacity={0.9} />
                <stop offset="100%" stopColor={entry.fill} stopOpacity={0.6} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            stroke="hsl(var(--background))"
            strokeWidth={2}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            labelLine={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={`url(#pieGradient-${index})`} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number) => [`${value} OS`, "Quantidade"]}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CEQEvolutionChart({ osList }: { osList: OSRecord[] }) {
  const data = useMemo(() => {
    const sorted = [...osList].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    let accCEQ = 0;
    let accCE = 0;

    return sorted.map((os, idx) => {
      accCEQ += os.ceQ || 0;
      accCE += os.ceFinal || 0;
      return {
        name: os.date?.slice(5) || `OS ${idx + 1}`,
        ceQ: Number(accCEQ.toFixed(2)),
        ce: Number(accCE.toFixed(2)),
        osId: os.osId,
      };
    });
  }, [osList]);

  if (data.length === 0) {
    return (
      <div className="h-[280px] sm:h-[320px] flex items-center justify-center text-muted-foreground text-sm">
        Sem dados de evolução
      </div>
    );
  }

  return (
    <div className="h-[280px] sm:h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
          <defs>
            <linearGradient id="colorCEQ" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCE" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.5} />
              <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            angle={-45}
            textAnchor="end"
            height={50}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend 
            verticalAlign="top" 
            height={36}
            formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
          />
          <Area
            type="monotone"
            dataKey="ce"
            name="CE Final"
            stroke="hsl(var(--success))"
            fill="url(#colorCE)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="ceQ"
            name="CE Qualidade"
            stroke="hsl(var(--primary))"
            fill="url(#colorCEQ)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BonusLayersChart({ camadas }: { camadas: BonusCamadas }) {
  const data = useMemo(() => {
    const total = camadas.bonusEsforco + camadas.bonusQualidade + camadas.bonusSuperacao;
    return [
      {
        name: "Esforço",
        valor: Number(camadas.bonusEsforco.toFixed(2)),
        percent: total > 0 ? Number(((camadas.bonusEsforco / total) * 100).toFixed(0)) : 0,
        fill: "hsl(var(--success))",
      },
      {
        name: "Qualidade",
        valor: Number(camadas.bonusQualidade.toFixed(2)),
        percent: total > 0 ? Number(((camadas.bonusQualidade / total) * 100).toFixed(0)) : 0,
        fill: "hsl(var(--primary))",
      },
      {
        name: "Superação",
        valor: Number(camadas.bonusSuperacao.toFixed(2)),
        percent: total > 0 ? Number(((camadas.bonusSuperacao / total) * 100).toFixed(0)) : 0,
        fill: "hsl(var(--warning))",
      },
    ];
  }, [camadas]);

  return (
    <div className="h-[220px] sm:h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 10, right: 20, bottom: 30, top: 10 }}>
          <defs>
            <linearGradient id="esforcoGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={1} />
              <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="qualidadeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="superacaoGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--warning))" stopOpacity={1} />
              <stop offset="100%" stopColor="hsl(var(--warning))" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `R$${value}`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Bônus"]}
          />
          <Bar 
            dataKey="valor" 
            radius={[8, 8, 0, 0]}
            barSize={50}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={index === 0 ? "url(#esforcoGrad)" : index === 1 ? "url(#qualidadeGrad)" : "url(#superacaoGrad)"} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
