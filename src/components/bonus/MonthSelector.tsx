import { useMemo } from "react";
import { Calendar } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBonus } from "@/contexts/BonusContext";

function generateMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  
  // Generate 24 months: 12 past + current + 11 future
  for (let i = -12; i <= 11; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  
  return options;
}

export function MonthSelector() {
  const { monthKey, setMonthKey } = useBonus();
  
  const monthOptions = useMemo(() => generateMonthOptions(), []);
  
  return (
    <div className="flex items-center gap-3">
      <Label className="flex items-center gap-1.5 text-muted-foreground whitespace-nowrap">
        <Calendar className="w-4 h-4" />
        Mês de referência
      </Label>
      <Select value={monthKey} onValueChange={setMonthKey}>
        <SelectTrigger className="w-[200px] input-focus-ring">
          <SelectValue placeholder="Selecione o mês" />
        </SelectTrigger>
        <SelectContent>
          {monthOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
