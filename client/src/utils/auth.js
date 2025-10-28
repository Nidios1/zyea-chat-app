// Mobile-safe token storage with backup
// Uses localStorage + sessionStorage + IndexedDB as fallback

const TOKEN_KEY = 'token';
const BACKUP_KEY = 'token_backup';

// IndexedDB helper
const getIndexedDB = async () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ZyeaAuth', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('auth')) {
        db.createObjectStore('auth');
      }
    };
  });
};

const saveToIndexedDB = async (token) => {
  try {
    const db = await getIndexedDB();
    const tx = db.transaction('auth', 'readwrite');
    const store = tx.objectStore('auth');
    await store.put(token, TOKEN_KEY);
    console.log('✅ Token saved to IndexedDB (backup)');
  } catch (error) {
    console.warn('⚠️ Failed to save to IndexedDB:', error);
  }
};

const getFromIndexedDB = async () => {
  try {
    const db = await getIndexedDB();
    const tx = db.transaction('auth', 'readonly');
    const store = tx.objectStore('auth');
    return await store.get(TOKEN_KEY);
  } catch (error) {
    console.warn('⚠️ Failed to read from IndexedDB:', error);
    return null;
  }
};

const removeFromIndexedDB = async () => {
  try {
    const db = await getIndexedDB();
    const tx = db.transaction('auth', 'readwrite');
    const store = tx.objectStore('auth');
    await store.delete(TOKEN_KEY);
    console.log('✅ Token removed from IndexedDB');
  } catch (error) {
    console.warn('⚠️ Failed to remove from IndexedDB:', error);
  }
};

// Sync version for backward compatibility
export const getToken = () => {
  let token = localStorage.getItem(TOKEN_KEY);
  
  if (token) {
    return token;
  }
  
  // Try sessionStorage as backup
  token = sessionStorage.getItem(TOKEN_KEY);
  if (token) {
    // Restore to localStorage
    localStorage.setItem(TOKEN_KEY, token);
    return token;
  }
  
  return null;
};

// Async version with IndexedDB backup
export const getTokenAsync = async () => {
  // Try sync first
  let token = getToken();
  if (token) return token;
  
  // Try IndexedDB
  try {
    token = await getFromIndexedDB();
    if (token) {
      // Restore to all storages
      localStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(TOKEN_KEY, token);
      return token;
    }
  } catch (error) {
    console.warn('⚠️ IndexedDB retrieval failed:', error);
  }
  
  return null;
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  
  // Try to remove from IndexedDB (fire and forget)
  removeFromIndexedDB().catch(err => {
    console.warn('⚠️ Failed to remove from IndexedDB:', err);
  });
};

export const setToken = (token) => {
  // Save to localStorage and sessionStorage synchronously
  localStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(TOKEN_KEY, token);
  
  // Save to IndexedDB asynchronously (fire and forget)
  saveToIndexedDB(token).catch(err => {
    console.warn('⚠️ Failed to save to IndexedDB:', err);
  });
};
