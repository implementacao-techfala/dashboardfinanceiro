import React, { useState, useMemo } from 'react';
import { 
  Check, 
  X, 
  AlertTriangle,
  Link2,
  ArrowLeft,
  ChevronDown
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { cn } from '@/lib/utils';

export interface ColumnMappingItem {
  sourceColumn: string;
  targetKey: string | null;
  targetLabel: string | null;
  confidence: number;
  isRequired: boolean;
}

export interface TargetColumn {
  key: string;
  label: string;
  required: boolean;
  description?: string;
  type?: string;
}

interface SmartColumnMapperProps {
  sheetName: string;
  sourceColumns: string[];
  targetColumns: TargetColumn[];
  suggestedMappings: ColumnMappingItem[];
  sampleData?: Record<string, any>[];
  onConfirm: (mappings: ColumnMappingItem[]) => void;
  onCancel: () => void;
}

const SmartColumnMapper: React.FC<SmartColumnMapperProps> = ({
  sheetName,
  sourceColumns,
  targetColumns,
  suggestedMappings,
  sampleData = [],
  onConfirm,
  onCancel
}) => {
  // State: mapping from targetKey -> sourceColumn
  const [fieldMappings, setFieldMappings] = useState<Record<string, string | null>>(() => {
    const initial: Record<string, string | null> = {};
    targetColumns.forEach(t => {
      const suggested = suggestedMappings.find(m => m.targetKey === t.key);
      initial[t.key] = suggested?.sourceColumn || null;
    });
    return initial;
  });

  // Get sample values for a column
  const getSampleValues = (columnName: string): string[] => {
    if (!sampleData || sampleData.length === 0 || !columnName) return [];
    return sampleData
      .slice(0, 3)
      .map(row => row[columnName])
      .filter(v => v !== undefined && v !== null && v !== '')
      .map(v => String(v).slice(0, 15));
  };

  // Check which source columns are already used
  const usedSourceColumns = useMemo(() => {
    return new Set(Object.values(fieldMappings).filter(Boolean));
  }, [fieldMappings]);

  // Available source columns for a given target (includes currently selected one)
  const getAvailableSourcesFor = (targetKey: string) => {
    const currentSelection = fieldMappings[targetKey];
    return sourceColumns.filter(col => 
      col === currentSelection || !usedSourceColumns.has(col)
    );
  };

  // Count connected fields
  const connectedCount = Object.values(fieldMappings).filter(Boolean).length;
  const totalFields = targetColumns.length;
  const allConnected = connectedCount === totalFields;

  // Check if a mapping was auto-detected
  const wasAutoDetected = (targetKey: string) => {
    const suggested = suggestedMappings.find(m => m.targetKey === targetKey);
    return suggested && suggested.confidence >= 0.7 && fieldMappings[targetKey] === suggested.sourceColumn;
  };

  const handleMappingChange = (targetKey: string, sourceColumn: string | null) => {
    setFieldMappings(prev => ({
      ...prev,
      [targetKey]: sourceColumn === 'none' ? null : sourceColumn
    }));
  };

  const handleConfirm = () => {
    const mappings: ColumnMappingItem[] = targetColumns
      .filter(t => fieldMappings[t.key])
      .map(t => ({
        sourceColumn: fieldMappings[t.key]!,
        targetKey: t.key,
        targetLabel: t.label,
        confidence: 1,
        isRequired: t.required
      }));
    onConfirm(mappings);
  };

  // Unused source columns (for info)
  const unusedSourceColumns = sourceColumns.filter(col => !usedSourceColumns.has(col));

  return (
    <div className="space-y-5">
      {/* Header with visual guide - INVERTED */}
      <div className="flex items-center justify-center gap-4 py-3 px-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-sm font-medium text-primary">Campo do Sistema</span>
        </div>
        <ArrowLeft className="w-5 h-5 text-primary" />
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted-foreground/50" />
          <span className="text-sm font-medium text-muted-foreground">Sua Coluna</span>
        </div>
      </div>

      {/* Status */}
      {!allConnected && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">
            {totalFields - connectedCount} campo(s) ainda não conectado(s)
          </span>
        </div>
      )}

      {/* Mapping List - Field-centric */}
      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {targetColumns.map((target, idx) => {
          const selectedSource = fieldMappings[target.key];
          const isConnected = !!selectedSource;
          const isAutoDetected = wasAutoDetected(target.key);
          const availableSources = getAvailableSourcesFor(target.key);
          const samples = selectedSource ? getSampleValues(selectedSource) : [];
          
          return (
            <div 
              key={target.key}
              className={cn(
                "rounded-xl border-2 p-4 transition-all",
                isConnected 
                  ? "border-green-500/40 bg-green-500/5" 
                  : "border-dashed border-amber-500/50 bg-amber-500/5"
              )}
            >
              {/* Row Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {isConnected ? '✓ Conectado' : 'Selecione uma coluna'}
                </span>
                {isAutoDetected && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">
                    auto-detectado
                  </Badge>
                )}
              </div>

              <div className="flex items-stretch gap-3">
                {/* Target/System Field Block (LEFT - now the reference) */}
                <div className="flex-1 rounded-lg p-3 border border-primary/30 bg-primary/5">
                  <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">
                    CAMPO DO SISTEMA
                  </p>
                  <p className="font-semibold text-foreground text-sm">
                    {target.label}
                  </p>
                  {target.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {target.description}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center w-10">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    isConnected ? "bg-green-500/20" : "bg-amber-500/20"
                  )}>
                    {isConnected ? (
                      <Link2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <ArrowLeft className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                </div>

                {/* Source Selector Block (RIGHT - user picks their column) */}
                <div className="flex-1 bg-muted/50 rounded-lg p-3 border border-muted-foreground/20">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    SUA COLUNA
                  </p>
                  <Select
                    value={selectedSource || 'none'}
                    onValueChange={(val) => handleMappingChange(target.key, val)}
                  >
                    <SelectTrigger className={cn(
                      "w-full h-8 text-sm",
                      !selectedSource 
                        ? "text-amber-600 dark:text-amber-400 border-amber-500/50" 
                        : "bg-background/50"
                    )}>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border z-50 max-h-[280px]">
                      <SelectItem value="none">
                        <span className="text-muted-foreground italic">-- Nenhuma --</span>
                      </SelectItem>
                      {availableSources.map(col => {
                        const colSamples = getSampleValues(col);
                        return (
                          <SelectItem key={col} value={col} className="py-2">
                            <div>
                              <span className="font-medium">{col}</span>
                              {colSamples.length > 0 && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({colSamples.slice(0, 2).join(', ')}...)
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {/* Show sample values of selected column */}
                  {isConnected && samples.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1.5 truncate">
                      Ex: {samples.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Unused columns info */}
      {unusedSourceColumns.length > 0 && (
        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">
            Colunas do arquivo não utilizadas ({unusedSourceColumns.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {unusedSourceColumns.map(col => (
              <span
                key={col}
                className="px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground"
              >
                {col}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Progress Checklist */}
      <div className="bg-muted/20 rounded-lg p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Progresso ({connectedCount}/{totalFields} conectados)
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {targetColumns.map(field => {
            const isConnected = !!fieldMappings[field.key];
            return (
              <div 
                key={field.key}
                className={cn(
                  "flex items-center gap-2 text-sm py-1",
                  isConnected ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
                )}
              >
                {isConnected ? (
                  <Check className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <X className="w-4 h-4 flex-shrink-0" />
                )}
                <span className={cn(
                  "truncate",
                  isConnected ? "line-through opacity-70" : "font-medium"
                )}>
                  {field.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground">
          Cancelar
        </Button>
        <Button 
          onClick={handleConfirm}
          disabled={!allConnected}
          className="gap-2 min-w-[180px]"
        >
          <Check className="w-4 h-4" />
          Confirmar ({connectedCount}/{totalFields})
        </Button>
      </div>
    </div>
  );
};

export default SmartColumnMapper;
