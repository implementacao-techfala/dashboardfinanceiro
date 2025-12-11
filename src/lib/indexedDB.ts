// IndexedDB utility for storing dashboard data

const DB_NAME = 'DashboardDB';
const DB_VERSION = 1;
const STORE_NAME = 'pageData';

export interface PageData {
  pageId: string;
  data: any; // Can be any[] or Record<string, any[]>
  uploadedAt: Date;
  fileName: string;
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

export const savePageData = async (pageId: string, data: any, fileName: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const pageData: PageData = {
      pageId,
      data,
      uploadedAt: new Date(),
      fileName
    };

    console.log('[IndexedDB] Saving data:', { pageId, fileName, dataKeys: typeof data === 'object' ? Object.keys(data) : 'array' });

    const request = store.put(pageData);
    request.onerror = () => {
      console.error('[IndexedDB] Error saving:', request.error);
      reject(request.error);
    };
    request.onsuccess = () => {
      console.log('[IndexedDB] Data saved successfully for', pageId);
      resolve();
    };
  });
};

export const getPageData = async (pageId: string): Promise<PageData | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(pageId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
};

export const deletePageData = async (pageId: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(pageId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getAllPageData = async (): Promise<PageData[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
};
