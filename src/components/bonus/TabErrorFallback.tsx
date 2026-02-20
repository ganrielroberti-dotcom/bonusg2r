import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TabErrorFallbackProps {
  tabName: string;
  onRetry?: () => void;
}

export function TabErrorFallback({ tabName, onRetry }: TabErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-destructive" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Erro ao carregar {tabName}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Ocorreu um erro inesperado. Tente novamente.
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
