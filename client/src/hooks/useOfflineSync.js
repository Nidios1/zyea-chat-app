import { useState, useEffect, useCallback } from 'react';
import offlineStorage from '../utils/offlineStorage';

// Hook for handling offline synchronization
export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger sync when coming back online
      syncPendingData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor pending messages count
  useEffect(() => {
    const updatePendingCount = async () => {
      try {
        const pendingMessages = await offlineStorage.getPendingMessages();
        setPendingCount(pendingMessages.length);
      } catch (error) {
        console.error('Error getting pending messages count:', error);
      }
    };

    updatePendingCount();
    
    // Update count every 30 seconds
    const interval = setInterval(updatePendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sync pending data when online
  const syncPendingData = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    
    try {
      const pendingMessages = await offlineStorage.getPendingMessages();
      
      for (const message of pendingMessages) {
        try {
          const response = await fetch('/api/chat/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${message.token}`
            },
            body: JSON.stringify(message.data)
          });

          if (response.ok) {
            await offlineStorage.removePendingMessage(message.id);
            console.log('Message synced successfully:', message.id);
          }
        } catch (error) {
          console.error('Failed to sync message:', error);
        }
      }

      // Update pending count after sync
      const updatedPending = await offlineStorage.getPendingMessages();
      setPendingCount(updatedPending.length);

    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  // Save message for offline sync
  const saveMessageForSync = useCallback(async (messageData, token) => {
    try {
      await offlineStorage.savePendingMessage({
        data: messageData,
        token: token
      });
      
      // Update pending count
      const pendingMessages = await offlineStorage.getPendingMessages();
      setPendingCount(pendingMessages.length);
      
      // Try to sync immediately if online
      if (isOnline) {
        syncPendingData();
      }
    } catch (error) {
      console.error('Failed to save message for sync:', error);
    }
  }, [isOnline, syncPendingData]);

  // Background sync registration
  useEffect(() => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        // Register background sync for messages
        registration.sync.register('send-message').catch((error) => {
          console.log('Background sync registration failed:', error);
        });
      });
    }
  }, []);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    syncPendingData,
    saveMessageForSync
  };
};
