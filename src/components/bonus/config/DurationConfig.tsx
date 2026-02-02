import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Plus, Trash2, Info, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DurationWeight } from "@/types/bonus";
import { toast } from "sonner";

interface DurationConfigProps {
  durationWeights: DurationWeight[];
  onSave: (weights: DurationWeight[]) => Promise<void>;
}

export function DurationConfig({ durationWeights, onSave }: DurationConfigProps) {
  const [weights, setWeights] = useState<DurationWeight[]>(durationWeights);
  const [isSaving, setIsSaving] = useState(false);

  const updateWeight = (id: string, field: keyof DurationWeight, value: string | number) => {
    setWeights(prev => prev.map(w => 
      w.id === id ? { ...w, [field]: value } : w
    ));
  };

  const addDuration = () => {
    const newId = `dur_${Date.now()}`;
    setWeights(prev => [...prev, {
      id: newId,
      label: "Nova Duração",
      mult: 1.0
    }]);
  };

  const removeDuration = (id: string) => {
    if (weights.length <= 1) {
      toast.error("Deve haver pelo menos uma duração");
      return;
    }
    setWeights(prev => prev.filter(w => w.id !== id));
  };

  const handleSave = async () => {
    // Validate
    for (const w of weights) {
      if (!w.label.trim()) {
        toast.error("Todas as durações precisam de um nome");
        return;
      }
      if (w.mult <= 0) {
        toast.error(`Multiplicador de "${w.label}" deve ser maior que 0`);
        return;
      }
    }

    setIsSaving(true);
    try {
      await onSave(weights);
      toast.success("Durações salvas!");
    } catch {
      toast.error("Erro ao salvar durações");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Tipos de Duração</Label>
        <Button
          onClick={addDuration}
          size="sm"
          variant="outline"
          className="gap-1.5 h-8"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar
        </Button>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
        <p className="text-muted-foreground">
          O multiplicador de duração pondera o CE conforme o tempo de execução da OS.
          Ex: Mult 2.0 dobra o peso do CE para trabalhos mais longos.
        </p>
      </div>

      <AnimatePresence mode="popLayout">
        {weights.map((d, index) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, height: 0 }}
            transition={{ delay: index * 0.03 }}
            layout
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
            
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <Input
                  value={d.label}
                  onChange={(e) => updateWeight(d.id, "label", e.target.value)}
                  className="input-focus-ring h-9"
                  placeholder="Ex: Até 1 dia"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Multiplicador</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={d.mult}
                  onChange={(e) => updateWeight(d.id, "mult", parseFloat(e.target.value) || 0)}
                  className="input-focus-ring h-9 font-mono"
                />
              </div>
            </div>

            <Button
              onClick={() => removeDuration(d.id)}
              size="icon"
              variant="ghost"
              className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>

      {weights.length === 0 && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          Nenhuma duração configurada. Clique em "Adicionar" para criar.
        </div>
      )}

      <Button 
        onClick={handleSave} 
        disabled={isSaving || weights.length === 0}
        className="btn-primary-glow gap-2 w-full"
      >
        <Save className="w-4 h-4" />
        {isSaving ? "Salvando..." : "Salvar Durações"}
      </Button>
    </div>
  );
}
