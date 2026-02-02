import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Employee } from "@/types/bonus";
import { toast } from "sonner";

interface UseOptimisticEmployeesProps {
  isGestor: boolean;
  employees: Employee[];
  setOptimisticEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  onSuccess: () => Promise<void>;
}

interface OperationResult {
  success: boolean;
  error?: string;
}

export function useOptimisticEmployees({
  isGestor,
  employees,
  setOptimisticEmployees,
  onSuccess,
}: UseOptimisticEmployeesProps) {
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());

  const addEmployee = useCallback(
    async (name: string, role: string, email: string): Promise<OperationResult> => {
      if (!isGestor) {
        return { success: false, error: "Sem permissão para adicionar funcionário" };
      }

      // Generate temporary ID for optimistic update
      const tempId = `temp-${Date.now()}`;
      const newEmployee: Employee = {
        id: tempId,
        name: name.trim(),
        role: role.trim(),
      };

      const previousEmployees = [...employees];

      // Optimistic add
      setOptimisticEmployees((prev) => [...prev, newEmployee]);
      setPendingOperations((prev) => new Set(prev).add(tempId));

      try {
        const { data, error } = await supabase
          .from("employees")
          .insert({ name: name.trim(), role: role.trim(), email: email.trim() })
          .select()
          .single();

        if (error) {
          // Rollback on error
          setOptimisticEmployees(previousEmployees);
          console.error("Error adding employee:", error);
          
          if (error.message?.includes("duplicate key") || error.code === "23505") {
            toast.error("Já existe um colaborador com este email");
          } else {
            toast.error("Erro ao adicionar funcionário", { description: error.message });
          }
          return { success: false, error: error.message };
        }

        // Replace temp employee with real one
        setOptimisticEmployees((prev) =>
          prev.map((emp) =>
            emp.id === tempId
              ? { id: data.id, name: data.name, role: data.role }
              : emp
          )
        );

        toast.success("Funcionário adicionado com sucesso");
        await onSuccess();
        return { success: true };
      } catch (error) {
        // Rollback on error
        setOptimisticEmployees(previousEmployees);
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        toast.error("Erro ao adicionar funcionário", { description: message });
        return { success: false, error: message };
      } finally {
        setPendingOperations((prev) => {
          const next = new Set(prev);
          next.delete(tempId);
          return next;
        });
      }
    },
    [isGestor, employees, setOptimisticEmployees, onSuccess]
  );

  const removeEmployee = useCallback(
    async (id: string): Promise<OperationResult> => {
      if (!isGestor) {
        return { success: false, error: "Sem permissão para remover funcionário" };
      }

      const previousEmployees = [...employees];
      const removedEmployee = employees.find((emp) => emp.id === id);

      // Optimistic removal
      setOptimisticEmployees((prev) => prev.filter((emp) => emp.id !== id));
      setPendingOperations((prev) => new Set(prev).add(id));

      try {
        const { error } = await supabase.from("employees").delete().eq("id", id);

        if (error) {
          // Rollback on error
          setOptimisticEmployees(previousEmployees);
          console.error("Error deleting employee:", error);
          toast.error("Erro ao remover funcionário", { description: error.message });
          return { success: false, error: error.message };
        }

        toast.success("Funcionário removido com sucesso");
        await onSuccess();
        return { success: true };
      } catch (error) {
        // Rollback on error
        setOptimisticEmployees(previousEmployees);
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        toast.error("Erro ao remover funcionário", { description: message });
        return { success: false, error: message };
      } finally {
        setPendingOperations((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [isGestor, employees, setOptimisticEmployees, onSuccess]
  );

  return {
    addEmployee,
    removeEmployee,
    isPending: (id: string) => pendingOperations.has(id),
    hasPendingOperations: pendingOperations.size > 0,
  };
}
