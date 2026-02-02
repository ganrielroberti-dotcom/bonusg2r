import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OSRecord } from "@/types/bonus";
import { toast } from "sonner";

interface UseOptimisticOSProps {
  isGestor: boolean;
  osList: OSRecord[];
  setOptimisticOS: React.Dispatch<React.SetStateAction<OSRecord[]>>;
  onSuccess: () => Promise<void>;
}

interface OperationResult {
  success: boolean;
  error?: string;
}

export function useOptimisticOS({
  isGestor,
  osList,
  setOptimisticOS,
  onSuccess,
}: UseOptimisticOSProps) {
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());

  const saveOS = useCallback(
    async (rec: OSRecord): Promise<OperationResult> => {
      if (!isGestor) {
        return { success: false, error: "Sem permissão para salvar OS" };
      }

      const isUpdate = osList.some((os) => os.id === rec.id);
      const previousOS = [...osList];

      // Optimistic update
      if (isUpdate) {
        setOptimisticOS((prev) => prev.map((os) => (os.id === rec.id ? rec : os)));
      } else {
        setOptimisticOS((prev) => [...prev, rec]);
      }

      setPendingOperations((prev) => new Set(prev).add(rec.id));

      try {
        const osRecord = {
          id: rec.id,
          employee_id: rec.employeeId,
          employee_name: rec.employeeName,
          employee_role: rec.role,
          month_key: rec.monthKey,
          date: rec.date,
          os_id: rec.osId,
          cliente: rec.cliente,
          tipo: rec.tipo,
          dificuldade_id: rec.dificuldadeId,
          duracao_id: rec.duracaoId,
          duracao_mult: rec.duracaoMult,
          valor_os: rec.valorOs,
          setor: rec.setor,
          obs: rec.obs,
          crit: rec.crit,
          score: rec.score,
          ce: rec.ce,
          ce_final: rec.ceFinal,
          ce_q: rec.ceQ,
        };

        const { error } = await supabase
          .from("os_records")
          .upsert(osRecord, { onConflict: "id" });

        if (error) {
          // Rollback on error
          setOptimisticOS(previousOS);
          console.error("Error saving OS:", error);
          toast.error("Erro ao salvar OS", { description: error.message });
          return { success: false, error: error.message };
        }

        toast.success(isUpdate ? "OS atualizada com sucesso" : "OS salva com sucesso");
        await onSuccess();
        return { success: true };
      } catch (error) {
        // Rollback on error
        setOptimisticOS(previousOS);
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        toast.error("Erro ao salvar OS", { description: message });
        return { success: false, error: message };
      } finally {
        setPendingOperations((prev) => {
          const next = new Set(prev);
          next.delete(rec.id);
          return next;
        });
      }
    },
    [isGestor, osList, setOptimisticOS, onSuccess]
  );

  const removeOS = useCallback(
    async (id: string): Promise<OperationResult> => {
      if (!isGestor) {
        return { success: false, error: "Sem permissão para remover OS" };
      }

      const previousOS = [...osList];
      const removedOS = osList.find((os) => os.id === id);

      // Optimistic removal
      setOptimisticOS((prev) => prev.filter((os) => os.id !== id));
      setPendingOperations((prev) => new Set(prev).add(id));

      try {
        const { error } = await supabase.from("os_records").delete().eq("id", id);

        if (error) {
          // Rollback on error
          setOptimisticOS(previousOS);
          console.error("Error deleting OS:", error);
          toast.error("Erro ao remover OS", { description: error.message });
          return { success: false, error: error.message };
        }

        toast.success("OS removida com sucesso");
        await onSuccess();
        return { success: true };
      } catch (error) {
        // Rollback on error
        setOptimisticOS(previousOS);
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        toast.error("Erro ao remover OS", { description: message });
        return { success: false, error: message };
      } finally {
        setPendingOperations((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [isGestor, osList, setOptimisticOS, onSuccess]
  );

  return {
    saveOS,
    removeOS,
    isPending: (id: string) => pendingOperations.has(id),
    hasPendingOperations: pendingOperations.size > 0,
  };
}
