import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Trash2, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useBonus } from "@/contexts/BonusContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function EmployeesTab() {
  const { db, monthKey, addEmployee, removeEmployee, setHorasTrabalhadas } = useBonus();
  const { isGestor } = useAuth();
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const getHoras = (empId: string) => {
    return db.horasTrabalhadas[monthKey]?.[empId] || 0;
  };

  const handleAdd = async () => {
    if (!newName.trim()) {
      toast.error("Informe o nome do colaborador");
      return;
    }
    if (!newEmail.trim()) {
      toast.error("Informe o email do colaborador");
      return;
    }
    try {
      await addEmployee(newName.trim(), newRole.trim(), newEmail.trim().toLowerCase());
      setNewName("");
      setNewRole("");
      setNewEmail("");
      toast.success("Colaborador adicionado!");
    } catch (error: any) {
      if (error.message?.includes("duplicate key")) {
        toast.error("Já existe um colaborador com este email");
      } else {
        toast.error("Erro ao adicionar colaborador");
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Excluir colaborador "${name}"?`)) {
      try {
        await removeEmployee(id);
        toast.success("Colaborador removido");
      } catch {
        toast.error("Erro ao remover colaborador");
      }
    }
  };

  if (!isGestor) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Apenas gestores podem gerenciar colaboradores.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Add new employee */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="newEmpName">Nome</Label>
          <Input
            id="newEmpName"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ex.: João da Silva"
            className="input-focus-ring"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="newEmpRole">Função</Label>
          <Input
            id="newEmpRole"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            placeholder="Ex.: Eletricista"
            className="input-focus-ring"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="newEmpEmail" className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            Email
          </Label>
          <Input
            id="newEmpEmail"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email@empresa.com"
            className="input-focus-ring"
          />
        </div>
      </div>

      <Button onClick={handleAdd} className="btn-primary-glow gap-2">
        <UserPlus className="w-4 h-4" />
        Adicionar Colaborador
      </Button>

      <div className="h-px bg-border" />

      {/* Employees list with hours */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Clock className="w-4 h-4" />
          Horas Trabalhadas no Mês ({monthKey})
        </div>

        {db.employees.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            Nenhum colaborador cadastrado.
          </div>
        ) : (
          <div className="space-y-2">
            {db.employees.map((emp) => {
              const horas = getHoras(emp.id);
              return (
                <motion.div
                  key={emp.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg bg-secondary/30 border border-border/50"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="secondary" className="font-bold">
                        {emp.name}
                      </Badge>
                      {emp.role && (
                        <span className="text-xs text-muted-foreground">{emp.role}</span>
                      )}
                    </div>
                    {"email" in emp && (
                      <span className="text-xs text-muted-foreground/70">{(emp as any).email}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Horas:</span>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={horas || ""}
                        onChange={(e) =>
                          setHorasTrabalhadas(emp.id, Number(e.target.value) || 0)
                        }
                        placeholder="0"
                        className="w-20 input-focus-ring"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(emp.id, emp.name)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        <strong>Importante:</strong> O email do colaborador será usado para login. 
        Quando o colaborador se cadastrar com o mesmo email, ele terá acesso apenas às suas próprias OS.
      </p>
    </motion.div>
  );
}
