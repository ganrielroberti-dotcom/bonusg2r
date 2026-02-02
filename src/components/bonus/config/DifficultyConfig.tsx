import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DifficultyWeight } from "@/types/bonus";
import { toast } from "sonner";

interface DifficultyConfigProps {
  difficultyWeights: DifficultyWeight[];
  onSave: (weights: DifficultyWeight[]) => Promise<void>;
}

export function DifficultyConfig({ difficultyWeights, onSave }: DifficultyConfigProps) {
  const [weights, setWeights] = useState<DifficultyWeight[]>(difficultyWeights);
  const [isSaving, setIsSaving] = useState(false);

  const updateWeight = (id: string, field: keyof DifficultyWeight, value: string | number) => {
    setWeights(prev => prev.map(w => 
      w.id === id ? { ...w, [field]: value } : w
    ));
  };

  const handleSave = async () => {
    // Validate CE values
    for (const w of weights) {
      if (w.ce <= 0) {
        toast.error(`CE de "${w.label}" deve ser maior que 0`);
        return;
      }
    }

    setIsSaving(true);
    try {
      await onSave(weights);
      toast.success("Pesos de dificuldade salvos!");
    } catch {
      toast.error("Erro ao salvar pesos");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Pesos de Dificuldade (CE)</Label>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
        <p className="text-muted-foreground">
          O CE (Coeficiente de Esforço) multiplica o valor base da OS conforme a dificuldade. 
          Ex: CE 1.5 significa 50% mais esforço que a referência.
        </p>
      </div>

      <AnimatePresence mode="popLayout">
        {weights.map((d, index) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 rounded-lg bg-secondary/30 border border-border/50 space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <Input
                  value={d.label}
                  onChange={(e) => updateWeight(d.id, "label", e.target.value)}
                  className="input-focus-ring h-9"
                  placeholder="Ex: Fácil"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">CE</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={d.ce}
                  onChange={(e) => updateWeight(d.id, "ce", parseFloat(e.target.value) || 0)}
                  className="input-focus-ring h-9 font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Descrição</Label>
              <Input
                value={d.desc}
                onChange={(e) => updateWeight(d.id, "desc", e.target.value)}
                className="input-focus-ring h-9"
                placeholder="Ex: Tarefa simples, baixo risco"
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <Button 
        onClick={handleSave} 
        disabled={isSaving}
        className="btn-primary-glow gap-2 w-full"
      >
        <Save className="w-4 h-4" />
        {isSaving ? "Salvando..." : "Salvar Dificuldades"}
      </Button>
    </div>
  );
}
