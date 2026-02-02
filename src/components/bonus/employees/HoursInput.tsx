import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";

interface HoursInputProps {
  employeeId: string;
  initialHours: number;
  onSave: (empId: string, horas: number) => Promise<void>;
}

/**
 * Debounced hours input - only saves to database after user stops typing
 */
export function HoursInput({ employeeId, initialHours, onSave }: HoursInputProps) {
  const [localValue, setLocalValue] = useState<string>(initialHours ? String(initialHours) : "");
  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedValue = useRef<number>(initialHours);

  // Sync with external changes only if significantly different
  useEffect(() => {
    if (initialHours !== lastSavedValue.current) {
      setLocalValue(initialHours ? String(initialHours) : "");
      lastSavedValue.current = initialHours;
    }
  }, [initialHours]);

  const debouncedSave = useCallback(
    (value: number) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        if (value !== lastSavedValue.current) {
          setIsSaving(true);
          try {
            await onSave(employeeId, value);
            lastSavedValue.current = value;
          } finally {
            setIsSaving(false);
          }
        }
      }, 800); // Wait 800ms after user stops typing
    },
    [employeeId, onSave]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    const numValue = Number(newValue) || 0;
    debouncedSave(numValue);
  };

  const handleBlur = useCallback(async () => {
    // Save immediately on blur
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    const numValue = Number(localValue) || 0;
    if (numValue !== lastSavedValue.current) {
      setIsSaving(true);
      try {
        await onSave(employeeId, numValue);
        lastSavedValue.current = numValue;
      } finally {
        setIsSaving(false);
      }
    }
  }, [employeeId, localValue, onSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Input
      type="number"
      min="0"
      step="1"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="0"
      className={`w-20 input-focus-ring ${isSaving ? "opacity-70" : ""}`}
      disabled={isSaving}
    />
  );
}
