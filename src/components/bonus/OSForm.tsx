import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Save, RotateCcw, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBonus } from "@/contexts/BonusContext";
import { CRITERIA, OS_TYPES } from "@/lib/constants";
import { generateId, clampInt, toNum } from "@/lib/numberHelpers";
import { todayISO, monthKeyFromDate } from "@/lib/dateHelpers";
import { calculateOSMetrics } from "@/lib/bonusCalculator";
import { OSRecord } from "@/types/bonus";
import { KPICard } from "./KPICard";
import { toast } from "sonner";
import { osFormSchema, getFirstError } from "@/lib/validations";

interface OSFormProps {
  editingOS?: OSRecord | null;
  onClearEditing?: () => void;
}

export function OSForm({ editingOS, onClearEditing }: OSFormProps) {
  const { db, monthKey, selectedEmployeeId, setSelectedEmployeeId, saveOS, setMonthKey } = useBonus();
  
  const [osId, setOsId] = useState("");
  const [cliente, setCliente] = useState("");
  const [date, setDate] = useState(todayISO());
  const [tipo, setTipo] = useState("manutencao");
  const [dificuldadeId, setDificuldadeId] = useState("media");
  const [duracaoId, setDuracaoId] = useState("1d");
  const [valorOs, setValorOs] = useState("");
  const [setor, setSetor] = useState("");
  const [obs, setObs] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [critValues, setCritValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    CRITERIA.forEach((c) => (initial[c.id] = 0));
    return initial;
  });

  useEffect(() => {
    if (editingOS) {
      setOsId(editingOS.osId || "");
      setCliente(editingOS.cliente || "");
      setDate(editingOS.date || todayISO());
      setTipo(editingOS.tipo || "manutencao");
      setDificuldadeId(editingOS.dificuldadeId || "media");
      setDuracaoId(editingOS.duracaoId || "1d");
      setValorOs(editingOS.valorOs ? String(editingOS.valorOs) : "");
      setSetor(editingOS.setor || "");
      setObs(editingOS.obs || "");
      setSelectedEmployeeId(editingOS.employeeId || "");
      
      const newCrit: Record<string, number> = {};
      CRITERIA.forEach((c) => {
        newCrit[c.id] = editingOS.crit?.[c.id] ?? 0;
      });
      setCritValues(newCrit);
    }
  }, [editingOS, setSelectedEmployeeId]);

  const clearForm = useCallback(() => {
    setOsId("");
    setCliente("");
    setDate(todayISO());
    setTipo("manutencao");
    setDificuldadeId("media");
    setDuracaoId("1d");
    setValorOs("");
    setSetor("");
    setObs("");
    const initial: Record<string, number> = {};
    CRITERIA.forEach((c) => (initial[c.id] = 0));
    setCritValues(initial);
    onClearEditing?.();
  }, [onClearEditing]);

  const liveCalc = useMemo(() => {
    return calculateOSMetrics(critValues, db.cfg, dificuldadeId, duracaoId);
  }, [critValues, dificuldadeId, duracaoId, db.cfg]);

  const validateForm = useCallback((): boolean => {
    const formData = {
      osId: osId.trim(),
      cliente: cliente.trim(),
      date,
      tipo,
      dificuldadeId,
      duracaoId,
      valorOs: valorOs ? toNum(valorOs) : undefined,
      setor: setor.trim() || undefined,
      obs: obs.trim() || undefined,
      employeeId: selectedEmployeeId,
    };

    const error = getFirstError(osFormSchema, formData);
    if (error) {
      toast.error(error);
      return false;
    }
    return true;
  }, [osId, cliente, date, tipo, dificuldadeId, duracaoId, valorOs, setor, obs, selectedEmployeeId]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) return;
    
    const emp = db.employees.find((e) => e.id === selectedEmployeeId)!;
    const { score, ce, ceFinal, ceQ, dur } = liveCalc;
    const mk = monthKeyFromDate(date);
    
    if (mk && mk !== monthKey) {
      setMonthKey(mk);
    }

    const record: OSRecord = {
      id: editingOS?.id || generateId(),
      employeeId: emp.id,
      employeeName: emp.name,
      role: emp.role || "",
      monthKey: mk || monthKey,
      date,
      osId: osId.trim(),
      cliente: cliente.trim(),
      tipo,
      dificuldadeId,
      duracaoId,
      duracaoMult: dur.mult,
      valorOs: toNum(valorOs),
      setor: setor.trim(),
      obs: obs.trim(),
      crit: { ...critValues },
      score,
      ce,
      ceFinal,
      ceQ,
    };

    setIsSaving(true);
    try {
      await saveOS(record);
      clearForm();
    } finally {
      setIsSaving(false);
    }
  }, [
    validateForm, db.employees, selectedEmployeeId, liveCalc, date, monthKey,
    setMonthKey, editingOS, osId, cliente, tipo, dificuldadeId, duracaoId,
    valorOs, setor, obs, critValues, saveOS, clearForm
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter" && !isSaving) {
        handleSave();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, isSaving]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Employee and OS basic info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="osId">Número da OS</Label>
          <Input
            id="osId"
            value={osId}
            onChange={(e) => setOsId(e.target.value)}
            placeholder="Ex.: OS-2026-00123"
            className="input-focus-ring"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cliente">Cliente</Label>
          <Input
            id="cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            placeholder="Ex.: Tecphy"
            className="input-focus-ring"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-focus-ring"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger className="input-focus-ring">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OS_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Dificuldade</Label>
          <Select value={dificuldadeId} onValueChange={setDificuldadeId}>
            <SelectTrigger className="input-focus-ring">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {db.cfg.difficultyWeights.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.label} (CE {d.ce})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Duração</Label>
          <Select value={duracaoId} onValueChange={setDuracaoId}>
            <SelectTrigger className="input-focus-ring">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {db.cfg.durationWeights.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.label} (x{d.mult.toFixed(1)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="valorOs">Valor da OS (opcional)</Label>
          <Input
            id="valorOs"
            type="number"
            min="0"
            step="0.01"
            value={valorOs}
            onChange={(e) => setValorOs(e.target.value)}
            placeholder="Ex.: 3500,00"
            className="input-focus-ring"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="setor">Setor (opcional)</Label>
          <Input
            id="setor"
            value={setor}
            onChange={(e) => setSetor(e.target.value)}
            placeholder="Ex.: Forno / Paletização"
            className="input-focus-ring"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="obs">Observações (opcional)</Label>
        <Textarea
          id="obs"
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          placeholder="Notas rápidas..."
          className="input-focus-ring min-h-[80px]"
        />
      </div>

      {/* Live KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <KPICard
          label="Pontuação"
          value={`${liveCalc.score} / ${liveCalc.maxPts}`}
          hint="Checklist preenchido"
          variant={liveCalc.score >= liveCalc.maxPts * 0.9 ? "success" : liveCalc.score >= liveCalc.maxPts * 0.6 ? "warning" : "default"}
        />
        <KPICard
          label="CE Final"
          value={liveCalc.ceFinal.toFixed(2)}
          hint="CE Base × Duração"
          variant="primary"
        />
        <KPICard
          label="CE Qual."
          value={liveCalc.ceQ.toFixed(2)}
          hint="CE Final × (score/maxPts)"
          variant="primary"
        />
      </div>

      {/* Criteria checklist */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Checklist de Qualidade</Label>
        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2">
          {CRITERIA.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-4 p-3 rounded-lg bg-secondary/30 border border-border/50"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{c.title}</div>
                <div className="text-xs text-muted-foreground truncate">{c.desc}</div>
              </div>
              <Select
                value={String(critValues[c.id])}
                onValueChange={(v) =>
                  setCritValues((prev) => ({ ...prev, [c.id]: clampInt(v, 0, c.max) }))
                }
              >
                <SelectTrigger className="w-24 input-focus-ring">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: c.max + 1 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {i} / {c.max}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap pt-2">
        <Button 
          onClick={handleSave} 
          className="btn-primary-glow gap-2"
          disabled={isSaving}
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Salvando..." : editingOS ? "Atualizar OS" : "Salvar OS"}
        </Button>
        <Button 
          variant="outline" 
          onClick={clearForm} 
          className="gap-2"
          disabled={isSaving}
        >
          <RotateCcw className="w-4 h-4" />
          Limpar
        </Button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto">
          <Keyboard className="w-3.5 h-3.5" />
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-secondary text-xs">Ctrl</kbd> +{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-secondary text-xs">Enter</kbd> para salvar
          </span>
        </div>
      </div>
    </motion.div>
  );
}
