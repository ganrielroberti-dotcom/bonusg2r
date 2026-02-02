import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, ArrowUpDown, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBonus } from "@/contexts/BonusContext";
import { useAuth } from "@/contexts/AuthContext";
import { getDifficultyById, getDurationById } from "@/lib/bonusCalculator";
import { OSRecord, SortType } from "@/types/bonus";
import { cn } from "@/lib/utils";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

interface OSListProps {
  onEdit: (os: OSRecord) => void;
}

export function OSList({ onEdit }: OSListProps) {
  const { db, getMonthOSList, removeOS, isLoading } = useBonus();
  const { isGestor } = useAuth();
  const [filterTec, setFilterTec] = useState("");
  const [filterCliente, setFilterCliente] = useState("");
  const [sortBy, setSortBy] = useState<SortType>("data_desc");
  const [deleteTarget, setDeleteTarget] = useState<OSRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredAndSorted = useMemo(() => {
    let list = getMonthOSList();

    // Apply filters
    if (filterTec.trim()) {
      const term = filterTec.toLowerCase();
      list = list.filter((r) => r.employeeName.toLowerCase().includes(term));
    }
    if (filterCliente.trim()) {
      const term = filterCliente.toLowerCase();
      list = list.filter((r) => r.cliente.toLowerCase().includes(term));
    }

    // Apply sorting
    list.sort((a, b) => {
      switch (sortBy) {
        case "data_asc":
          return (a.date || "").localeCompare(b.date || "");
        case "score_desc":
          return (b.score || 0) - (a.score || 0);
        case "score_asc":
          return (a.score || 0) - (b.score || 0);
        case "ceq_desc":
          return (b.ceQ || 0) - (a.ceQ || 0);
        case "ceq_asc":
          return (a.ceQ || 0) - (b.ceQ || 0);
        default: // data_desc
          return (b.date || "").localeCompare(a.date || "");
      }
    });

    return list;
  }, [getMonthOSList, filterTec, filterCliente, sortBy]);

  const handleDeleteClick = (os: OSRecord) => {
    setDeleteTarget(os);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    
    setIsDeleting(true);
    try {
      await removeOS(deleteTarget.id);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const getScoreClass = (score: number, maxPts: number) => {
    const q = maxPts > 0 ? score / maxPts : 0;
    if (q >= 0.9) return "status-ok";
    if (q >= 0.6) return "status-warn";
    return "status-bad";
  };

  if (isLoading) {
    return <LoadingSkeleton variant="table" count={5} />;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" />
            Filtrar por técnico
          </Label>
          <Input
            value={filterTec}
            onChange={(e) => setFilterTec(e.target.value)}
            placeholder="Nome..."
            className="input-focus-ring"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" />
            Filtrar por cliente
          </Label>
          <Input
            value={filterCliente}
            onChange={(e) => setFilterCliente(e.target.value)}
            placeholder="Nome..."
            className="input-focus-ring"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5" />
            Ordenar por
          </Label>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortType)}>
            <SelectTrigger className="input-focus-ring">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="data_desc">Data (recente)</SelectItem>
              <SelectItem value="data_asc">Data (antiga)</SelectItem>
              <SelectItem value="score_desc">Pontuação (maior)</SelectItem>
              <SelectItem value="score_asc">Pontuação (menor)</SelectItem>
              <SelectItem value="ceq_desc">CE qual. (maior)</SelectItem>
              <SelectItem value="ceq_asc">CE qual. (menor)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                <TableHead className="font-bold">Data</TableHead>
                <TableHead className="font-bold">OS</TableHead>
                <TableHead className="font-bold">Cliente</TableHead>
                <TableHead className="font-bold">Colaborador</TableHead>
                <TableHead className="font-bold">Dificuldade</TableHead>
                <TableHead className="font-bold">Duração</TableHead>
                <TableHead className="font-bold text-right">Score</TableHead>
                <TableHead className="font-bold text-right">CE Final</TableHead>
                <TableHead className="font-bold text-right">CE qual.</TableHead>
                {isGestor && <TableHead className="font-bold w-24"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isGestor ? 10 : 9} className="text-center py-8 text-muted-foreground">
                    Nenhuma OS encontrada para este mês.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSorted.map((os) => {
                  const diff = getDifficultyById(db.cfg, os.dificuldadeId);
                  const dur = getDurationById(db.cfg, os.duracaoId);
                  return (
                    <motion.tr
                      key={os.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                    >
                      <TableCell className="font-mono text-sm">{os.date}</TableCell>
                      <TableCell className="font-medium">{os.osId}</TableCell>
                      <TableCell>{os.cliente}</TableCell>
                      <TableCell>{os.employeeName}</TableCell>
                      <TableCell>{diff.label}</TableCell>
                      <TableCell>{dur.label}</TableCell>
                      <TableCell className={cn("text-right font-bold", getScoreClass(os.score, db.cfg.maxPts))}>
                        {os.score} / {db.cfg.maxPts}
                      </TableCell>
                      <TableCell className="text-right font-mono">{os.ceFinal.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">{os.ceQ.toFixed(2)}</TableCell>
                      {isGestor && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onEdit(os)}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(os)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </motion.tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={`Excluir OS ${deleteTarget?.osId || ""}?`}
        description="Esta ação não pode ser desfeita. A OS será permanentemente removida do sistema."
        isLoading={isDeleting}
      />
    </div>
  );
}
