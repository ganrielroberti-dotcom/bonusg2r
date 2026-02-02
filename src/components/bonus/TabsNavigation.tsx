import { FileSpreadsheet, Users, Settings, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { TabType } from "@/types/bonus";
import { motion } from "framer-motion";

interface TabButtonProps {
  tab: TabType;
  activeTab: TabType;
  onClick: (tab: TabType) => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ tab, activeTab, onClick, icon, label }: TabButtonProps) {
  const isActive = tab === activeTab;
  
  return (
    <button
      onClick={() => onClick(tab)}
      className={cn(
        "relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all duration-200",
        "border border-border/50 hover:border-primary/50",
        isActive
          ? "bg-primary/15 border-primary/50 text-primary"
          : "bg-background/50 text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 rounded-full bg-primary/10 border border-primary/30"
          initial={false}
          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
        />
      )}
    </button>
  );
}

interface TabsNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabsNavigation({ activeTab, onTabChange }: TabsNavigationProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      <TabButton
        tab="os"
        activeTab={activeTab}
        onClick={onTabChange}
        icon={<ClipboardList className="w-4 h-4" />}
        label="OS"
      />
      <TabButton
        tab="colaboradores"
        activeTab={activeTab}
        onClick={onTabChange}
        icon={<Users className="w-4 h-4" />}
        label="Colaboradores"
      />
      <TabButton
        tab="config"
        activeTab={activeTab}
        onClick={onTabChange}
        icon={<Settings className="w-4 h-4" />}
        label="Config"
      />
    </div>
  );
}
