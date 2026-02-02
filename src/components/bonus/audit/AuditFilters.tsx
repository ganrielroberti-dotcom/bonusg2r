import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, Search, Calendar, RefreshCw, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AuditLogFilters, TABLE_LABELS, ACTION_CONFIG } from "./types";

interface AuditFiltersProps {
  filters: AuditLogFilters;
  onFiltersChange: (filters: AuditLogFilters) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  activeFiltersCount: number;
}

export function AuditFilters({ 
  filters, 
  onFiltersChange, 
  onRefresh, 
  isRefreshing,
  activeFiltersCount 
}: AuditFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClearFilters = () => {
    onFiltersChange({
      tableName: undefined,
      action: undefined,
      startDate: undefined,
      endDate: undefined,
      searchTerm: undefined,
      limit: 50,
    });
  };

  const updateFilter = <K extends keyof AuditLogFilters>(key: K, value: AuditLogFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value === "all" ? undefined : value });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="glass-card rounded-xl border border-border/40 overflow-hidden"
    >
      {/* Main filter bar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 sm:p-4">
        {/* Search input */}
        <div className="relative flex-1 min-w-[180px] sm:min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={filters.searchTerm || ""}
            onChange={(e) => updateFilter("searchTerm", e.target.value || undefined)}
            className="pl-9 h-9 text-sm bg-secondary/30 border-border/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
          />
        </div>

        {/* Quick table filter */}
        <Select 
          value={filters.tableName || "all"} 
          onValueChange={(v) => updateFilter("tableName", v)}
        >
          <SelectTrigger className="w-[140px] sm:w-[160px] h-9 text-xs sm:text-sm bg-secondary/30 border-border/40">
            <SelectValue placeholder="Tabela" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas tabelas</SelectItem>
            {Object.entries(TABLE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Action filter */}
        <Select 
          value={filters.action || "all"} 
          onValueChange={(v) => updateFilter("action", v)}
        >
          <SelectTrigger className="w-[120px] sm:w-[140px] h-9 text-xs sm:text-sm bg-secondary/30 border-border/40">
            <SelectValue placeholder="Ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas ações</SelectItem>
            {Object.entries(ACTION_CONFIG).map(([value, config]) => (
              <SelectItem key={value} value={value}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced filters toggle */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-9 gap-1.5 text-xs bg-secondary/30 border-border/40 hover:bg-secondary/50"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Avançado</span>
          {activeFiltersCount > 0 && (
            <Badge className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
              {activeFiltersCount}
            </Badge>
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.div>
        </Button>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {activeFiltersCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearFilters}
              className="h-9 gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpar</span>
            </Button>
          )}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-9 gap-1.5 text-xs bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Advanced filters panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/30 p-3 sm:p-4 bg-secondary/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Date range */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] sm:text-xs flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    Data Inicial
                  </Label>
                  <Input
                    type="date"
                    value={filters.startDate || ""}
                    onChange={(e) => updateFilter("startDate", e.target.value || undefined)}
                    className="h-9 text-sm bg-secondary/30 border-border/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] sm:text-xs flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    Data Final
                  </Label>
                  <Input
                    type="date"
                    value={filters.endDate || ""}
                    onChange={(e) => updateFilter("endDate", e.target.value || undefined)}
                    className="h-9 text-sm bg-secondary/30 border-border/40"
                  />
                </div>

                {/* Limit */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] sm:text-xs text-muted-foreground">Limite de registros</Label>
                  <Select 
                    value={String(filters.limit || 50)} 
                    onValueChange={(v) => updateFilter("limit", Number(v))}
                  >
                    <SelectTrigger className="h-9 text-sm bg-secondary/30 border-border/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 registros</SelectItem>
                      <SelectItem value="50">50 registros</SelectItem>
                      <SelectItem value="100">100 registros</SelectItem>
                      <SelectItem value="200">200 registros</SelectItem>
                      <SelectItem value="500">500 registros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
