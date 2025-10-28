/**
 * SQLite Database Utility (Disabled for web)
 * Local database for offline storage - not available on web
 */

let db = null;

// Initialize SQLite database (no-op for web)
export const initDatabase = async () => {
  console.log('ℹ️ SQLite only available on native platforms, using fallback');
  return null;
};

// Cache messages locally (no-op for web)
export const cacheMessages = async (conversationId, messages) => {
  return;
};

// Get cached messages (empty for web)
export const getCachedMessages = async (conversationId, limit = 50) => {
  return [];
};

// Cache conversations (no-op for web)
export const cacheConversations = async (conversations) => {
  return;
};

// Get cached conversations (empty for web)
export const getCachedConversations = async () => {
  return [];
};

// Add pending operation (no-op for web)
export const addPendingOperation = async (operationType, data) => {
  return;
};

// Get pending operations (empty for web)
export const getPendingOperations = async () => {
  return [];
};

// Delete pending operation (no-op for web)
export const deletePendingOperation = async (id) => {
  return;
};

// Clear all cached data (no-op for web)
export const clearCache = async () => {
  return;
};

// Get database stats (null for web)
export const getDatabaseStats = async () => {
  return null;
};

export default {
  initDatabase,
  cacheMessages,
  getCachedMessages,
  cacheConversations,
  getCachedConversations,
  addPendingOperation,
  getPendingOperations,
  deletePendingOperation,
  clearCache,
  getDatabaseStats
};
