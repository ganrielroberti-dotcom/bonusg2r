import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseHorasOperationsProps {
  isGestor: boolean;
  monthKey: string;
  onSuccess: () => Promise<void>;
}

export function useHorasOperations({ isGestor, monthKey, onSuccess }: UseHorasOperationsProps) {
  const setHorasTrabalhadas = useCallback(async (
    empId: string, 
    horas: number
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isGestor) {
      return { success: false, error: "Sem permissão para atualizar horas" };
    }

    if (horas < 0) {
      toast.error("Horas não podem ser negativas");
      return { success: false, error: "Horas não podem ser negativas" };
    }
    
    try {
      const { error } = await supabase
        .from("horas_trabalhadas")
        .upsert(
          { month_key: monthKey, employee_id: empId, horas },
          { onConflict: "month_key,employee_id" }
        );

      if (error) {
        console.error("Error setting horas:", error);
        toast.error("Erro ao atualizar horas", { description: error.message });
        return { success: false, error: error.message };
      }

      toast.success("Horas atualizadas");
      await onSuccess();
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao atualizar horas", { description: message });
      return { success: false, error: message };
    }
  }, [isGestor, monthKey, onSuccess]);

  return {
    setHorasTrabalhadas,
  };
}
