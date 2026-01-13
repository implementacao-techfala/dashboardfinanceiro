import React from "react";
import { Trash2, FileSpreadsheet, Link2, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import DataUploader from "@/components/DataUploader";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Toggle: Fonte de dados (só aparece se tiver config Google) */}
      {hasGoogleConfig && (
        <ToggleGroup
          type="single"
          value={currentSource}
          onValueChange={handleSourceChange}
          className="border rounded-md"
        >
          <ToggleGroupItem
            value="file"
            aria-label="Arquivo local"
            disabled={isSyncing[pageId]}
          >
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            Arquivo
          </ToggleGroupItem>
          <ToggleGroupItem
            value="googlesheets"
            aria-label="Google Sheets"
            disabled={isSyncing[pageId]}
          >
            <Link2 className="h-4 w-4 mr-1" />
            Google Sheets
          </ToggleGroupItem>
        </ToggleGroup>
      )}

      {/* Botões condicionais baseados na fonte */}
      {currentSource === 'file' ? (
        <>
          <DataUploader pageId={pageId} onDataUpdated={onDataUpdated} />

          {uploadInfo && missingSheets.length > 0 ? (
            <div className="text-xs text-warning">
              Faltam abas: {missingSheets.join(", ")}
            </div>
          ) : null}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive border-destructive/50 hover:bg-destructive/10"
                disabled={!uploadInfo}
                title={!uploadInfo ? "Sem dados para remover" : "Remover dados desta página"}
              >
                <Trash2 className="h-4 w-4" />
                Remover Dados
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso vai remover os dados salvos desta página ({pageId}) do seu navegador (IndexedDB). Os gráficos ficarão vazios.
                  {uploadInfo ? (
                    <span className="block mt-2 text-sm text-muted-foreground">
                      Arquivo atual: {uploadInfo.fileName}
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
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : (
        <>
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
                Sincronizar
              </>
            )}
          </Button>

          {uploadInfo && (
            <div className="text-xs text-muted-foreground">
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
                variant="outline"
                size="sm"
                className="gap-2 text-destructive border-destructive/50 hover:bg-destructive/10"
                disabled={!uploadInfo || isSyncing[pageId]}
                title={!uploadInfo ? "Sem dados para remover" : "Remover dados desta página"}
              >
                <Trash2 className="h-4 w-4" />
                Remover Dados
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso vai remover os dados em cache do Google Sheets desta página ({pageId}) do seu navegador (IndexedDB). Os gráficos ficarão vazios. Você pode sincronizar novamente depois.
                  {uploadInfo ? (
                    <span className="block mt-2 text-sm text-muted-foreground">
                      Fonte: Google Sheets • Última sync: {formatDate(uploadInfo.uploadedAt)}
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
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}

