import { BonusCamadas, Config, Employee, OSRecord } from "@/types/bonus";
import { formatBRL, formatPercent } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Target,
  Clock,
  Award,
  BarChart3,
  Zap,
} from "lucide-react";

interface AuditSummaryProps {
  employee: Employee;
  monthKey: string;
  osList: OSRecord[];
  camadas: BonusCamadas;
  cfg: Config;
}

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

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{employee.name}</h2>
          <p className="text-muted-foreground">{employee.role}</p>
          <Badge variant="outline" className="mt-2">
            Mês: {monthKey}
          </Badge>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground mb-1">Bônus Total</p>
          <p className="text-4xl font-black text-primary">
            {formatBRL(camadas.bonusTotal)}
          </p>
          <p className="text-sm text-muted-foreground">
            {bonusPercentOfCap.toFixed(0)}% do teto ({formatBRL(camadas.teto)})
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<BarChart3 className="w-5 h-5" />}
          label="Total OS"
          value={String(camadas.qtdOS)}
          hint="Ordens de serviço no mês"
        />
        <MetricCard
          icon={<Zap className="w-5 h-5" />}
          label="CE Total"
          value={camadas.ceTotal.toFixed(2)}
          hint="Soma dos CE finais"
        />
        <MetricCard
          icon={<Target className="w-5 h-5" />}
          label="CE Qualidade"
          value={camadas.ceQTotal.toFixed(2)}
          hint="CE qualificado total"
        />
        <MetricCard
          icon={<Award className="w-5 h-5" />}
          label="Qualidade"
          value={`${qualityPercent.toFixed(0)}%`}
          hint="CEQ / CE Total"
        />
      </div>

      {/* Layer Details */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Sistema de Bônus por Camadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LayerRow
            name="Camada 1: Esforço"
            weight="50%"
            factor={camadas.fatorEsforco}
            bonus={camadas.bonusEsforco}
            description={`Taxa de prazo: ${formatPercent(camadas.taxaPrazo)} (${camadas.osDentroPrazo}/${camadas.qtdOS} OS)`}
            color="text-chart-1"
          />
          <LayerRow
            name="Camada 2: Qualidade"
            weight="40%"
            factor={camadas.fatorQualidade}
            bonus={camadas.bonusQualidade}
            description={`Média pontuação: ${camadas.mediaPontuacao.toFixed(2)} / ${cfg.maxPts} pts`}
            color="text-chart-2"
          />
          <LayerRow
            name="Camada 3: Superação"
            weight="10%"
            factor={camadas.fatorSuperacao}
            bonus={camadas.bonusSuperacao}
            description={`Seu CEQ: ${camadas.ceQTotal.toFixed(2)} | Média equipe: ${camadas.mediaEquipeCEQ.toFixed(2)}`}
            color="text-chart-3"
          />

          <div className="pt-4 border-t border-border/50">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Bônus das Camadas</span>
              <span className="font-bold text-lg">{formatBRL(camadas.bonusCamadas)}</span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Fator Horas ({camadas.horasTrabalhadas}h / {camadas.horasEsperadas}h)
              </span>
              <span>× {formatPercent(camadas.fatorHoras)}</span>
            </div>
            <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-primary">Bônus Final</span>
                <span className="font-black text-xl text-primary">
                  {formatBRL(camadas.bonusTotal)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function LayerRow({
  name,
  weight,
  factor,
  bonus,
  description,
  color,
}: {
  name: string;
  weight: string;
  factor: number;
  bonus: number;
  description: string;
  color: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
      <div className="flex justify-between items-start mb-1">
        <div>
          <span className={`font-medium ${color}`}>{name}</span>
          <span className="text-muted-foreground text-sm ml-2">({weight})</span>
        </div>
        <span className="font-bold">{formatBRL(bonus)}</span>
      </div>
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>{description}</span>
        <Badge variant="secondary" className="ml-2">
          Fator: {formatPercent(factor)}
        </Badge>
      </div>
    </div>
  );
}
