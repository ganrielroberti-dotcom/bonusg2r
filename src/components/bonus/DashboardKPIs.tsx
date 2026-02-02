import { useMemo } from "react";
import { motion } from "framer-motion";
import { FileSpreadsheet, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBonus } from "@/contexts/BonusContext";
import { KPICard } from "./KPICard";
import { MonthSelector } from "./MonthSelector";
import { openAuditWindow } from "./audit";
import {
  formatBRL,
  getMonthOS,
  calcBonusCamadas,
  exportToCSV,
  getDifficultyById,
  getDurationById,
  clampInt,
} from "@/lib/database";
import { CRITERIA } from "@/lib/constants";

export function DashboardKPIs() {
  const { db, monthKey, selectedEmployeeId } = useBonus();

  const stats = useMemo(() => {
    const os = getMonthOS(db, monthKey);
    let totalBonus = 0;
    let totalCEQ = 0;

    for (const emp of db.employees) {
      const empOS = os.filter((r) => r.employeeId === emp.id);
      const camadas = calcBonusCamadas(db.cfg, db, monthKey, emp.id, empOS);
      totalBonus += camadas.bonusTotal;
      totalCEQ += camadas.ceQTotal;
    }

    return {
      totalBonus,
      totalCEQ,
      totalOS: os.length,
    };
  }, [db, monthKey]);

  const handleExportMonth = () => {
    const os = getMonthOS(db, monthKey);
    const header = [
      "Mes", "Data", "OS", "Cliente", "Colaborador", "Funcao", "Dificuldade",
      "Duracao", "Multiplicador", "CE_Base", "CE_Final", "CE_Qualidade",
      "Pontos", "MaxPts", "Obs",
      ...CRITERIA.map((c) => `${c.title} (0-${c.max})`),
    ];
    const rows: (string | number)[][] = [header];

    for (const r of os) {
      const diff = getDifficultyById(db.cfg, r.dificuldadeId);
      const dur = getDurationById(db.cfg, r.duracaoId);
      const base = [
        r.monthKey, r.date, r.osId, r.cliente, r.employeeName, r.role,
        diff.label, dur.label, r.duracaoMult, r.ce, r.ceFinal, r.ceQ,
        r.score, db.cfg.maxPts, r.obs,
      ];
      const critCols = CRITERIA.map((c) =>
        clampInt(r.crit?.[c.id] ?? 0, 0, c.max)
      );
      rows.push([...base, ...critCols]);
    }

    const stamp = new Date().toISOString().slice(0, 10);
    exportToCSV(rows, `g2r_ce_os_${monthKey}_${stamp}.csv`);
  };

  const handleExportAll = () => {
    const header = [
      "Mes", "Data", "OS", "Cliente", "Colaborador", "Funcao", "Dificuldade",
      "Duracao", "Multiplicador", "CE_Base", "CE_Final", "CE_Qualidade",
      "Pontos", "MaxPts", "Obs",
      ...CRITERIA.map((c) => `${c.title} (0-${c.max})`),
    ];
    const rows: (string | number)[][] = [header];

    for (const r of db.os) {
      const diff = getDifficultyById(db.cfg, r.dificuldadeId);
      const dur = getDurationById(db.cfg, r.duracaoId);
      const base = [
        r.monthKey, r.date, r.osId, r.cliente, r.employeeName, r.role,
        diff.label, dur.label, r.duracaoMult, r.ce, r.ceFinal, r.ceQ,
        r.score, db.cfg.maxPts, r.obs,
      ];
      const critCols = CRITERIA.map((c) =>
        clampInt(r.crit?.[c.id] ?? 0, 0, c.max)
      );
      rows.push([...base, ...critCols]);
    }

    const stamp = new Date().toISOString().slice(0, 10);
    exportToCSV(rows, `g2r_ce_os_todas_${stamp}.csv`);
  };

  const handleAudit = () => {
    if (!selectedEmployeeId) {
      alert("Selecione um colaborador para gerar a auditoria.");
      return;
    }
    openAuditWindow(db, monthKey, selectedEmployeeId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-4 space-y-4"
    >
      {/* Month Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthSelector />
        <div className="text-sm text-muted-foreground">
          {stats.totalOS} OS registradas
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KPICard
          label="Bônus do mês"
          value={formatBRL(stats.totalBonus)}
          hint="Soma de todos os bônus"
          variant="success"
        />
        <KPICard
          label="Total CE (qual.)"
          value={stats.totalCEQ.toFixed(2)}
          hint="Soma de todos os CE qualificados"
          variant="primary"
        />
        <KPICard
          label="Total OS"
          value={stats.totalOS}
          hint="OS registradas no mês"
        />
      </div>

      <div className="flex gap-3 flex-wrap">
        <Button onClick={handleAudit} className="btn-primary-glow gap-2">
          <FileText className="w-4 h-4" />
          Gerar Auditoria do Bônus
        </Button>
        <Button variant="outline" onClick={handleExportMonth} className="gap-2">
          <Download className="w-4 h-4" />
          Exportar Mês (CSV)
        </Button>
        <Button variant="outline" onClick={handleExportAll} className="gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          Exportar Tudo (CSV)
        </Button>
      </div>
    </motion.div>
  );
}
