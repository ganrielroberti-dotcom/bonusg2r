import { OSRecord, Config } from "@/types/bonus";
import { getDifficultyById, getDurationById } from "@/lib/database";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CRITERIA } from "@/lib/constants";

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
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma OS registrada para este colaborador no mês.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="w-[90px]">Data</TableHead>
            <TableHead className="w-[80px]">OS</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead className="w-[100px]">Dificuldade</TableHead>
            <TableHead className="w-[90px]">Duração</TableHead>
            <TableHead className="text-right w-[70px]">Score</TableHead>
            <TableHead className="text-right w-[80px]">CE Final</TableHead>
            <TableHead className="text-right w-[80px]">CE Qual.</TableHead>
            <TableHead className="w-[150px]">Obs</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedOS.map((os) => {
            const diff = getDifficultyById(cfg, os.dificuldadeId);
            const dur = getDurationById(cfg, os.duracaoId);
            const qualityPercent = os.ceFinal > 0 ? (os.ceQ / os.ceFinal) * 100 : 0;

            return (
              <TableRow key={os.id} className="border-border/30">
                <TableCell className="font-mono text-sm">{os.date}</TableCell>
                <TableCell className="font-medium">{os.osId || "-"}</TableCell>
                <TableCell>{os.cliente || "-"}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      diff.ce >= 2
                        ? "border-red-500/50 text-red-400"
                        : diff.ce >= 1.5
                        ? "border-orange-500/50 text-orange-400"
                        : "border-green-500/50 text-green-400"
                    }
                  >
                    {diff.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {dur.label} (×{os.duracaoMult})
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-medium">{os.score}</span>
                  <span className="text-muted-foreground text-xs">/{cfg.maxPts}</span>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {os.ceFinal.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-mono">{os.ceQ.toFixed(2)}</span>
                  <span
                    className={`text-xs ml-1 ${
                      qualityPercent >= 80
                        ? "text-green-400"
                        : qualityPercent >= 60
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}
                  >
                    ({qualityPercent.toFixed(0)}%)
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm truncate max-w-[150px]">
                  {os.obs || "-"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Criteria Details per OS */}
      <div className="mt-6 space-y-4">
        <h4 className="font-semibold text-foreground">Detalhamento por Critério</h4>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="w-[90px]">Data</TableHead>
                <TableHead className="w-[80px]">OS</TableHead>
                {CRITERIA.map((c) => (
                  <TableHead key={c.id} className="text-center text-xs w-[70px]">
                    {c.title}
                    <span className="block text-muted-foreground">(0-{c.max})</span>
                  </TableHead>
                ))}
                <TableHead className="text-right w-[60px]">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOS.map((os) => (
                <TableRow key={os.id} className="border-border/30">
                  <TableCell className="font-mono text-sm">{os.date}</TableCell>
                  <TableCell className="font-medium">{os.osId || "-"}</TableCell>
                  {CRITERIA.map((c) => {
                    const val = os.crit?.[c.id] ?? 0;
                    const percent = c.max > 0 ? (val / c.max) * 100 : 0;
                    return (
                      <TableCell
                        key={c.id}
                        className={`text-center ${
                          percent >= 80
                            ? "text-green-400"
                            : percent >= 50
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {val}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right font-bold">{os.score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
