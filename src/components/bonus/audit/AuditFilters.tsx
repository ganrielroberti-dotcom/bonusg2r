import { useState } from "react";
import { motion } from "framer-motion";
import { Filter, Search, Calendar, RefreshCw, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden"
    >
      {/* Main filter bar */}
      <div className="flex flex-wrap items-center gap-3 p-4">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por email, ID ou conteúdo..."
            value={filters.searchTerm || ""}
            onChange={(e) => updateFilter("searchTerm", e.target.value || undefined)}
            className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
          />
        </div>

        {/* Quick table filter */}
        <Select 
          value={filters.tableName || "all"} 
          onValueChange={(v) => updateFilter("tableName", v)}
        >
          <SelectTrigger className="w-[180px] bg-background/50 border-border/50">
            <SelectValue placeholder="Todas as tabelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as tabelas</SelectItem>
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
          <SelectTrigger className="w-[150px] bg-background/50 border-border/50">
            <SelectValue placeholder="Todas as ações" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            {Object.entries(ACTION_CONFIG).map(([value, config]) => (
              <SelectItem key={value} value={value}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced filters toggle */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Avançado
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </CollapsibleTrigger>
        </Collapsible>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {activeFiltersCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearFilters}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
              Limpar
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Advanced filters panel */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-t border-border/50 p-4 bg-background/30"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Date range */}
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Data Inicial
                </Label>
                <Input
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) => updateFilter("startDate", e.target.value || undefined)}
                  className="bg-background/50 border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Data Final
                </Label>
                <Input
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) => updateFilter("endDate", e.target.value || undefined)}
                  className="bg-background/50 border-border/50"
                />
              </div>

              {/* Limit */}
              <div className="space-y-2">
                <Label className="text-xs">Limite de registros</Label>
                <Select 
                  value={String(filters.limit || 50)} 
                  onValueChange={(v) => updateFilter("limit", Number(v))}
                >
                  <SelectTrigger className="bg-background/50 border-border/50">
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
          </motion.div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}
