import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value?: string; // ISO format YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ value, onChange, placeholder = "Selecione uma data", className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  // Convert ISO string to Date object
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    const date = new Date(value + "T00:00:00");
    return isValid(date) ? date : undefined;
  }, [value]);

  // Update input value when value prop changes
  React.useEffect(() => {
    if (selectedDate) {
      setInputValue(format(selectedDate, "dd/MM/yyyy"));
    } else {
      setInputValue("");
    }
  }, [selectedDate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    // Try to parse the date in DD/MM/YYYY format
    if (val.length === 10) {
      const parsed = parse(val, "dd/MM/yyyy", new Date());
      if (isValid(parsed)) {
        const iso = format(parsed, "yyyy-MM-dd");
        onChange(iso);
      }
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      const iso = format(date, "yyyy-MM-dd");
      onChange(iso);
      setOpen(false);
    }
  };

  return (
    <div className={cn("relative flex gap-1", className)}>
      <Input
        value={inputValue}
        onChange={handleInputChange}
        placeholder="DD/MM/AAAA"
        className="input-focus-ring flex-1"
        maxLength={10}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "shrink-0",
              !value && "text-muted-foreground"
            )}
            type="button"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleCalendarSelect}
            initialFocus
            locale={ptBR}
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
