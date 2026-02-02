import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseEmployeeOperationsProps {
  isGestor: boolean;
  onSuccess: () => Promise<void>;
}

export function useEmployeeOperations({ isGestor, onSuccess }: UseEmployeeOperationsProps) {
  const addEmployee = useCallback(async (
    name: string, 
    role: string, 
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isGestor) {
      return { success: false, error: "Sem permissão para adicionar funcionário" };
    }

    if (!name.trim()) {
      toast.error("Nome é obrigatório");
      return { success: false, error: "Nome é obrigatório" };
    }

    if (!email.trim()) {
      toast.error("Email é obrigatório");
      return { success: false, error: "Email é obrigatório" };
    }
    
    try {
      const { error } = await supabase
        .from("employees")
        .insert({ name: name.trim(), role: role.trim(), email: email.trim() });

      if (error) {
        console.error("Error adding employee:", error);
        toast.error("Erro ao adicionar funcionário", { description: error.message });
        return { success: false, error: error.message };
      }

      toast.success("Funcionário adicionado com sucesso");
      await onSuccess();
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao adicionar funcionário", { description: message });
      return { success: false, error: message };
    }
  }, [isGestor, onSuccess]);

  const removeEmployee = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!isGestor) {
      return { success: false, error: "Sem permissão para remover funcionário" };
    }
    
    try {
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting employee:", error);
        toast.error("Erro ao remover funcionário", { description: error.message });
        return { success: false, error: error.message };
      }

      toast.success("Funcionário removido com sucesso");
      await onSuccess();
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao remover funcionário", { description: message });
      return { success: false, error: message };
    }
  }, [isGestor, onSuccess]);

  return {
    addEmployee,
    removeEmployee,
  };
}
