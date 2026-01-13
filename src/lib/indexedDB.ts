// IndexedDB utility for storing dashboard data

const DB_NAME = 'DashboardDB';
const DB_VERSION = 1;
const STORE_NAME = 'pageData';

export interface PageData {
  pageId: string;
  data: any; // Can be any[] or Record<string, any[]>
  uploadedAt: Date;
  fileName: string;
  dataSource?: 'file' | 'googlesheets'; // Fonte dos dados
}

let dbInstance: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;

      dbInstance.onclose = () => {
        console.warn('[IndexedDB] Conexão fechada. Limpando instância...');
        dbInstance = null;
      };

      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'pageId' });
      }
    };
  });
};

// Retry wrapper para lidar com conexões fechadas
const runWithRetry = async <T>(operation: (db: IDBDatabase) => Promise<T>): Promise<T> => {
  try {
    const db = await initDB();
    return await operation(db);
  } catch (error: any) {
    const errorMsg = error?.message || '';
    // Verifica erros relacionados a conexão fechada
    if (
      errorMsg.includes('closing') ||
      error.name === 'InvalidStateError' ||
      errorMsg.includes('transaction')
    ) {
      console.warn('[IndexedDB] Erro de conexão detectado. Tentando recuperar...', error);
      dbInstance = null; // Força recriar conexão
      const db = await initDB();
      return await operation(db);
    }
    throw error;
  }
};

export const savePageData = async (pageId: string, data: any, fileName: string, dataSource?: 'file' | 'googlesheets'): Promise<void> => {
  return runWithRetry(async (db) => {
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const pageData: PageData = {
          pageId,
          data,
          uploadedAt: new Date(),
          fileName,
          dataSource
        };

        console.log('[IndexedDB] Saving data:', { pageId, fileName });

        const request = store.put(pageData);
        request.onerror = () => {
          console.error('[IndexedDB] Error saving:', request.error);
          reject(request.error);
        };
        request.onsuccess = () => {
          console.log('[IndexedDB] Data saved successfully for', pageId);
          resolve();
        };
      } catch (e) {
        reject(e); // Captura erro síncrono na criação da transação
      }
    });
  });
};

export const getPageData = async (pageId: string): Promise<PageData | null> => {
  return runWithRetry(async (db) => {
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(pageId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
      } catch (e) {
        reject(e);
      }
    });
  });
};

export const deletePageData = async (pageId: string): Promise<void> => {
  return runWithRetry(async (db) => {
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(pageId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      } catch (e) {
        reject(e);
      }
    });
  });
};

export const getAllPageData = async (): Promise<PageData[]> => {
  return runWithRetry(async (db) => {
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || []);
      } catch (e) {
        reject(e);
      }
    });
  });
};
