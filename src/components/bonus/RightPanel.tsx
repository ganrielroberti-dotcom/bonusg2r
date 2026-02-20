import { motion } from "framer-motion";
import { DashboardKPIs } from "./DashboardKPIs";
import { OSList } from "./OSList";
import { OSRecord } from "@/types/bonus";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TabErrorFallback } from "./TabErrorFallback";

interface RightPanelProps {
  onEditOS: (os: OSRecord) => void;
}

export function RightPanel({ onEditOS }: RightPanelProps) {
  return (
    <motion.section
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="space-y-4"
    >
      <ErrorBoundary fallback={<TabErrorFallback tabName="Dashboard KPIs" onRetry={() => window.location.reload()} />}>
        <DashboardKPIs />
      </ErrorBoundary>
      
      <div className="glass-card rounded-xl p-4">
        <ErrorBoundary fallback={<TabErrorFallback tabName="Lista de OS" onRetry={() => window.location.reload()} />}>
          <OSList onEdit={onEditOS} />
        </ErrorBoundary>
      </div>
    </motion.section>
  );
}
