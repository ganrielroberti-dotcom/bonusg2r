import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";

interface HoursInputProps {
  employeeId: string;
  initialHours: number;
  onSave: (empId: string, horas: number) => Promise<void>;
}

/**
 * Debounced hours input - only saves to database after user stops typing
 * Uses local state to prevent screen updates during input
 */
export function HoursInput({ employeeId, initialHours, onSave }: HoursInputProps) {
  const [localValue, setLocalValue] = useState<string>(initialHours ? String(initialHours) : "");
  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedValue = useRef<number>(initialHours);
  const isUserTyping = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);

  // Track when component mounts/unmounts
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Only sync with external changes if:
  // 1. User is NOT currently typing
  // 2. The value is actually different from what we last saved
  useEffect(() => {
    if (!isUserTyping.current && initialHours !== lastSavedValue.current) {
      setLocalValue(initialHours ? String(initialHours) : "");
      lastSavedValue.current = initialHours;
    }
  }, [initialHours]);

  const saveValue = useCallback(async (value: number) => {
    if (!mountedRef.current) return;
    
    setIsSaving(true);
    isUserTyping.current = false;
    
    try {
      await onSave(employeeId, value);
      lastSavedValue.current = value;
    } catch (error) {
      // If save fails, revert to last saved value
      if (mountedRef.current) {
        setLocalValue(lastSavedValue.current ? String(lastSavedValue.current) : "");
      }
    } finally {
      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [employeeId, onSave]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    isUserTyping.current = true;
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const numValue = Number(newValue) || 0;
    
    // Only save if value is different from last saved
    if (numValue !== lastSavedValue.current) {
      timeoutRef.current = setTimeout(() => {
        saveValue(numValue);
      }, 1000); // Wait 1 second after user stops typing
    }
  }, [saveValue]);

  const handleBlur = useCallback(() => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    const numValue = Number(localValue) || 0;
    
    // Save immediately on blur if value changed
    if (numValue !== lastSavedValue.current) {
      saveValue(numValue);
    } else {
      isUserTyping.current = false;
    }
  }, [localValue, saveValue]);

  const handleFocus = useCallback(() => {
    isUserTyping.current = true;
  }, []);

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
      onFocus={handleFocus}
      placeholder="0"
      className={`w-20 input-focus-ring ${isSaving ? "opacity-70" : ""}`}
    />
  );
}
