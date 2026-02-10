import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, RefreshCw, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuvoMappings, useAuvoUsers } from "@/hooks/useAuvoIntegration";
import { useBonus } from "@/contexts/BonusContext";

export function AuvoUserMapping() {
  const { db } = useBonus();
  const { mappings, isLoading: loadingMappings, fetchMappings, addMapping, removeMapping } = useAuvoMappings();
  const { users: auvoUsers, isLoading: loadingUsers, fetchUsers } = useAuvoUsers();

  const [selectedAuvoUser, setSelectedAuvoUser] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);

  const mappedEmployeeIds = new Set(mappings.map((m) => m.employee_id));
  const mappedAuvoIds = new Set(mappings.map((m) => m.auvo_user_id));

  const availableEmployees = db.employees.filter((e) => !mappedEmployeeIds.has(e.id));
  const availableAuvoUsers = auvoUsers.filter((u) => !mappedAuvoIds.has(u.userID));

  const handleAdd = async () => {
    if (!selectedAuvoUser || !selectedEmployee) return;
    const auvoUser = auvoUsers.find((u) => String(u.userID) === selectedAuvoUser);
    if (!auvoUser) return;

    setIsSaving(true);
    await addMapping(auvoUser.userID, auvoUser.name, selectedEmployee);
    setSelectedAuvoUser("");
    setSelectedEmployee("");
    setIsSaving(false);
  };

  const handleLoadAuvoUsers = () => {
    fetchUsers();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Link className="w-4 h-4" />
          Mapeamento Auvo ↔ Colaboradores
        </h3>
        <Button variant="outline" size="sm" onClick={handleLoadAuvoUsers} disabled={loadingUsers}>
          {loadingUsers ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          <span className="ml-1.5">Carregar Auvo</span>
        </Button>
      </div>

      {/* Add new mapping */}
      {auvoUsers.length > 0 && (
        <div className="flex gap-2 items-end flex-wrap">
          <div className="flex-1 min-w-[180px] space-y-1">
            <label className="text-xs text-muted-foreground">Usuário Auvo</label>
            <Select value={selectedAuvoUser} onValueChange={setSelectedAuvoUser}>
              <SelectTrigger className="input-focus-ring">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {availableAuvoUsers.map((u) => (
                  <SelectItem key={u.userID} value={String(u.userID)}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[180px] space-y-1">
            <label className="text-xs text-muted-foreground">Colaborador</label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="input-focus-ring">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {availableEmployees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} disabled={!selectedAuvoUser || !selectedEmployee || isSaving} size="sm">
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span className="ml-1">Vincular</span>
          </Button>
        </div>
      )}

      {/* Existing mappings */}
      {loadingMappings ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : mappings.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum mapeamento configurado. Clique em "Carregar Auvo" para buscar os usuários.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário Auvo</TableHead>
              <TableHead>Colaborador</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappings.map((m) => {
              const emp = db.employees.find((e) => e.id === m.employee_id);
              return (
                <TableRow key={m.id}>
                  <TableCell className="text-sm">{m.auvo_user_name} (ID: {m.auvo_user_id})</TableCell>
                  <TableCell className="text-sm">{emp?.name || m.employee_id}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeMapping(m.id)} className="h-8 w-8">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
