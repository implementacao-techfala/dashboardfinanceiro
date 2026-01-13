import React, { useState } from 'react';
import { FileSpreadsheet, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useData } from '@/contexts/DataContext';
import SmartUploadModal from './SmartUploadModal';
import { toast } from "sonner";

interface DataUploaderProps {
  pageId: string;
  onDataUpdated?: () => void;
}

// Google Sheets template links (configure real links when available)
const googleSheetsLinks: Record<string, string | undefined> = {
  hr: undefined,
  cashflow: undefined,
  financial: undefined,
  sales: undefined,
  marketing: undefined,
  clients: undefined,
  services: undefined,
  overview: undefined,
};

const DataUploader: React.FC<DataUploaderProps> = ({ pageId, onDataUpdated }) => {
  const { setData, getUploadInfo, getPageCompleteness } = useData();
  const [isOpen, setIsOpen] = useState(false);

  const fullUploadInfo = getUploadInfo(pageId);
  // Só mostra como "Carregado" se a fonte for arquivo (ou undefined/null, que assumimos como arquivo antigo)
  const uploadInfo = fullUploadInfo?.dataSource === 'googlesheets' ? null : fullUploadInfo;

  const googleSheetLink = googleSheetsLinks[pageId];

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDataLoaded = async (data: Record<string, any[]>, fileName: string) => {
    console.log('[DataUploader] handleDataLoaded called', { pageId, fileName, data });
    try {
      await setData(pageId, data, fileName);
      console.log('[DataUploader] setData completed successfully');
      const completeness = getPageCompleteness(pageId);
      if (completeness.requiredSheets.length > 1 && completeness.missingSheets.length > 0) {
        toast.warning(
          `Importado. Ainda faltam abas: ${completeness.missingSheets.join(", ")}`,
          { duration: 6000 }
        );
      }
      onDataUpdated?.();
    } catch (error) {
      console.error('[DataUploader] Error in setData:', error);
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(true)}
              className={`gap-2 ${uploadInfo ? 'border-green-500/50 text-green-400' : 'border-border/50'}`}
            >
              {uploadInfo ? (
                <Check className="h-4 w-4" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              {uploadInfo ? 'Dados Carregados' : 'Carregar Dados'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {uploadInfo
              ? (() => {
                const c = uploadInfo.completeness;
                if (c && c.requiredSheets.length > 1 && c.missingSheets.length > 0) {
                  return `Arquivo: ${uploadInfo.fileName} (${formatDate(uploadInfo.uploadedAt)}) • Faltam abas: ${c.missingSheets.join(", ")}`;
                }
                return `Arquivo: ${uploadInfo.fileName} (${formatDate(uploadInfo.uploadedAt)})`;
              })()
              : 'Clique para importar planilha'
            }
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <SmartUploadModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        pageId={pageId}
        onDataLoaded={handleDataLoaded}
        googleSheetsUrl={googleSheetLink}
      />
    </>
  );
};

export default DataUploader;
