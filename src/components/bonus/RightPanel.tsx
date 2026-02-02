import { motion } from "framer-motion";
import { DashboardKPIs } from "./DashboardKPIs";
import { OSList } from "./OSList";
import { OSRecord } from "@/types/bonus";

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
      <DashboardKPIs />
      
      <div className="glass-card rounded-xl p-4">
        <OSList onEdit={onEditOS} />
      </div>
    </motion.section>
  );
}
