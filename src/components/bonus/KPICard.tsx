import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: string | number;
  hint?: string;
  variant?: "default" | "success" | "warning" | "primary";
  className?: string;
}

export function KPICard({ label, value, hint, variant = "default", className }: KPICardProps) {
  const variantStyles = {
    default: "",
    success: "border-l-4 border-l-success",
    warning: "border-l-4 border-l-warning",
    primary: "border-l-4 border-l-primary",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("kpi-card", variantStyles[variant], className)}
    >
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {hint && <div className="kpi-hint">{hint}</div>}
    </motion.div>
  );
}
