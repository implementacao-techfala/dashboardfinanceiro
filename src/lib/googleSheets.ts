// Integração com Google Sheets API v4
import { getGoogleSheetId, getGoogleSheetsApiKey, getSheetNameMapping } from './googleSheetsConfig';

export interface GoogleSheetsError {
  message: string;
  code?: string;
}

/**
 * Transforma dados do formato Google Sheets (array de arrays) para formato esperado (array de objetos)
 * @param rows - Array de arrays do Google Sheets: [["col1","col2"],["val1","val2"]]
 * @returns Array de objetos: [{col1:"val1",col2:"val2"}]
 */
const transformSheetData = (rows: string[][]): any[] => {
  if (!rows || rows.length === 0) return [];

  const headers = rows[0].map(h => h.trim());
  if (headers.length === 0) return [];

  return rows.slice(1)
    .filter(row => row.some(cell => cell && cell.trim().length > 0)) // Remove linhas vazias
    .map(row => {
      const obj: any = {};
      headers.forEach((header, i) => {
        const value = row[i] || '';
        // Tenta converter números automaticamente
        const numValue = Number(value);
        obj[header] = isNaN(numValue) || value.trim() === '' ? value.trim() : numValue;
      });
      return obj;
    });
};

/**
 * Busca dados de uma aba específica do Google Sheets
 * @param sheetId - ID da planilha Google
 * @param sheetName - Nome da aba (ex: "MRR", "Sheet1")
 * @param apiKey - API Key do Google Sheets
 * @returns Array de objetos com os dados da aba
 */
/**
 * Faz parse de CSV simples para matriz de strings
 */
const parseCSV = (csvText: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal);
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (currentVal || currentRow.length > 0) {
        currentRow.push(currentVal);
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
      if (char === '\r' && nextChar === '\n') i++;
    } else {
      currentVal += char;
    }
  }
  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal);
    rows.push(currentRow);
  }
  return rows;
};

/**
 * Busca dados de uma aba específica do Google Sheets
 * Tenta primeiro via API, se falhar ou sem chave, tenta via URL pública (CSV)
 */
const fetchSheetRange = async (
  sheetId: string,
  sheetName: string,
  apiKey: string | null
): Promise<any[]> => {
  // Tenta via API Oficial se tiver chave
  if (apiKey) {
    try {
      const range = `${sheetName}!A:ZZ`;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        if (data.values && data.values.length > 0) {
          return transformSheetData(data.values);
        }
      } else {
        console.warn(`[GoogleSheets] Falha na API (${response.status}), tentando método público (CSV)...`);
      }
    } catch (e) {
      console.warn('[GoogleSheets] Erro na requisição API, tentando método público (CSV)...', e);
    }
  }

  // Fallback: Método Público via Google Vizualization API (retorna CSV)
  // Vantagem: Aceita nome da aba (sheet=Name) e não precisa de API Key para planilhas públicas
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(
      `Erro ao buscar dados (Método Público): ${response.status} ${response.statusText}. Verifique se a planilha está pública (Qualquer pessoa com o link).`
    );
  }

  const csvText = await response.text();
  const rows = parseCSV(csvText);
  return transformSheetData(rows);
};

/**
 * Busca dados do Google Sheets para uma página específica
 * @param pageId - ID da página (ex: 'overview', 'sales')
 * @param sheetNames - Array com nomes das abas esperadas pelo template
 * @returns Objeto com dados por aba: { "MRR": [...], "Produtividade": [...] }
 */
export const fetchGoogleSheetData = async (
  pageId: string,
  sheetNames: string[]
): Promise<Record<string, any[]>> => {
  const sheetId = getGoogleSheetId(pageId);
  const apiKey = getGoogleSheetsApiKey();

  if (!sheetId) {
    throw new Error(`Google Sheets não configurado para a página "${pageId}". Configure VITE_GOOGLE_SHEETS_${pageId.toUpperCase()}_ID`);
  }

  if (!apiKey) {
    console.warn('API Key do Google Sheets não configurada. Tentando acesso público...');
  }

  const nameMapping = getSheetNameMapping(pageId);
  const result: Record<string, any[]> = {};

  // Para cada aba esperada pelo template
  for (const templateSheetName of sheetNames) {
    try {
      // Verifica se há mapeamento de nome
      const googleSheetName = nameMapping[templateSheetName] || templateSheetName;

      // Busca dados da aba
      const data = await fetchSheetRange(sheetId, googleSheetName, apiKey);
      result[templateSheetName] = data;

      console.log(`[GoogleSheets] Baixados ${data.length} registros da aba "${googleSheetName}" (template: "${templateSheetName}")`);
    } catch (error) {
      console.error(`[GoogleSheets] Erro ao buscar aba "${templateSheetName}":`, error);
      // Se uma aba falhar, continua com as outras mas marca como vazia
      result[templateSheetName] = [];

      // Se for erro de aba não encontrada, lança erro mais claro
      if (error instanceof Error && error.message.includes('Unable to parse range')) {
        throw new Error(
          `Aba "${nameMapping[templateSheetName] || templateSheetName}" não encontrada na planilha Google. ` +
          `Verifique se a aba existe e se o nome está correto.`
        );
      }
    }
  }

  return result;
};

/**
 * Valida se uma planilha Google está acessível
 * @param pageId - ID da página
 * @returns true se acessível, false caso contrário
 */
export const validateGoogleSheetAccess = async (
  pageId: string,
  explicitSheetId?: string,
  explicitApiKey?: string
): Promise<boolean> => {
  try {
    const sheetId = explicitSheetId || getGoogleSheetId(pageId);
    const apiKey = explicitApiKey !== undefined ? explicitApiKey : getGoogleSheetsApiKey();

    if (!sheetId) {
      return false;
    }

    // Tenta primeiro via Url Pública (CSV) - mais simples e garantido para planilhas públicas
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
    const responseCsv = await fetch(csvUrl); // fetch head request might be better but simple gets are safer for CORS
    if (responseCsv.ok) return true;

    // Se falhar e tiver chave, tenta via API
    if (apiKey) {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${apiKey}`;
      const response = await fetch(url);
      return response.ok;
    }

    return false;
  } catch {
    return false;
  }
};
