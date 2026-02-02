import { motion } from "framer-motion";
import { Settings, Clock, Gauge, Shield, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBonus } from "@/contexts/BonusContext";
import { useAuth } from "@/contexts/AuthContext";
import { GeneralConfig } from "./config/GeneralConfig";
import { DifficultyConfig } from "./config/DifficultyConfig";
import { DurationConfig } from "./config/DurationConfig";
import { GestorEmailsConfig } from "./config/GestorEmailsConfig";
import { AuditLogViewer } from "./audit/AuditLogViewer";
import { DifficultyWeight, DurationWeight } from "@/types/bonus";

export function ConfigTab() {
  const { db, updateConfig } = useBonus();
  const { isGestor } = useAuth();

  const handleSaveDifficulty = async (weights: DifficultyWeight[]) => {
    await updateConfig({ difficultyWeights: weights });
  };

  const handleSaveDuration = async (weights: DurationWeight[]) => {
    await updateConfig({ durationWeights: weights });
  };

  if (!isGestor) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Apenas gestores podem alterar configurações.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="general" className="flex items-center gap-1.5 text-xs py-2">
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="difficulty" className="flex items-center gap-1.5 text-xs py-2">
            <Gauge className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dificuldade</span>
          </TabsTrigger>
          <TabsTrigger value="duration" className="flex items-center gap-1.5 text-xs py-2">
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Duração</span>
          </TabsTrigger>
          <TabsTrigger value="access" className="flex items-center gap-1.5 text-xs py-2">
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Acesso</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-1.5 text-xs py-2">
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Auditoria</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <GeneralConfig 
            config={db.cfg} 
            onSave={updateConfig} 
          />
        </TabsContent>

        <TabsContent value="difficulty" className="mt-4">
          <DifficultyConfig
            difficultyWeights={db.cfg.difficultyWeights}
            onSave={handleSaveDifficulty}
          />
        </TabsContent>

        <TabsContent value="duration" className="mt-4">
          <DurationConfig
            durationWeights={db.cfg.durationWeights}
            onSave={handleSaveDuration}
          />
        </TabsContent>

        <TabsContent value="access" className="mt-4">
          <GestorEmailsConfig />
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <AuditLogViewer />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
