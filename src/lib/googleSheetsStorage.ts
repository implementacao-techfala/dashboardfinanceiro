// Armazenamento das configurações do Google Sheets no localStorage
// Permite configurar via interface admin ao invés de .env

const STORAGE_KEY = 'googleSheetsConfig';

export interface GoogleSheetsConfig {
  apiKey: string;
  sheetIds: Record<string, string>; // { overview: 'id123', sales: 'id456', ... }
}

/**
 * Salva configuração do Google Sheets no localStorage
 */
export const saveGoogleSheetsConfig = (config: GoogleSheetsConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    console.log('[GoogleSheetsStorage] Config saved');
  } catch (error) {
    console.error('[GoogleSheetsStorage] Error saving config:', error);
    throw error;
  }
};

/**
 * Carrega configuração do Google Sheets do localStorage
 */
export const loadGoogleSheetsConfig = (): GoogleSheetsConfig | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const config = JSON.parse(stored) as GoogleSheetsConfig;
    return config;
  } catch (error) {
    console.error('[GoogleSheetsStorage] Error loading config:', error);
    return null;
  }
};

/**
 * Limpa configuração do Google Sheets
 */
export const clearGoogleSheetsConfig = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[GoogleSheetsStorage] Config cleared');
  } catch (error) {
    console.error('[GoogleSheetsStorage] Error clearing config:', error);
  }
};

/**
 * Obtém API Key do localStorage ou retorna null
 */
export const getStoredApiKey = (): string | null => {
  const config = loadGoogleSheetsConfig();
  return config?.apiKey || null;
};

/**
 * Obtém Sheet ID de uma página do localStorage ou retorna null
 */
export const getStoredSheetId = (pageId: string): string | null => {
  const config = loadGoogleSheetsConfig();
  return config?.sheetIds?.[pageId] || null;
};
