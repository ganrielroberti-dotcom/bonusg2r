import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Trash2, Clock, Mail } from "lucide-react";
import { HoursImportDialog } from "./employees/HoursImportDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useBonus } from "@/contexts/BonusContext";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { HoursInput } from "./employees/HoursInput";
import { toast } from "sonner";
import { employeeFormSchema, getFirstError } from "@/lib/validations";

export function EmployeesTab() {
  const { db, monthKey, addEmployee, removeEmployee, setHorasTrabalhadas, isLoading } = useBonus();
  const { isGestor } = useAuth();
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getHoras = (empId: string) => {
    return db.horasTrabalhadas[monthKey]?.[empId] || 0;
  };

  const handleAdd = async () => {
    // Validate with Zod
    const formData = {
      name: newName.trim(),
      role: newRole.trim() || undefined,
      email: newEmail.trim().toLowerCase(),
    };

    const error = getFirstError(employeeFormSchema, formData);
    if (error) {
      toast.error(error);
      return;
    }
    
    setIsAdding(true);
    try {
      await addEmployee(formData.name, formData.role || "", formData.email);
      setNewName("");
      setNewRole("");
      setNewEmail("");
    } catch (error: any) {
      // Error is already handled by the hook with toast
    } finally {
      setIsAdding(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    
    setIsDeleting(true);
    try {
      await removeEmployee(deleteTarget.id);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (!isGestor) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Apenas gestores podem gerenciar colaboradores.
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSkeleton variant="list" count={5} />;
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

      <Button 
        onClick={handleAdd} 
        className="btn-primary-glow gap-2"
        disabled={isAdding}
      >
        <UserPlus className="w-4 h-4" />
        {isAdding ? "Adicionando..." : "Adicionar Colaborador"}
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
                      <span className="text-xs text-muted-foreground/70">{(emp as Record<string, unknown>).email as string}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Horas:</span>
                      <HoursInput
                        employeeId={emp.id}
                        initialHours={horas}
                        onSave={setHorasTrabalhadas}
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTarget({ id: emp.id, name: emp.name })}
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={`Excluir colaborador "${deleteTarget?.name || ""}"?`}
        description="Esta ação não pode ser desfeita. Todas as OS associadas a este colaborador serão mantidas, mas o colaborador não poderá mais acessar o sistema."
        isLoading={isDeleting}
      />
    </motion.div>
  );
}
