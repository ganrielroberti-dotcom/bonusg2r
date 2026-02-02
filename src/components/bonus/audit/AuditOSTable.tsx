import { motion } from "framer-motion";
import { OSRecord, Config } from "@/types/bonus";
import { getDifficultyById, getDurationById } from "@/lib/bonusCalculator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CRITERIA } from "@/lib/constants";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface AuditOSTableProps {
  osList: OSRecord[];
  cfg: Config;
}

export function AuditOSTable({ osList, cfg }: AuditOSTableProps) {
  const sortedOS = [...osList].sort((a, b) =>
    (a.date || "").localeCompare(b.date || "")
  );

  if (osList.length === 0) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center py-12 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-secondary/30 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">
          Nenhuma OS registrada para este colaborador no mês.
        </p>
      </motion.div>
    );
  }

  const getDifficultyColor = (ce: number) => {
    if (ce >= 2) return "border-destructive/50 text-destructive bg-destructive/10";
    if (ce >= 1.5) return "border-warning/50 text-warning bg-warning/10";
    return "border-success/50 text-success bg-success/10";
  };

  const getQualityIcon = (percent: number) => {
    if (percent >= 80) return <CheckCircle2 className="w-3 h-3 text-success inline-block ml-1" />;
    if (percent >= 60) return <AlertCircle className="w-3 h-3 text-warning inline-block ml-1" />;
    return <XCircle className="w-3 h-3 text-destructive inline-block ml-1" />;
  };

  return (
    <div className="space-y-6">
      {/* Main OS Table */}
      <div className="overflow-x-auto rounded-xl border border-border/30">
        <Table>
          <TableHeader>
            <TableRow className="border-border/30 bg-secondary/20 hover:bg-secondary/20">
              <TableHead className="w-[90px] text-xs font-semibold">Data</TableHead>
              <TableHead className="w-[80px] text-xs font-semibold">OS</TableHead>
              <TableHead className="text-xs font-semibold">Cliente</TableHead>
              <TableHead className="w-[100px] text-xs font-semibold">Dificuldade</TableHead>
              <TableHead className="w-[90px] text-xs font-semibold">Duração</TableHead>
              <TableHead className="text-right w-[70px] text-xs font-semibold">Score</TableHead>
              <TableHead className="text-right w-[80px] text-xs font-semibold">CE Final</TableHead>
              <TableHead className="text-right w-[90px] text-xs font-semibold">CE Qual.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOS.map((os, idx) => {
              const diff = getDifficultyById(cfg, os.dificuldadeId);
              const dur = getDurationById(cfg, os.duracaoId);
              const qualityPercent = os.ceFinal > 0 ? (os.ceQ / os.ceFinal) * 100 : 0;

              return (
                <motion.tr
                  key={os.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="border-border/20 hover:bg-secondary/10 transition-colors"
                >
                  <TableCell className="font-mono text-xs">{os.date}</TableCell>
                  <TableCell className="font-semibold text-xs">{os.osId || "-"}</TableCell>
                  <TableCell className="text-xs truncate max-w-[150px]">{os.cliente || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${getDifficultyColor(diff.ce)}`}
                    >
                      {diff.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {dur.label}
                    <span className="text-[10px] ml-1">(×{os.duracaoMult})</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold text-xs">{os.score}</span>
                    <span className="text-muted-foreground text-[10px]">/{cfg.maxPts}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {os.ceFinal.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono text-xs">{os.ceQ.toFixed(2)}</span>
                    {getQualityIcon(qualityPercent)}
                  </TableCell>
                </motion.tr>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Criteria Details */}
      <Card className="border-border/30 bg-gradient-to-br from-card/80 to-transparent overflow-hidden">
        <div className="p-4 border-b border-border/20 bg-secondary/10">
          <h4 className="font-semibold text-sm text-foreground">Detalhamento por Critério de Qualidade</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Pontuação individual por OS e critério</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="w-[80px] text-[10px] font-semibold">Data</TableHead>
                <TableHead className="w-[70px] text-[10px] font-semibold">OS</TableHead>
                {CRITERIA.map((c) => (
                  <TableHead key={c.id} className="text-center text-[10px] w-[60px] font-semibold">
                    <div>{c.title}</div>
                    <div className="text-muted-foreground font-normal">(0-{c.max})</div>
                  </TableHead>
                ))}
                <TableHead className="text-right w-[50px] text-[10px] font-semibold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOS.map((os, idx) => (
                <motion.tr 
                  key={os.id} 
                  className="border-border/20 hover:bg-secondary/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.015 }}
                >
                  <TableCell className="font-mono text-[10px]">{os.date}</TableCell>
                  <TableCell className="font-medium text-[10px]">{os.osId || "-"}</TableCell>
                  {CRITERIA.map((c) => {
                    const val = os.crit?.[c.id] ?? 0;
                    const percent = c.max > 0 ? (val / c.max) * 100 : 0;
                    return (
                      <TableCell
                        key={c.id}
                        className={`text-center text-[10px] font-medium ${
                          percent >= 80
                            ? "text-success"
                            : percent >= 50
                            ? "text-warning"
                            : "text-destructive/70"
                        }`}
                      >
                        {val}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right font-bold text-xs">{os.score}</TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
