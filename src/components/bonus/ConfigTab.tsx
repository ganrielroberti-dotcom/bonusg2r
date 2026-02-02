import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBonus } from "@/contexts/BonusContext";
import { useAuth } from "@/contexts/AuthContext";
import { toNum } from "@/lib/database";
import { toast } from "sonner";

export function ConfigTab() {
  const { db, updateConfig } = useBonus();
  const { isGestor } = useAuth();
  
  const [bonusCap, setBonusCap] = useState(String(db.cfg.bonusCap || 600));
  const [horasEsperadas, setHorasEsperadas] = useState(String(db.cfg.horasEsperadas || 220));

  useEffect(() => {
    setBonusCap(String(db.cfg.bonusCap || 600));
    setHorasEsperadas(String(db.cfg.horasEsperadas || 220));
  }, [db.cfg]);

  const handleSave = async () => {
    try {
      await updateConfig({
        bonusCap: toNum(bonusCap),
        horasEsperadas: toNum(horasEsperadas) || 220,
      });
      toast.success("Configurações salvas!");
    } catch {
      toast.error("Erro ao salvar configurações");
    }
  };

  if (!isGestor) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Apenas gestores podem alterar configurações.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="bonusCap">Teto do Bônus (R$)</Label>
          <Input
            id="bonusCap"
            type="number"
            min="0"
            step="1"
            value={bonusCap}
            onChange={(e) => setBonusCap(e.target.value)}
            className="input-focus-ring"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="horasEsperadas">Horas Esperadas/Mês</Label>
          <Input
            id="horasEsperadas"
            type="number"
            min="0"
            step="1"
            value={horasEsperadas}
            onChange={(e) => setHorasEsperadas(e.target.value)}
            className="input-focus-ring"
          />
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
        <p className="text-muted-foreground">
          O teto é o valor máximo para quem trabalha todas as horas esperadas e atinge 100% nas camadas.
          O bônus é proporcional às horas trabalhadas.
        </p>
      </div>

      <div className="h-px bg-border" />

      {/* Difficulty weights display */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Pesos de Dificuldade (CE)</Label>
        <div className="space-y-2">
          {db.cfg.difficultyWeights.map((d) => (
            <div
              key={d.id}
              className="p-3 rounded-lg bg-secondary/30 border border-border/50"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{d.label}</span>
                <span className="font-mono text-primary">CE {d.ce}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{d.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-border" />

      <Button onClick={handleSave} className="btn-primary-glow gap-2">
        <Save className="w-4 h-4" />
        Salvar Config
      </Button>
    </motion.div>
  );
}
