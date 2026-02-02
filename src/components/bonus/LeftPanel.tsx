import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBonus } from "@/contexts/BonusContext";
import { TabsNavigation } from "./TabsNavigation";
import { OSForm } from "./OSForm";
import { EmployeesTab } from "./EmployeesTab";
import { ConfigTab } from "./ConfigTab";
import { OSRecord } from "@/types/bonus";

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

  return (
    <motion.section
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card rounded-xl p-4 space-y-4"
    >
      {/* Top bar with tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Month and Employee selectors (always visible) */}
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
      </div>

      <div className="h-px bg-border" />

      {/* Tab content */}
      {activeTab === "os" && (
        <OSForm editingOS={editingOS} onClearEditing={onClearEditing} />
      )}
      {activeTab === "colaboradores" && <EmployeesTab />}
      {activeTab === "config" && <ConfigTab />}
    </motion.section>
  );
}
