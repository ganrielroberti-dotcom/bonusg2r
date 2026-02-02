import { useState, useEffect } from "react";
import { Save, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Config } from "@/types/bonus";
import { toNum } from "@/lib/database";
import { toast } from "sonner";

interface GeneralConfigProps {
  config: Config;
  onSave: (cfg: Partial<Config>) => Promise<void>;
}

export function GeneralConfig({ config, onSave }: GeneralConfigProps) {
  const [bonusCap, setBonusCap] = useState(String(config.bonusCap || 600));
  const [horasEsperadas, setHorasEsperadas] = useState(String(config.horasEsperadas || 220));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setBonusCap(String(config.bonusCap || 600));
    setHorasEsperadas(String(config.horasEsperadas || 220));
  }, [config]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        bonusCap: toNum(bonusCap),
        horasEsperadas: toNum(horasEsperadas) || 220,
      });
      toast.success("Configurações gerais salvas!");
    } catch {
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold">Configurações Gerais</Label>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="bonusCap" className="text-xs text-muted-foreground">Teto do Bônus (R$)</Label>
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
          <Label htmlFor="horasEsperadas" className="text-xs text-muted-foreground">Horas Esperadas/Mês</Label>
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

      <Button 
        onClick={handleSave} 
        disabled={isSaving}
        className="btn-primary-glow gap-2 w-full"
      >
        <Save className="w-4 h-4" />
        {isSaving ? "Salvando..." : "Salvar Configurações Gerais"}
      </Button>
    </div>
  );
}
