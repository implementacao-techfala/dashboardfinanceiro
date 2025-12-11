import React, { useState, useEffect } from 'react';
import { AlertTriangle, Check, HelpCircle, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ColumnMapping, MappingResult } from '@/lib/columnMapping';
import { TemplateColumn } from '@/lib/templates';

interface ColumnMapperDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mappings: ColumnMapping[]) => void;
  mappingResult: MappingResult;
  targetColumns: TemplateColumn[];
  sheetName: string;
}

const ColumnMapperDialog: React.FC<ColumnMapperDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  mappingResult,
  targetColumns,
  sheetName
}) => {
  const [currentMappings, setCurrentMappings] = useState<ColumnMapping[]>([]);
  const [unmappedAssignments, setUnmappedAssignments] = useState<Record<string, string>>({});

  useEffect(() => {
    setCurrentMappings(mappingResult.mappings);
    setUnmappedAssignments({});
  }, [mappingResult]);

  const getUsedTargets = () => {
    const used = new Set(currentMappings.map(m => m.targetKey));
    Object.values(unmappedAssignments).forEach(target => {
      if (target && target !== 'ignore') used.add(target);
    });
    return used;
  };

  const getAvailableTargets = () => {
    const used = getUsedTargets();
    return targetColumns.filter(col => !used.has(col.key));
  };

  const handleUnmappedChange = (sourceCol: string, targetKey: string) => {
    setUnmappedAssignments(prev => ({
      ...prev,
      [sourceCol]: targetKey
    }));
  };

  const handleChangeMappingTarget = (sourceCol: string, newTarget: string) => {
    if (newTarget === 'ignore') {
      // Remove the mapping
      setCurrentMappings(prev => prev.filter(m => m.sourceColumn !== sourceCol));
    } else {
      setCurrentMappings(prev => 
        prev.map(m => 
          m.sourceColumn === sourceCol 
            ? { ...m, targetKey: newTarget, confidence: 1 }
            : m
        )
      );
    }
  };

  const handleConfirm = () => {
    // Combine existing mappings with new assignments
    const finalMappings: ColumnMapping[] = [...currentMappings];
    
    for (const [sourceCol, targetKey] of Object.entries(unmappedAssignments)) {
      if (targetKey && targetKey !== 'ignore') {
        finalMappings.push({
          sourceColumn: sourceCol,
          targetKey,
          confidence: 1,
          status: 'matched'
        });
      }
    }
    
    onConfirm(finalMappings);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.95) return 'text-green-400';
    if (confidence >= 0.8) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.95) return 'Exato';
    if (confidence >= 0.8) return 'Provável';
    return 'Incerto';
  };

  const availableTargets = getAvailableTargets();
  const usedTargets = getUsedTargets();

  // Check if all required fields are mapped
  const missingRequired = targetColumns.filter(col => 
    col.required && !usedTargets.has(col.key)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Mapeamento de Colunas - {sheetName}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Algumas colunas do seu arquivo não foram reconhecidas automaticamente. 
            Por favor, revise o mapeamento abaixo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Matched columns */}
          {currentMappings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Check className="h-4 w-4 text-green-400" />
                Colunas Mapeadas ({currentMappings.length})
              </h4>
              <div className="grid gap-2">
                {currentMappings.map(mapping => (
                  <Card key={mapping.sourceColumn} className="p-3 bg-muted/20 border-border/50">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-sm font-mono truncate text-foreground">
                          {mapping.sourceColumn}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Select 
                          value={mapping.targetKey}
                          onValueChange={(value) => handleChangeMappingTarget(mapping.sourceColumn, value)}
                        >
                          <SelectTrigger className="w-48 h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={mapping.targetKey}>
                              {targetColumns.find(c => c.key === mapping.targetKey)?.label || mapping.targetKey}
                            </SelectItem>
                            {availableTargets.map(col => (
                              <SelectItem key={col.key} value={col.key}>
                                {col.label}
                              </SelectItem>
                            ))}
                            <SelectItem value="ignore" className="text-destructive">
                              Ignorar coluna
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getConfidenceColor(mapping.confidence)}`}
                      >
                        {getConfidenceLabel(mapping.confidence)}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Unmapped source columns */}
          {mappingResult.unmappedSource.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                Colunas Não Reconhecidas ({mappingResult.unmappedSource.length})
              </h4>
              <p className="text-xs text-muted-foreground">
                Selecione o campo correspondente ou ignore a coluna se não for necessária.
              </p>
              <div className="grid gap-2">
                {mappingResult.unmappedSource.map(sourceCol => (
                  <Card key={sourceCol} className="p-3 bg-yellow-500/5 border-yellow-500/30">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-foreground flex-1 truncate">
                        {sourceCol}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Select 
                        value={unmappedAssignments[sourceCol] || ''}
                        onValueChange={(value) => handleUnmappedChange(sourceCol, value)}
                      >
                        <SelectTrigger className="w-48 h-8 text-sm">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ignore">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <X className="h-3 w-3" /> Ignorar
                            </span>
                          </SelectItem>
                          {availableTargets.map(col => (
                            <SelectItem key={col.key} value={col.key}>
                              {col.label} {col.required && <span className="text-destructive">*</span>}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Missing required fields */}
          {missingRequired.length > 0 && (
            <Card className="p-3 bg-destructive/10 border-destructive/30">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">Campos obrigatórios faltando:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {missingRequired.map(col => (
                      <Badge key={col.key} variant="outline" className="text-destructive border-destructive/50">
                        {col.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={missingRequired.length > 0}
            className="bg-primary hover:bg-primary/90"
          >
            Confirmar Mapeamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ColumnMapperDialog;
