// Configuração centralizada para Google Sheets
// Prioridade: localStorage (admin) > variáveis de ambiente (.env)

import { getStoredApiKey, getStoredSheetId } from './googleSheetsStorage';

/**
 * Retorna o Google Sheet ID para uma página específica
 * @param pageId - ID da página (ex: 'overview', 'sales', 'financial')
 * @returns Sheet ID ou null se não configurado
 */
export const getGoogleSheetId = (pageId: string): string | null => {
  // Prioridade 1: localStorage (configurado via admin)
  const stored = getStoredSheetId(pageId);
  if (stored && stored.length > 0) {
    return stored;
  }

  // Prioridade 2: variáveis de ambiente
  const env = import.meta.env as Record<string, string | undefined>;
  const envKey = `VITE_GOOGLE_SHEETS_${pageId.toUpperCase()}_ID`;
  const sheetId = env[envKey];
  return sheetId && sheetId.length > 0 ? sheetId : null;
};

/**
 * Retorna a API Key do Google Sheets (pública ou Service Account)
 * @returns API Key ou null se não configurado
 */
export const getGoogleSheetsApiKey = (): string | null => {
  // Prioridade 1: localStorage (configurado via admin)
  const stored = getStoredApiKey();
  if (stored && stored.length > 0) {
    return stored;
  }

  // Prioridade 2: variáveis de ambiente
  const env = import.meta.env as Record<string, string | undefined>;
  const apiKey = env.VITE_GOOGLE_SHEETS_API_KEY;
  return apiKey && apiKey.length > 0 ? apiKey : null;
};

/**
 * Mapeamento de nomes de abas do Google Sheets para nomes esperados pelo template
 * Se o Google Sheet tem "Dados MRR" mas o template espera "MRR", mapeia aqui
 */
const SHEET_NAME_MAPPING: Record<string, Record<string, string>> = {
  // overview: {
  //   "Dados MRR": "MRR",
  //   "Produtividade Mensal": "Produtividade"
  // },
  // Adicione mapeamentos conforme necessário
};

/**
 * Retorna o mapeamento de nomes de abas para uma página
 * @param pageId - ID da página
 * @returns Objeto com mapeamento { "Nome no Google": "Nome no Template" }
 */
export const getSheetNameMapping = (pageId: string): Record<string, string> => {
  return SHEET_NAME_MAPPING[pageId] || {};
};

/**
 * Verifica se uma página tem Google Sheets configurado
 * @param pageId - ID da página
 * @returns true se tem Sheet ID e API Key configurados
 */
export const hasGoogleSheetsConfig = (pageId: string): boolean => {
  // Agora suportamos acesso público sem API Key, então só precisamos do Sheet ID
  return getGoogleSheetId(pageId) !== null;
};

/**
 * Retorna todas as páginas que têm Google Sheets configurado
 * @returns Array de pageIds com configuração
 */
export const getPagesWithGoogleSheets = (): string[] => {
  const allPages = ['overview', 'sales', 'financial', 'hr', 'marketing', 'clients', 'services', 'cashflow'];
  return allPages.filter(pageId => hasGoogleSheetsConfig(pageId));
};
