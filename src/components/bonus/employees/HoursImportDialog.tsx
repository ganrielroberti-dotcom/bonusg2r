import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, AlertTriangle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useBonus } from "@/contexts/BonusContext";
import { parseAuvoHoursReport, ImportParseResult, ParsedEmployeeHours } from "@/lib/hoursImportParser";
import { toast } from "sonner";

export function HoursImportDialog() {
  const { db, monthKey, setMonthKey, setHorasTrabalhadas, refreshDB } = useBonus();
  const [open, setOpen] = useState(false);
  const [parseResult, setParseResult] = useState<ImportParseResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = parseAuvoHoursReport(text);

      if (result.employees.length === 0) {
        toast.error("Nenhum registro de Check-out encontrado no arquivo");
        return;
      }

      setParseResult(result);
      setOpen(true);
    } catch (err) {
      toast.error("Erro ao ler o arquivo", {
        description: err instanceof Error ? err.message : "Formato inválido",
      });
    }

    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const matchEmployee = (parsedName: string) => {
    // Try exact match first
    const exact = db.employees.find(
      (emp) => emp.name.toLowerCase() === parsedName.toLowerCase()
    );
    if (exact) return exact;

    // Try partial match (parsed name contains or is contained in employee name)
    const partial = db.employees.find(
      (emp) =>
        emp.name.toLowerCase().includes(parsedName.toLowerCase()) ||
        parsedName.toLowerCase().includes(emp.name.toLowerCase())
    );
    return partial || null;
  };

  const handleImport = async () => {
    if (!parseResult) return;

    setIsImporting(true);
    try {
      // Switch to the report's month if different
      if (parseResult.monthKey !== monthKey) {
        setMonthKey(parseResult.monthKey);
      }

      let imported = 0;
      let skipped = 0;

      for (const parsed of parseResult.employees) {
        const employee = matchEmployee(parsed.name);
        if (!employee) {
          skipped++;
          continue;
        }

        const hours = Math.round((parsed.totalMinutes / 60) * 100) / 100;
        await setHorasTrabalhadas(employee.id, hours);
        imported++;
      }

      await refreshDB();

      toast.success(`Importação concluída`, {
        description: `${imported} colaborador(es) atualizado(s)${skipped > 0 ? `, ${skipped} não encontrado(s)` : ""}`,
      });

      setOpen(false);
      setParseResult(null);
    } catch (err) {
      toast.error("Erro na importação", {
        description: err instanceof Error ? err.message : "Erro desconhecido",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const getMatchStatus = (parsed: ParsedEmployeeHours) => {
    const match = matchEmployee(parsed.name);
    return match
      ? { matched: true, employee: match }
      : { matched: false, employee: null };
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xls,.xlsx,.html,.htm"
        className="hidden"
        onChange={handleFileSelect}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        className="gap-2"
      >
        <Upload className="w-4 h-4" />
        Importar Horas (XLS)
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Importar Horas Trabalhadas
            </DialogTitle>
            <DialogDescription>
              Relatório do mês <Badge variant="secondary">{parseResult?.monthKey}</Badge>
              {" · "}{parseResult?.totalRows} registros processados
            </DialogDescription>
          </DialogHeader>

          {parseResult && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground">
                Horas calculadas por colaborador (baseado nos Check-outs):
              </div>

              <div className="space-y-2">
                {parseResult.employees.map((parsed) => {
                  const { matched, employee } = getMatchStatus(parsed);
                  const hours = Math.round((parsed.totalMinutes / 60) * 100) / 100;

                  return (
                    <div
                      key={parsed.name}
                      className={`flex items-center justify-between p-2.5 rounded-lg border ${
                        matched
                          ? "border-border/50 bg-secondary/20"
                          : "border-destructive/30 bg-destructive/5"
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          {matched ? (
                            <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                          )}
                          <span className="text-sm font-medium truncate">
                            {parsed.name}
                          </span>
                        </div>
                        {matched && employee && employee.name !== parsed.name && (
                          <span className="text-xs text-muted-foreground ml-5">
                            → {employee.name}
                          </span>
                        )}
                        {!matched && (
                          <span className="text-xs text-destructive/80 ml-5">
                            Colaborador não encontrado no sistema
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {parsed.osCount} OS
                        </span>
                        <Badge variant="secondary" className="font-mono">
                          {parsed.totalFormatted}h ({hours}h)
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              {parseResult.employees.some((p) => !getMatchStatus(p).matched) && (
                <div className="flex items-start gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Colaboradores não encontrados serão ignorados na importação.
                    Verifique se os nomes cadastrados correspondem aos nomes do relatório.
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isImporting}>
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={isImporting} className="gap-2">
              <Upload className="w-4 h-4" />
              {isImporting ? "Importando..." : "Confirmar Importação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
