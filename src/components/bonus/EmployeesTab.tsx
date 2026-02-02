import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useBonus } from "@/contexts/BonusContext";
import { getHorasTrabalhadas } from "@/lib/database";

export function EmployeesTab() {
  const { db, monthKey, addEmployee, removeEmployee, setHorasTrabalhadas } = useBonus();
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) {
      alert("Informe o nome do colaborador");
      return;
    }
    addEmployee(newName.trim(), newRole.trim());
    setNewName("");
    setNewRole("");
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Excluir colaborador "${name}"?`)) {
      removeEmployee(id);
    }
  };

  const handleDeleteAll = () => {
    if (confirm("Apagar TODOS os colaboradores?")) {
      db.employees.forEach((e) => removeEmployee(e.id));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Add new employee */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      </div>

      <div className="flex gap-3 flex-wrap">
        <Button onClick={handleAdd} className="btn-primary-glow gap-2">
          <UserPlus className="w-4 h-4" />
          Adicionar
        </Button>
        <Button variant="destructive" onClick={handleDeleteAll} className="gap-2">
          <Trash2 className="w-4 h-4" />
          Excluir todos
        </Button>
      </div>

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
              const horas = getHorasTrabalhadas(db, monthKey, emp.id);
              return (
                <motion.div
                  key={emp.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg bg-secondary/30 border border-border/50"
                >
                  <div className="flex items-center gap-3 flex-wrap min-w-0">
                    <Badge variant="secondary" className="font-bold">
                      {emp.name}
                    </Badge>
                    {emp.role && (
                      <span className="text-xs text-muted-foreground">{emp.role}</span>
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
    </motion.div>
  );
}
