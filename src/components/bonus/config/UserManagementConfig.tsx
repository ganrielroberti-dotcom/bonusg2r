import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, KeyRound, ShieldCheck, ShieldOff, Users, CheckCircle2, XCircle, Clock } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";

interface EmployeeAccount {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeRole: string;
  hasAccount: boolean;
  authUserId: string | null;
  lastSignIn: string | null;
  createdAt: string | null;
  isBanned: boolean;
  bannedUntil: string | null;
  emailConfirmed: boolean;
}

export function UserManagementConfig() {
  const [accounts, setAccounts] = useState<EmployeeAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: "ban" | "unban" | "reset"; account: EmployeeAccount } | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "list" },
      });

      if (error) throw error;
      setAccounts(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar contas: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleAction = async (action: string, account: EmployeeAccount) => {
    setActionLoading(account.employeeId + action);
    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: {
          action,
          userId: account.authUserId,
          email: account.employeeEmail,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const messages: Record<string, string> = {
        "reset-password": `Link de reset enviado para ${account.employeeEmail}`,
        ban: `Acesso de ${account.employeeName} desativado`,
        unban: `Acesso de ${account.employeeName} reativado`,
      };

      toast.success(messages[action] || "Ação realizada com sucesso");
      await fetchAccounts();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Nunca";
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const withAccount = accounts.filter((a) => a.hasAccount);
  const withoutAccount = accounts.filter((a) => !a.hasAccount);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Gerenciar Logins</h3>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAccounts} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="glass-card">
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold text-primary">{accounts.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold text-green-400">{withAccount.length}</p>
                <p className="text-xs text-muted-foreground">Com conta</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold text-yellow-400">{withoutAccount.length}</p>
                <p className="text-xs text-muted-foreground">Sem conta</p>
              </CardContent>
            </Card>
          </div>

          {/* Accounts list */}
          <div className="space-y-2">
            {accounts.map((account) => (
              <Card key={account.employeeId} className="glass-card">
                <CardContent className="p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{account.employeeName}</span>
                        <Badge variant="outline" className="text-[10px]">{account.employeeRole}</Badge>
                        {account.hasAccount ? (
                          account.isBanned ? (
                            <Badge variant="destructive" className="text-[10px]">Bloqueado</Badge>
                          ) : (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">Ativo</Badge>
                          )
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Sem conta</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{account.employeeEmail}</p>
                      {account.hasAccount && (
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Último login: {formatDate(account.lastSignIn)}
                          </span>
                          {account.emailConfirmed ? (
                            <span className="flex items-center gap-1 text-green-400">
                              <CheckCircle2 className="w-3 h-3" /> Email confirmado
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-yellow-400">
                              <XCircle className="w-3 h-3" /> Email pendente
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {account.hasAccount && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          disabled={actionLoading === account.employeeId + "reset-password"}
                          onClick={() => setConfirmAction({ type: "reset", account })}
                        >
                          {actionLoading === account.employeeId + "reset-password" ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <KeyRound className="w-3 h-3" />
                          )}
                          Reset
                        </Button>

                        {account.isBanned ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1 border-green-500/30 text-green-400 hover:bg-green-500/10"
                            disabled={actionLoading === account.employeeId + "unban"}
                            onClick={() => setConfirmAction({ type: "unban", account })}
                          >
                            {actionLoading === account.employeeId + "unban" ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <ShieldCheck className="w-3 h-3" />
                            )}
                            Ativar
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                            disabled={actionLoading === account.employeeId + "ban"}
                            onClick={() => setConfirmAction({ type: "ban", account })}
                          >
                            {actionLoading === account.employeeId + "ban" ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <ShieldOff className="w-3 h-3" />
                            )}
                            Bloquear
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Confirmation dialog */}
      {confirmAction && (
        <ConfirmDeleteDialog
          open={!!confirmAction}
          onOpenChange={(open) => !open && setConfirmAction(null)}
          onConfirm={() => handleAction(
            confirmAction.type === "reset" ? "reset-password" : confirmAction.type,
            confirmAction.account
          )}
          title={
            confirmAction.type === "reset"
              ? "Resetar senha"
              : confirmAction.type === "ban"
              ? "Bloquear acesso"
              : "Reativar acesso"
          }
          description={
            confirmAction.type === "reset"
              ? `Enviar link de reset de senha para ${confirmAction.account.employeeEmail}?`
              : confirmAction.type === "ban"
              ? `Deseja bloquear o acesso de ${confirmAction.account.employeeName}? Ele não poderá mais fazer login.`
              : `Deseja reativar o acesso de ${confirmAction.account.employeeName}?`
          }
        />
      )}
    </div>
  );
}
