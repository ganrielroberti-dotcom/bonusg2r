import { useState } from "react";
import { motion } from "framer-motion";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";
import { OSRecord } from "@/types/bonus";
import logoG2R from "@/assets/logo-g2r-white.png";

export function BonusApp() {
  const [editingOS, setEditingOS] = useState<OSRecord | null>(null);

  const handleEditOS = (os: OSRecord) => {
    setEditingOS(os);
    // Scroll to top on mobile
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearEditing = () => {
    setEditingOS(null);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1500px] mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-end justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <img 
            src={logoG2R} 
            alt="G2R Engenharia Elétrica" 
            className="h-8 sm:h-10 w-auto"
          />
          <div className="h-6 w-px bg-border/50 hidden sm:block" />
          <div className="hidden sm:block">
            <span className="text-sm font-semibold text-primary">Bonificação</span>
            <p className="text-xs text-muted-foreground">
              Gestão de OS e bônus
            </p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground/70 tracking-wide hidden sm:block">
          Dev. Gabriel Roberti
        </div>
      </motion.header>

      {/* Main content */}
      <main className="max-w-[1500px] mx-auto px-4 sm:px-6 pb-8">
        <div className="grid grid-cols-1 xl:grid-cols-[480px_1fr] gap-5">
          <LeftPanel editingOS={editingOS} onClearEditing={handleClearEditing} />
          <RightPanel onEditOS={handleEditOS} />
        </div>
      </main>
    </div>
  );
}
