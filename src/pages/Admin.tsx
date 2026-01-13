import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Save, Eye, EyeOff, Trash2, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { saveGoogleSheetsConfig, loadGoogleSheetsConfig, clearGoogleSheetsConfig, type GoogleSheetsConfig } from "@/lib/googleSheetsStorage";
import { validateGoogleSheetAccess, fetchGoogleSheetData } from "@/lib/googleSheets";
import { smartTemplates } from "@/lib/smartTemplates";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ADMIN_PASSWORD = '@Jo3v1_lulci_mettou1';

const PAGE_NAMES: Record<string, string> = {
  overview: 'Visão Geral',
  sales: 'Vendas',
  financial: 'Financeiro',
  hr: 'Recursos Humanos',
  marketing: 'Marketing',
  clients: 'Clientes',
  services: 'Serviços',
  cashflow: 'Fluxo de Caixa',
};

const ALL_PAGES = Object.keys(PAGE_NAMES);

export default function Admin() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [sheetIds, setSheetIds] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState<Record<string, boolean>>({});
  const [validationStatus, setValidationStatus] = useState<Record<string, 'valid' | 'invalid' | null>>({});

  // Preview States
  const [previewData, setPreviewData] = useState<{ pageId: string; data: Record<string, any[]> } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    // Verifica se já está autenticado (sessionStorage)
    const auth = sessionStorage.getItem('admin_authenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
      loadConfig();
    }
  }, []);

  const loadConfig = () => {
    const config = loadGoogleSheetsConfig();
    if (config) {
      setApiKey(config.apiKey || '');
      setSheetIds(config.sheetIds || {});
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      loadConfig();
      toast.success('Acesso autorizado');
    } else {
      toast.error('Senha incorreta');
      setPassword('');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const config: GoogleSheetsConfig = {
        apiKey: apiKey.trim(),
        sheetIds: Object.fromEntries(
          Object.entries(sheetIds).filter(([_, id]) => id.trim().length > 0)
        ),
      };

      saveGoogleSheetsConfig(config);
      toast.success('Configuração salva com sucesso!');

      // Recarrega a página para aplicar mudanças
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('[Admin] Error saving config:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    if (confirm('Tem certeza que deseja limpar todas as configurações?')) {
      clearGoogleSheetsConfig();
      setApiKey('');
      setSheetIds({});
      toast.success('Configurações limpas');
    }
  };

  const handlePreview = async (pageId: string) => {
    setIsPreviewLoading(true);
    setPreviewData(null);
    try {
      // Pega os nomes das abas esperadas do template
      const template = smartTemplates[pageId];
      const sheetNames = template?.sheets.map(s => s.name) || [];

      if (sheetNames.length === 0) {
        toast.error('Nenhuma aba configurada para este template');
        return;
      }

      // Busca dados reais
      const data = await fetchGoogleSheetData(pageId, sheetNames);
      setPreviewData({ pageId, data });
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('[Admin] Preview error:', error);
      toast.error(`Erro ao carregar preview: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleValidateSheet = async (pageId: string) => {
    const sheetId = sheetIds[pageId]?.trim();
    if (!sheetId) {
      toast.error('Insira o Sheet ID primeiro');
      return;
    }

    setIsValidating(prev => ({ ...prev, [pageId]: true }));
    setValidationStatus(prev => ({ ...prev, [pageId]: null }));

    try {
      // Valida passando explicitamente o ID e a Key, sem salvar
      const isValid = await validateGoogleSheetAccess(pageId, sheetId, apiKey);

      if (isValid) {
        setValidationStatus(prev => ({ ...prev, [pageId]: 'valid' }));
        toast.success(`Planilha "${PAGE_NAMES[pageId]}" acessível!`);
        // handlePreview(pageId); // Descomente para auto-preview
      } else {
        setValidationStatus(prev => ({ ...prev, [pageId]: 'invalid' }));
        toast.error(`Erro ao acessar planilha "${PAGE_NAMES[pageId]}"`);
      }
    } catch (error) {
      console.error('[Admin] Validation error:', error);
      setValidationStatus(prev => ({ ...prev, [pageId]: 'invalid' }));
      toast.error(`Erro ao validar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsValidating(prev => ({ ...prev, [pageId]: false }));
    }
  };

  const updateSheetId = (pageId: string, value: string) => {
    setSheetIds(prev => ({ ...prev, [pageId]: value }));
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-6">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Área Administrativa</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Configure o Google Sheets
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite a senha"
                  className="pr-10"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Configuração do Google Sheets</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Configure as credenciais e IDs das planilhas para cada página
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              sessionStorage.removeItem('admin_authenticated');
              navigate('/');
            }}
          >
            Sair
          </Button>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="apiKey">
                Google Sheets API Key
                <span className="ml-2 text-xs text-muted-foreground">
                  (obtenha em console.cloud.google.com)
                </span>
              </Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                className="font-mono text-sm"
              />
            </div>

            {/* Sheet IDs por página */}
            <div className="space-y-4">
              <Label>Sheet IDs por Página</Label>
              <div className="space-y-3">
                {ALL_PAGES.map((pageId) => {
                  const sheetId = sheetIds[pageId] || '';
                  const isPageValidating = isValidating[pageId] || false;
                  const status = validationStatus[pageId];

                  return (
                    <div key={pageId} className="flex items-center gap-2">
                      <div className="flex-1">
                        <Label htmlFor={`sheet-${pageId}`} className="text-sm font-medium flex items-center gap-2">
                          {PAGE_NAMES[pageId]}
                          {status === 'valid' && <span className="text-xs text-green-600 font-normal flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" /> Validado</span>}
                          {status === 'invalid' && <span className="text-xs text-red-600 font-normal flex items-center"><XCircle className="w-3 h-3 mr-1" /> Erro de acesso</span>}
                        </Label>
                        <Input
                          id={`sheet-${pageId}`}
                          value={sheetId}
                          onChange={(e) => {
                            updateSheetId(pageId, e.target.value);
                            setValidationStatus(prev => ({ ...prev, [pageId]: null }));
                          }}
                          placeholder="ID da planilha (da URL do Google Sheets)"
                          className={`mt-1 font-mono text-sm ${status === 'valid' ? 'border-green-500 ring-green-500/20' :
                            status === 'invalid' ? 'border-red-500 ring-red-500/20' : ''
                            }`}
                        />
                      </div>
                      <Button
                        type="button"
                        variant={status === 'valid' ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => handleValidateSheet(pageId)}
                        disabled={isPageValidating || !sheetId.trim()}
                        className={`mt-6 ${status === 'valid' ? 'text-green-700 bg-green-100 hover:bg-green-200 border-green-200' : ''}`}
                      >
                        {isPageValidating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Validando...
                          </>
                        ) : status === 'valid' ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Revalidar
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="ml-1 h-6 px-2 text-xs hover:bg-green-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreview(pageId);
                              }}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              Ver Dados
                            </Button>
                          </div>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Validar
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configuração
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={handleClear}
                disabled={isSaving}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Instruções */}
            <div className="mt-6 rounded-lg border bg-muted/50 p-4 text-sm">
              <h3 className="mb-2 font-semibold">Como obter o Sheet ID:</h3>
              <ol className="list-inside list-decimal space-y-1 text-muted-foreground">
                <li>Abra a planilha no Google Sheets</li>
                <li>Copie a URL: <code className="rounded bg-background px-1">https://docs.google.com/spreadsheets/d/1abc...xyz/edit</code></li>
                <li>O ID é a parte entre <code className="rounded bg-background px-1">/d/</code> e <code className="rounded bg-background px-1">/edit</code></li>
              </ol>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualização de Dados: {previewData ? PAGE_NAMES[previewData.pageId] : 'Carregando...'}</DialogTitle>
            <DialogDescription>
              Abaixo estão as primeiras 5 linhas de cada aba importada do Google Sheets.
            </DialogDescription>
          </DialogHeader>

          {previewData && (
            <Tabs defaultValue={Object.keys(previewData.data)[0] || 'empty'} className="w-full">
              <TabsList className="mb-4 flex flex-wrap h-auto">
                {Object.keys(previewData.data).map((sheetName) => (
                  <TabsTrigger key={sheetName} value={sheetName}>
                    {sheetName} ({previewData.data[sheetName]?.length || 0})
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(previewData.data).map(([sheetName, rows]) => (
                <TabsContent key={sheetName} value={sheetName} className="border rounded-md p-2">
                  {rows && rows.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(rows[0]).map((header) => (
                              <TableHead key={header} className="whitespace-nowrap font-bold text-black">{header}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rows.slice(0, 5).map((row, i) => (
                            <TableRow key={i}>
                              {Object.values(row).map((val: any, j) => (
                                <TableCell key={j} className="whitespace-nowrap">
                                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {rows.length > 5 && (
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          ... e mais {rows.length - 5} linhas.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      <p>Nenhum dado encontrado nesta aba.</p>
                      <p className="text-xs mt-1">Verifique se o nome da aba na planilha é exatamente "{sheetName}"</p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
