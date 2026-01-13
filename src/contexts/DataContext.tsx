import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getPageData, savePageData, deletePageData, PageData, initDB } from '@/lib/indexedDB';
import { smartTemplates } from '@/lib/smartTemplates';
import { fetchGoogleSheetData } from '@/lib/googleSheets';
import { hasGoogleSheetsConfig } from '@/lib/googleSheetsConfig';

type PageCompleteness = {
  requiredSheets: string[];
  presentSheets: string[];
  missingSheets: string[];
  isComplete: boolean;
};

interface DataContextType {
  getData: (pageId: string, sheetName?: string) => any;
  setData: (pageId: string, data: any, fileName: string, dataSource?: 'file' | 'googlesheets') => Promise<void>;
  clearData: (pageId: string) => Promise<void>;
  getUploadInfo: (pageId: string) => { fileName: string; uploadedAt: Date; completeness?: PageCompleteness; dataSource?: 'file' | 'googlesheets' } | null;
  getPageCompleteness: (pageId: string) => PageCompleteness;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  // Google Sheets
  dataSource: Record<string, 'file' | 'googlesheets'>;
  setDataSource: (pageId: string, source: 'file' | 'googlesheets') => void;
  syncFromGoogleSheets: (pageId: string) => Promise<void>;
  isSyncing: Record<string, boolean>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [pageDataMap, setPageDataMap] = useState<Record<string, PageData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSourceState] = useState<Record<string, 'file' | 'googlesheets'>>({});
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});

  const getPageCompleteness = (pageId: string): PageCompleteness => {
    const template = smartTemplates[pageId];
    const requiredSheets = template?.sheets?.map(s => s.name) || [];
    const pageData = pageDataMap[pageId];

    if (!pageData || !pageData.data) {
      return { requiredSheets, presentSheets: [], missingSheets: requiredSheets, isComplete: requiredSheets.length === 0 };
    }

    const data = pageData.data as any;
    // Multi-sheet: record<string, any[]>
    if (!Array.isArray(data) && typeof data === 'object') {
      const presentSheets = Object.keys(data).filter(k => Array.isArray(data[k]) && data[k].length > 0);
      const missingSheets = requiredSheets.length > 0 ? requiredSheets.filter(s => !presentSheets.includes(s)) : [];
      return { requiredSheets, presentSheets, missingSheets, isComplete: missingSheets.length === 0 };
    }

    // Array: single-sheet legacy
    const presentSheets = Array.isArray(data) && data.length > 0 ? ["__single__"] : [];
    const missingSheets = requiredSheets.length > 0 ? requiredSheets.filter(() => true) : [];
    return { requiredSheets, presentSheets, missingSheets, isComplete: requiredSheets.length === 0 };
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await initDB();
      const pageIds = Object.keys(smartTemplates);
      const dataMap: Record<string, PageData> = {};
      const sourceMap: Record<string, 'file' | 'googlesheets'> = {};
      
      for (const pageId of pageIds) {
        const data = await getPageData(pageId);
        if (data) {
          dataMap[pageId] = data;
          // Carrega dataSource do IndexedDB ou usa padrão baseado na configuração
          if (data.dataSource) {
            sourceMap[pageId] = data.dataSource;
          } else if (hasGoogleSheetsConfig(pageId)) {
            // Se tem config do Google mas não tem dataSource salvo, usa 'file' como padrão
            sourceMap[pageId] = 'file';
          }
          console.log(`[DataContext] Loaded data for ${pageId}:`, data);
        } else if (hasGoogleSheetsConfig(pageId)) {
          // Se não tem dados mas tem config Google, padrão é 'file'
          sourceMap[pageId] = 'file';
        }
      }
      
      setPageDataMap(dataMap);
      setDataSourceState(sourceMap);
      console.log('[DataContext] All data loaded:', Object.keys(dataMap));
    } catch (error) {
      console.error('[DataContext] Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const getData = (pageId: string, sheetName?: string): any => {
    const pageData = pageDataMap[pageId];
    const template = smartTemplates[pageId];
    
    console.log(`[DataContext] getData(${pageId}, ${sheetName})`, { hasPageData: !!pageData, hasTemplate: !!template });
    
    if (pageData && pageData.data) {
      const data = pageData.data;
      // If data is a multi-sheet object
      if (!Array.isArray(data) && typeof data === 'object') {
        if (sheetName) {
          return (data as Record<string, any[]>)[sheetName] || [];
        }
        const keys = Object.keys(data);
        console.log(`[DataContext] Multi-sheet data, keys:`, keys);
        return keys.length > 0 ? (data as Record<string, any[]>)[keys[0]] : [];
      }
      // If data is array (backward compatibility)
      return data;
    }
    return [];
  };

  const setData = async (pageId: string, data: any, fileName: string, dataSource: 'file' | 'googlesheets' = 'file'): Promise<void> => {
    console.log(`[DataContext] setData called for ${pageId}`, { fileName, data, dataSource });
    
    try {
      // CSV por aba: permitir merge incremental de sheets no mesmo pageId
      // Mas só se ambas forem da mesma fonte
      const prev = pageDataMap[pageId];
      const prevDataSource = prev?.dataSource || 'file';
      
      const shouldMerge =
        prev &&
        prevDataSource === dataSource &&
        typeof prev.data === 'object' &&
        !Array.isArray(prev.data) &&
        data &&
        typeof data === 'object' &&
        !Array.isArray(data);

      const nextData = shouldMerge ? { ...(prev.data as Record<string, any[]>), ...(data as Record<string, any[]>) } : data;

      await savePageData(pageId, nextData, fileName, dataSource);
      setPageDataMap(prev => ({
        ...prev,
        [pageId]: { pageId, data: nextData, fileName, uploadedAt: new Date(), dataSource }
      }));
      
      // Atualiza dataSource se necessário
      if (dataSource !== prevDataSource) {
        setDataSourceState(prev => ({ ...prev, [pageId]: dataSource }));
      }
      
      console.log(`[DataContext] Data saved successfully for ${pageId} with source: ${dataSource}`);
    } catch (error) {
      console.error(`[DataContext] Error saving data for ${pageId}:`, error);
      throw error;
    }
  };

  const clearData = async (pageId: string): Promise<void> => {
    await deletePageData(pageId);
    setPageDataMap(prev => {
      const newMap = { ...prev };
      delete newMap[pageId];
      return newMap;
    });
  };

  const getUploadInfo = (pageId: string): { fileName: string; uploadedAt: Date; completeness?: PageCompleteness; dataSource?: 'file' | 'googlesheets' } | null => {
    const pageData = pageDataMap[pageId];
    if (pageData) {
      return { 
        fileName: pageData.fileName, 
        uploadedAt: pageData.uploadedAt, 
        completeness: getPageCompleteness(pageId),
        dataSource: pageData.dataSource || 'file'
      };
    }
    return null;
  };

  const refreshData = async () => {
    await loadAllData();
  };

  const setDataSource = (pageId: string, source: 'file' | 'googlesheets') => {
    setDataSourceState(prev => ({ ...prev, [pageId]: source }));
    console.log(`[DataContext] Data source set to ${source} for ${pageId}`);
  };

  const syncFromGoogleSheets = async (pageId: string): Promise<void> => {
    setIsSyncing(prev => ({ ...prev, [pageId]: true }));
    try {
      const template = smartTemplates[pageId];
      if (!template) {
        throw new Error(`Template não encontrado para ${pageId}`);
      }

      const sheetNames = template.sheets?.map(s => s.name) || [];
      if (sheetNames.length === 0) {
        throw new Error(`Nenhuma aba definida no template para ${pageId}`);
      }

      console.log(`[DataContext] Syncing Google Sheets for ${pageId}...`);
      const data = await fetchGoogleSheetData(pageId, sheetNames);
      
      // Salva com dataSource='googlesheets'
      await setData(pageId, data, `Google Sheets (${pageId})`, 'googlesheets');
      
      console.log(`[DataContext] Google Sheets synced successfully for ${pageId}`);
    } catch (error) {
      console.error(`[DataContext] Error syncing Google Sheets for ${pageId}:`, error);
      throw error;
    } finally {
      setIsSyncing(prev => ({ ...prev, [pageId]: false }));
    }
  };

  return (
    <DataContext.Provider value={{ 
      getData, 
      setData, 
      clearData, 
      getUploadInfo, 
      getPageCompleteness, 
      isLoading, 
      refreshData,
      dataSource,
      setDataSource,
      syncFromGoogleSheets,
      isSyncing
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
