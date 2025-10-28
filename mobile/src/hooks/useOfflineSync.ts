import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const PENDING_MESSAGES_KEY = '@pending_messages';

interface PendingMessage {
  id: string;
  conversation_id: string;
  content: string;
  type: string;
  timestamp: string;
}

const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected ?? false;
      setIsOnline(online);

      // Auto sync when coming back online
      if (online) {
        syncPendingMessages();
      }
    });

    return () => unsubscribe();
  }, []);

  // Load pending count
  useEffect(() => {
    loadPendingCount();
  }, []);

  const loadPendingCount = async () => {
    try {
      const pending = await AsyncStorage.getItem(PENDING_MESSAGES_KEY);
      const messages: PendingMessage[] = pending ? JSON.parse(pending) : [];
      setPendingCount(messages.length);
    } catch (error) {
      console.error('Error loading pending count:', error);
    }
  };

  const addPendingMessage = async (message: PendingMessage) => {
    try {
      const pending = await AsyncStorage.getItem(PENDING_MESSAGES_KEY);
      const messages: PendingMessage[] = pending ? JSON.parse(pending) : [];
      messages.push(message);
      await AsyncStorage.setItem(PENDING_MESSAGES_KEY, JSON.stringify(messages));
      setPendingCount(messages.length);
    } catch (error) {
      console.error('Error adding pending message:', error);
    }
  };

  const getPendingMessages = async (): Promise<PendingMessage[]> => {
    try {
      const pending = await AsyncStorage.getItem(PENDING_MESSAGES_KEY);
      return pending ? JSON.parse(pending) : [];
    } catch (error) {
      console.error('Error getting pending messages:', error);
      return [];
    }
  };

  const removePendingMessage = async (messageId: string) => {
    try {
      const pending = await AsyncStorage.getItem(PENDING_MESSAGES_KEY);
      const messages: PendingMessage[] = pending ? JSON.parse(pending) : [];
      const filtered = messages.filter((msg) => msg.id !== messageId);
      await AsyncStorage.setItem(PENDING_MESSAGES_KEY, JSON.stringify(filtered));
      setPendingCount(filtered.length);
    } catch (error) {
      console.error('Error removing pending message:', error);
    }
  };

  const syncPendingMessages = async () => {
    if (isSyncing || !isOnline) return;

    setIsSyncing(true);
    try {
      const messages = await getPendingMessages();

      // TODO: Send pending messages to server
      // For now, just clear them
      await AsyncStorage.removeItem(PENDING_MESSAGES_KEY);
      setPendingCount(0);
    } catch (error) {
      console.error('Error syncing pending messages:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isOnline,
    pendingCount,
    isSyncing,
    addPendingMessage,
    getPendingMessages,
    syncPendingMessages,
  };
};

export default useOfflineSync;

