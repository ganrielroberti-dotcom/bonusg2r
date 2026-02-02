import { useState } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";
import { OSRecord } from "@/types/bonus";

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
        <div>
          <h1 className="flex items-center gap-2 text-lg sm:text-xl font-black tracking-tight">
            <Zap className="w-5 h-5 text-primary" />
            <span>G2R</span>
            <span className="text-muted-foreground font-normal">•</span>
            <span className="gradient-text-primary">Bonificação</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Registre OS, avalie qualidade e gere a auditoria do bônus por colaborador.
          </p>
        </div>
        <div className="text-xs text-muted-foreground/70 tracking-wide">
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
