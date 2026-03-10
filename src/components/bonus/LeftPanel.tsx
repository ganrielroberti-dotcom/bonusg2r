import { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Calendar, User, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBonus } from "@/contexts/BonusContext";
import { useAuth } from "@/contexts/AuthContext";
import { TabsNavigation } from "./TabsNavigation";
import { OSRecord } from "@/types/bonus";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TabErrorFallback } from "./TabErrorFallback";
import { TabSkeleton } from "./TabSkeleton";

// Lazy load heavy tab components
const OSForm = lazy(() => import("./OSForm").then(m => ({ default: m.OSForm })));
const EmployeesTab = lazy(() => import("./EmployeesTab").then(m => ({ default: m.EmployeesTab })));
const ConfigTab = lazy(() => import("./ConfigTab").then(m => ({ default: m.ConfigTab })));


interface LeftPanelProps {
  editingOS: OSRecord | null;
  onClearEditing: () => void;
}

export function LeftPanel({ editingOS, onClearEditing }: LeftPanelProps) {
  const {
    db,
    monthKey,
    setMonthKey,
    selectedEmployeeId,
    setSelectedEmployeeId,
    activeTab,
    setActiveTab,
  } = useBonus();

  const { user, role, isGestor, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <motion.section
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card rounded-xl p-4 space-y-4"
    >
      {/* User info */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <Badge variant={isGestor ? "default" : "secondary"} className="text-xs">
              {role === "gestor" ? "Gestor" : role === "colaborador" ? "Colaborador" : "Sem papel"}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      {/* Top bar with tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsNavigation activeTab={activeTab} onTabChange={setActiveTab} isGestor={isGestor} />
      </div>

      {/* Month and Employee selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Mês
          </Label>
          <Input
            type="month"
            value={monthKey}
            onChange={(e) => setMonthKey(e.target.value)}
            className="input-focus-ring"
          />
        </div>
        {isGestor && (
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Colaborador
            </Label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger className="input-focus-ring">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {db.employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="h-px bg-border" />

      {/* Tab content with lazy loading and error boundaries */}
      {activeTab === "os" && isGestor && (
        <ErrorBoundary fallback={<TabErrorFallback tabName="Formulário OS" onRetry={() => window.location.reload()} />}>
          <Suspense fallback={<TabSkeleton variant="form" />}>
            <OSForm editingOS={editingOS} onClearEditing={onClearEditing} />
          </Suspense>
        </ErrorBoundary>
      )}
      {activeTab === "os" && !isGestor && (
        <div className="text-center py-8 text-muted-foreground">
          Visualização de OS apenas. Use a área à direita para ver suas OS.
        </div>
      )}
      {activeTab === "colaboradores" && (
        <ErrorBoundary fallback={<TabErrorFallback tabName="Colaboradores" onRetry={() => window.location.reload()} />}>
          <Suspense fallback={<TabSkeleton variant="list" />}>
            <EmployeesTab />
          </Suspense>
        </ErrorBoundary>
      )}
      {activeTab === "horasAuvo" && (
        <ErrorBoundary fallback={<TabErrorFallback tabName="Horas Auvo" onRetry={() => window.location.reload()} />}>
          <Suspense fallback={<TabSkeleton variant="report" />}>
            <AuvoHoursReport />
          </Suspense>
        </ErrorBoundary>
      )}
      {activeTab === "config" && (
        <ErrorBoundary fallback={<TabErrorFallback tabName="Configurações" onRetry={() => window.location.reload()} />}>
          <Suspense fallback={<TabSkeleton variant="config" />}>
            <ConfigTab />
          </Suspense>
        </ErrorBoundary>
      )}
    </motion.section>
  );
}
