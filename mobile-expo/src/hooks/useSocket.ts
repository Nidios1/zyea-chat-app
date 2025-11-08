import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';

const useSocket = () => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!user || !token) {
      // Clean up if no user/token
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Initialize socket with reconnection settings
    const newSocket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'], // Try both transports
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxReconnectAttempts,
      timeout: 20000,
      forceNew: false,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
    reconnectAttemptsRef.current = 0;

    // Connection event
    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setIsConnected(true);
      reconnectAttemptsRef.current = 0; // Reset attempts on successful connection
      
      // Join user's room
      newSocket.emit('join', user.id);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('⚠️ Socket disconnected:', reason);
      setIsConnected(false);
      
      // If disconnect was not intentional, try to reconnect
      if (reason === 'io server disconnect') {
        // Server disconnected the socket, try to reconnect manually
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      reconnectAttemptsRef.current += 1;
      console.error('❌ Socket connection error:', error);
      console.error('Error details:', {
        message: error.message,
        type: error.type,
        description: error.description,
        attempts: reconnectAttemptsRef.current,
      });
      setIsConnected(false);
      
      // If max attempts reached, wait longer before retrying
      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.warn(`⚠️ Max reconnection attempts (${maxReconnectAttempts}) reached. Waiting 10 seconds before retrying...`);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current = 0;
          if (socketRef.current && !socketRef.current.connected) {
            console.log('🔄 Retrying socket connection...');
            socketRef.current.connect();
          }
        }, 10000);
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Socket reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Socket reconnection attempt ${attemptNumber}/${maxReconnectAttempts}`);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('❌ Socket reconnection error:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed after all attempts');
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      setIsConnected(false);
    });

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
    };
  }, [user, token]);

  // Helper function to wait for socket connection
  const waitForConnection = (timeout: number = 10000): Promise<boolean> => {
    return new Promise((resolve) => {
      if (socketRef.current?.connected) {
        resolve(true);
        return;
      }

      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (socketRef.current?.connected) {
          clearInterval(checkInterval);
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          resolve(false);
        }
      }, 100);
    });
  };

  return {
    socket,
    isConnected,
    waitForConnection,
    emit: (event: string, data: any) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit(event, data);
      } else {
        console.warn(`⚠️ Cannot emit ${event}: socket not connected`);
      }
    },
    on: (event: string, callback: (...args: any[]) => void) => {
      if (socketRef.current) {
        socketRef.current.on(event, callback);
      }
    },
    off: (event: string, callback?: (...args: any[]) => void) => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
    },
  };
};

export default useSocket;

