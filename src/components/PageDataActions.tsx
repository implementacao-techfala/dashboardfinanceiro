import React from "react";
import { Trash2, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useData } from "@/contexts/DataContext";
import { hasGoogleSheetsConfig } from "@/lib/googleSheetsConfig";

type Props = {
  pageId: string;
  onDataUpdated?: () => void;
};

export default function PageDataActions({ pageId, onDataUpdated }: Props) {
  const {
    clearData,
    getUploadInfo,
    dataSource,
    setDataSource,
    syncFromGoogleSheets,
    isSyncing
  } = useData();

  const currentSource = dataSource[pageId] || 'file';

  const rawUploadInfo = getUploadInfo(pageId);
  // Filtra dados visualmente: só mostra 'carregado/sync' se a fonte bater com a seleção atual
  const uploadInfo = (rawUploadInfo?.dataSource === currentSource || (currentSource === 'file' && !rawUploadInfo?.dataSource))
    ? rawUploadInfo
    : null;

  const missingSheets = uploadInfo?.completeness?.missingSheets || [];
  const hasGoogleConfig = hasGoogleSheetsConfig(pageId);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleClear = async () => {
    try {
      await clearData(pageId);
      onDataUpdated?.();
      toast.success("Dados removidos com sucesso.");
    } catch (e) {
      console.error("[PageDataActions] clearData error", e);
      toast.error("Erro ao remover dados.");
    }
  };

  const handleSourceChange = async (value: string) => {
    if (value === 'googlesheets' || value === 'file') {
      setDataSource(pageId, value);

      if (value === 'googlesheets') {
        try {
          await syncFromGoogleSheets(pageId);
          toast.success("Dados sincronizados do Google Sheets com sucesso.");
          onDataUpdated?.();
        } catch (error) {
          console.error("[PageDataActions] syncFromGoogleSheets error", error);
          toast.error(error instanceof Error ? error.message : "Erro ao sincronizar Google Sheets.");
        }
      } else {
        onDataUpdated?.();
      }
    }
  };

  const handleSync = async () => {
    try {
      await syncFromGoogleSheets(pageId);
      toast.success("Dados sincronizados com sucesso.");
      onDataUpdated?.();
    } catch (error) {
      console.error("[PageDataActions] syncFromGoogleSheets error", error);
      toast.error(error instanceof Error ? error.message : "Erro ao sincronizar Google Sheets.");
    }
  };

  // Simplificado para Opção A: Apenas Google Sheets

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Botões de Ação (Sempre Google Sheets agora) */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={isSyncing[pageId]}
        className="gap-2"
      >
        {isSyncing[pageId] ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sincronizando...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Sincronizar Dados
          </>
        )}
      </Button>

      {uploadInfo && (
        <div className="text-xs text-muted-foreground hidden sm:block">
          Última sync: {formatDate(uploadInfo.uploadedAt)}
        </div>
      )}

      {uploadInfo && missingSheets.length > 0 ? (
        <div className="text-xs text-warning">
          Faltam abas: {missingSheets.join(", ")}
        </div>
      ) : null}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-destructive hover:bg-destructive/10"
            disabled={!uploadInfo || isSyncing[pageId]}
            title={!uploadInfo ? "Sem dados para remover" : "Limpar cache local"}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar cache local?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso remove os dados salvos neste computador. Para ver os dados novamente, basta clicar em Sincronizar.
              Os dados na planilha do Google não serão afetados.
              {uploadInfo ? (
                <span className="block mt-2 text-sm text-muted-foreground">
                  Última cópia: {formatDate(uploadInfo.uploadedAt)}
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClear}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Limpar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

