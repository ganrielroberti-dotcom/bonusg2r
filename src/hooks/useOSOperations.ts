import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OSRecord } from "@/types/bonus";
import { toast } from "sonner";

interface UseOSOperationsProps {
  isGestor: boolean;
  onSuccess: () => Promise<void>;
}

interface OperationState {
  saving: boolean;
  deleting: string | null; // ID of OS being deleted
}

export function useOSOperations({ isGestor, onSuccess }: UseOSOperationsProps) {
  const saveOS = useCallback(async (rec: OSRecord): Promise<{ success: boolean; error?: string }> => {
    if (!isGestor) {
      return { success: false, error: "Sem permissão para salvar OS" };
    }
    
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
        console.error("Error saving OS:", error);
        toast.error("Erro ao salvar OS", { description: error.message });
        return { success: false, error: error.message };
      }

      toast.success("OS salva com sucesso");
      await onSuccess();
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao salvar OS", { description: message });
      return { success: false, error: message };
    }
  }, [isGestor, onSuccess]);

  const removeOS = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!isGestor) {
      return { success: false, error: "Sem permissão para remover OS" };
    }
    
    try {
      const { error } = await supabase
        .from("os_records")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting OS:", error);
        toast.error("Erro ao remover OS", { description: error.message });
        return { success: false, error: error.message };
      }

      toast.success("OS removida com sucesso");
      await onSuccess();
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao remover OS", { description: message });
      return { success: false, error: message };
    }
  }, [isGestor, onSuccess]);

  return {
    saveOS,
    removeOS,
  };
}
