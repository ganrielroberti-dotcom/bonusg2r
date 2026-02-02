import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Config } from "@/types/bonus";
import { toast } from "sonner";

interface UseConfigOperationsProps {
  isGestor: boolean;
  onSuccess: () => Promise<void>;
}

export function useConfigOperations({ isGestor, onSuccess }: UseConfigOperationsProps) {
  const updateConfig = useCallback(async (cfg: Partial<Config>): Promise<{ success: boolean; error?: string }> => {
    if (!isGestor) {
      return { success: false, error: "Sem permissão para atualizar configuração" };
    }
    
    try {
      const updateData: Record<string, unknown> = {};
      if (cfg.bonusCap !== undefined) updateData.bonus_cap = cfg.bonusCap;
      if (cfg.maxPts !== undefined) updateData.max_pts = cfg.maxPts;
      if (cfg.horasEsperadas !== undefined) updateData.horas_esperadas = cfg.horasEsperadas;
      if (cfg.layerWeights) updateData.layer_weights = cfg.layerWeights;
      if (cfg.durationWeights) updateData.duration_weights = cfg.durationWeights;
      if (cfg.difficultyWeights) updateData.difficulty_weights = cfg.difficultyWeights;

      const { data: existingConfig } = await supabase
        .from("config")
        .select("id")
        .limit(1)
        .single();

      if (existingConfig) {
        const { error } = await supabase
          .from("config")
          .update(updateData)
          .eq("id", existingConfig.id);

        if (error) {
          console.error("Error updating config:", error);
          toast.error("Erro ao atualizar configuração", { description: error.message });
          return { success: false, error: error.message };
        }
      } else {
        const { error } = await supabase
          .from("config")
          .insert(updateData);

        if (error) {
          console.error("Error creating config:", error);
          toast.error("Erro ao criar configuração", { description: error.message });
          return { success: false, error: error.message };
        }
      }

      toast.success("Configuração salva com sucesso");
      await onSuccess();
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao salvar configuração", { description: message });
      return { success: false, error: message };
    }
  }, [isGestor, onSuccess]);

  return {
    updateConfig,
  };
}
