import { useState, useEffect } from "react";
import { UserPlus, Trash2, Shield, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GestorEmail {
  id: string;
  email: string;
}

export function GestorEmailsConfig() {
  const [gestorEmails, setGestorEmails] = useState<GestorEmail[]>([]);
  const [newGestorEmail, setNewGestorEmail] = useState("");
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);

  useEffect(() => {
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
  }, []);

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

  return (
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
  );
}
