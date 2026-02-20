import { useState } from "react";
import { Search, Loader2, Check, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuvoOSLookup } from "@/hooks/useAuvoIntegration";
import { AuvoTask } from "@/types/auvo";
import { toast } from "sonner";

interface AuvoOSLookupProps {
  osNumber: string;
  onDataPulled: (data: {
    osId: string;
    cliente: string;
    date: string;
    tipo: string;
    descricao: string;
    tecnicoName: string;
    tecnicoAuvoId: number;
    lastActivityDate: string | null;
    taskStatus: number;
  }) => void;
}

export function AuvoOSLookup({ osNumber, onDataPulled }: AuvoOSLookupProps) {
  const { searchOS, isSearching } = useAuvoOSLookup();
  const [showDialog, setShowDialog] = useState(false);
  const [foundTask, setFoundTask] = useState<AuvoTask | null>(null);

  const handleSearch = async () => {
    if (!osNumber.trim()) {
      toast.info("Digite o número da OS antes de buscar");
      return;
    }

    const result = await searchOS(osNumber);
    if (result.found && result.task) {
      setFoundTask(result.task as AuvoTask);
      setShowDialog(true);
    } else {
      toast.info("OS não encontrada no Auvo");
    }
  };

  const handlePull = () => {
    if (!foundTask) return;

    // Parse date from Auvo (taskDate format varies)
    let dateISO = "";
    if (foundTask.taskDate) {
      try {
        const d = new Date(foundTask.taskDate);
        if (!isNaN(d.getTime())) {
          dateISO = d.toISOString().slice(0, 10);
        }
      } catch { /* keep empty */ }
    }

    // Determine last activity date: checkOutDate > checkInDate > taskDate
    const lastActivityDate = foundTask.checkOutDate || foundTask.checkInDate || null;

    onDataPulled({
      osId: foundTask.externalId || String(foundTask.taskID),
      cliente: foundTask.customerDescription || "",
      date: dateISO,
      tipo: foundTask.taskTypeDescription || "",
      descricao: foundTask.orientation || "",
      tecnicoName: foundTask.userToName || "",
      tecnicoAuvoId: foundTask.idUserTo,
      lastActivityDate,
      taskStatus: foundTask.taskStatus,
    });

    setShowDialog(false);
    setFoundTask(null);
    toast.success("Dados importados do Auvo");
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleSearch}
        disabled={isSearching || !osNumber.trim()}
        className="shrink-0"
        title="Buscar no Auvo"
      >
        {isSearching ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Search className="w-4 h-4" />
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>OS encontrada no Auvo</DialogTitle>
            <DialogDescription>
              Deseja puxar os dados automaticamente?
            </DialogDescription>
          </DialogHeader>

          {foundTask && (
            <>
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Número:</span>
                    <p className="font-medium">{foundTask.externalId || foundTask.taskID}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cliente:</span>
                    <p className="font-medium">{foundTask.customerDescription || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data:</span>
                    <p className="font-medium">
                      {foundTask.taskDate
                        ? new Date(foundTask.taskDate).toLocaleDateString("pt-BR")
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>
                    <p className="font-medium">{foundTask.taskTypeDescription || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Técnico:</span>
                    <p className="font-medium">{foundTask.userToName || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Orientação:</span>
                    <p className="font-medium text-xs truncate">{foundTask.orientation || "—"}</p>
                  </div>
                </div>
              </div>

              {!foundTask.checkOutDate && (
                <div className="flex items-start gap-2 p-2.5 rounded-md bg-accent border border-border text-xs">
                  <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    Esta OS <strong>não possui checkout</strong>. O mês de referência pode mudar quando a atividade for finalizada no Auvo.
                  </p>
                </div>
              )}
            </>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)} className="gap-1.5">
              <X className="w-4 h-4" />
              Não agora
            </Button>
            <Button onClick={handlePull} className="btn-primary-glow gap-1.5">
              <Check className="w-4 h-4" />
              Puxar dados
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
