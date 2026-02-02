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
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { OSRecord, Config, BonusCamadas } from "@/types/bonus";
import { CRITERIA } from "@/lib/constants";
import { clampInt, getDifficultyById } from "@/lib/database";

interface AuditChartsProps {
  osList: OSRecord[];
  cfg: Config;
  camadas: BonusCamadas;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8b5cf6",
  "#06b6d4",
  "#f59e0b",
  "#ef4444",
];

export function CriteriaAverageChart({ osList }: { osList: OSRecord[] }) {
  const data = useMemo(() => {
    return CRITERIA.map((c) => {
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
      };
    });
  }, [osList]);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis type="number" domain={[0, "dataMax"]} stroke="hsl(var(--muted-foreground))" />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
            formatter={(value: number, name: string) => [
              name === "media" ? `${value} pts` : value,
              name === "media" ? "Média" : "Máximo",
            ]}
          />
          <Bar dataKey="media" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          <Bar dataKey="max" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} opacity={0.4} />
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
      .map((d) => ({
        name: d.label,
        value: counts[d.id] || 0,
        ce: d.ce,
      }))
      .filter((d) => d.value > 0);
  }, [osList, cfg]);

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Sem dados de dificuldade
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            labelLine={{ stroke: "hsl(var(--muted-foreground))" }}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number) => [`${value} OS`, "Quantidade"]}
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
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        Sem dados de evolução
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 10, right: 30 }}>
          <defs>
            <linearGradient id="colorCEQ" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCE" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis stroke="hsl(var(--muted-foreground))" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="ceQ"
            name="CE Qualidade (acumulado)"
            stroke="hsl(var(--primary))"
            fill="url(#colorCEQ)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="ce"
            name="CE Final (acumulado)"
            stroke="hsl(var(--chart-2))"
            fill="url(#colorCE)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BonusLayersChart({ camadas }: { camadas: BonusCamadas }) {
  const data = useMemo(() => {
    return [
      {
        name: "Esforço (50%)",
        valor: Number(camadas.bonusEsforco.toFixed(2)),
        fator: Number((camadas.fatorEsforco * 100).toFixed(0)),
      },
      {
        name: "Qualidade (40%)",
        valor: Number(camadas.bonusQualidade.toFixed(2)),
        fator: Number((camadas.fatorQualidade * 100).toFixed(0)),
      },
      {
        name: "Superação (10%)",
        valor: Number(camadas.bonusSuperacao.toFixed(2)),
        fator: Number((camadas.fatorSuperacao * 100).toFixed(0)),
      },
    ];
  }, [camadas]);

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 20, right: 30, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
            angle={-15}
            textAnchor="end"
          />
          <YAxis stroke="hsl(var(--muted-foreground))" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number, name: string) => [
              name === "valor" ? `R$ ${value.toFixed(2)}` : `${value}%`,
              name === "valor" ? "Bônus" : "Fator",
            ]}
          />
          <Bar dataKey="valor" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
