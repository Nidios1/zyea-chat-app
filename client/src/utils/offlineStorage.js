// Offline storage utilities for PWA
class OfflineStorage {
  constructor() {
    this.dbName = 'ZyeaOfflineDB';
    this.dbVersion = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Messages store
        if (!db.objectStoreNames.contains('messages')) {
          const messagesStore = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
          messagesStore.createIndex('conversationId', 'conversationId', { unique: false });
          messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
          messagesStore.createIndex('status', 'status', { unique: false });
        }
        
        // Pending messages store
        if (!db.objectStoreNames.contains('pendingMessages')) {
          const pendingStore = db.createObjectStore('pendingMessages', { keyPath: 'id', autoIncrement: true });
          pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Friends store
        if (!db.objectStoreNames.contains('friends')) {
          const friendsStore = db.createObjectStore('friends', { keyPath: 'id' });
          friendsStore.createIndex('status', 'status', { unique: false });
        }
        
        // User profile store
        if (!db.objectStoreNames.contains('userProfile')) {
          db.createObjectStore('userProfile', { keyPath: 'id' });
        }
      };
    });
  }

  // Messages operations
  async saveMessage(message) {
    const transaction = this.db.transaction(['messages'], 'readwrite');
    const store = transaction.objectStore('messages');
    return store.add(message);
  }

  async getMessages(conversationId, limit = 50) {
    const transaction = this.db.transaction(['messages'], 'readonly');
    const store = transaction.objectStore('messages');
    const index = store.index('conversationId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(conversationId);
      request.onsuccess = () => {
        const messages = request.result
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, limit);
        resolve(messages);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateMessageStatus(messageId, status) {
    const transaction = this.db.transaction(['messages'], 'readwrite');
    const store = transaction.objectStore('messages');
    const getRequest = store.get(messageId);
    
    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const message = getRequest.result;
        if (message) {
          message.status = status;
          const putRequest = store.put(message);
          putRequest.onsuccess = () => resolve(putRequest.result);
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Message not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Pending messages operations
  async savePendingMessage(message) {
    const transaction = this.db.transaction(['pendingMessages'], 'readwrite');
    const store = transaction.objectStore('pendingMessages');
    return store.add({
      ...message,
      timestamp: new Date().toISOString(),
      status: 'pending'
    });
  }

  async getPendingMessages() {
    const transaction = this.db.transaction(['pendingMessages'], 'readonly');
    const store = transaction.objectStore('pendingMessages');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removePendingMessage(id) {
    const transaction = this.db.transaction(['pendingMessages'], 'readwrite');
    const store = transaction.objectStore('pendingMessages');
    return store.delete(id);
  }

  // Friends operations
  async saveFriends(friends) {
    const transaction = this.db.transaction(['friends'], 'readwrite');
    const store = transaction.objectStore('friends');
    
    // Clear existing friends
    await store.clear();
    
    // Add new friends
    for (const friend of friends) {
      await store.add(friend);
    }
  }

  async getFriends() {
    const transaction = this.db.transaction(['friends'], 'readonly');
    const store = transaction.objectStore('friends');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // User profile operations
  async saveUserProfile(profile) {
    const transaction = this.db.transaction(['userProfile'], 'readwrite');
    const store = transaction.objectStore('userProfile');
    return store.put(profile);
  }

  async getUserProfile() {
    const transaction = this.db.transaction(['userProfile'], 'readonly');
    const store = transaction.objectStore('userProfile');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const profiles = request.result;
        resolve(profiles.length > 0 ? profiles[0] : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all data
  async clearAll() {
    const stores = ['messages', 'pendingMessages', 'friends', 'userProfile'];
    const transaction = this.db.transaction(stores, 'readwrite');
    
    for (const storeName of stores) {
      const store = transaction.objectStore(storeName);
      await store.clear();
    }
  }
}

// Singleton instance
const offlineStorage = new OfflineStorage();

// Initialize when module loads
offlineStorage.init().catch(console.error);

export default offlineStorage;
