import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Info, UserPlus, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBonus } from "@/contexts/BonusContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toNum } from "@/lib/database";
import { toast } from "sonner";

interface GestorEmail {
  id: string;
  email: string;
}

export function ConfigTab() {
  const { db, updateConfig } = useBonus();
  const { isGestor } = useAuth();
  
  const [bonusCap, setBonusCap] = useState(String(db.cfg.bonusCap || 600));
  const [horasEsperadas, setHorasEsperadas] = useState(String(db.cfg.horasEsperadas || 220));
  
  // Gestor emails management
  const [gestorEmails, setGestorEmails] = useState<GestorEmail[]>([]);
  const [newGestorEmail, setNewGestorEmail] = useState("");
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);

  useEffect(() => {
    setBonusCap(String(db.cfg.bonusCap || 600));
    setHorasEsperadas(String(db.cfg.horasEsperadas || 220));
  }, [db.cfg]);

  // Fetch gestor emails
  useEffect(() => {
    if (!isGestor) return;
    
    const fetchGestorEmails = async () => {
      setIsLoadingEmails(true);
      const { data, error } = await supabase
        .from("gestor_emails")
        .select("id, email")
        .order("email");
      
      if (!error && data) {
        setGestorEmails(data);
      }
      setIsLoadingEmails(false);
    };
    
    fetchGestorEmails();
  }, [isGestor]);

  const handleAddGestorEmail = async () => {
    const email = newGestorEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast.error("Digite um e-mail válido");
      return;
    }
    
    if (gestorEmails.some(g => g.email === email)) {
      toast.error("Este e-mail já está na lista");
      return;
    }
    
    const { data, error } = await supabase
      .from("gestor_emails")
      .insert({ email })
      .select("id, email")
      .single();
    
    if (error) {
      toast.error("Erro ao adicionar e-mail");
      return;
    }
    
    setGestorEmails([...gestorEmails, data]);
    setNewGestorEmail("");
    toast.success("E-mail adicionado à lista de gestores");
  };

  const handleRemoveGestorEmail = async (id: string) => {
    const { error } = await supabase
      .from("gestor_emails")
      .delete()
      .eq("id", id);
    
    if (error) {
      toast.error("Erro ao remover e-mail");
      return;
    }
    
    setGestorEmails(gestorEmails.filter(g => g.id !== id));
    toast.success("E-mail removido da lista");
  };

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

      <div className="h-px bg-border" />

      {/* Gestor Emails Management */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <Label className="text-sm font-semibold">E-mails de Gestores</Label>
        </div>
        
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
          <p className="text-muted-foreground">
            Usuários que se cadastrarem com um desses e-mails receberão automaticamente o papel de <strong>Gestor</strong>.
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="novo-gestor@empresa.com"
            value={newGestorEmail}
            onChange={(e) => setNewGestorEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddGestorEmail()}
            className="input-focus-ring flex-1"
          />
          <Button onClick={handleAddGestorEmail} size="icon" variant="outline">
            <UserPlus className="w-4 h-4" />
          </Button>
        </div>

        {isLoadingEmails ? (
          <div className="text-sm text-muted-foreground">Carregando...</div>
        ) : gestorEmails.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Nenhum e-mail de gestor cadastrado. Apenas o primeiro usuário será gestor automaticamente.
          </div>
        ) : (
          <div className="space-y-2">
            {gestorEmails.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50"
              >
                <span className="text-sm font-medium">{g.email}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleRemoveGestorEmail(g.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
