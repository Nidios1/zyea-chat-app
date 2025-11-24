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
  const hasJoinedRef = useRef<boolean>(false); // Track if user has joined
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!user || !token) {
      // Clean up if no user/token
      if (socketRef.current) {
        console.log('🔌 Cleaning up socket: no user/token');
        socketRef.current.close();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
        hasJoinedRef.current = false;
      }
      return;
    }

    // Prevent multiple socket instances
    if (socketRef.current && socketRef.current.connected) {
      console.log('🔌 Socket already connected, skipping initialization');
      return;
    }

    // Clean up existing socket if any
    if (socketRef.current) {
      console.log('🔌 Cleaning up existing socket before creating new one');
      socketRef.current.removeAllListeners();
      socketRef.current.close();
      socketRef.current = null;
    }

    console.log('🔌 Initializing socket connection...');
    
    // Initialize socket with optimized reconnection settings for instant connection
    const newSocket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
      reconnection: true,
      reconnectionDelay: 100, // Instant reconnect (100ms for instant feel)
      reconnectionDelayMax: 1000, // Reduced max delay (1s max) - no delay
      reconnectionAttempts: maxReconnectAttempts,
      timeout: 3000, // Reduced timeout to 3s for faster connection detection
      forceNew: false,
      autoConnect: true,
      upgrade: true, // Enable transport upgrade
      // Additional optimizations for faster connection
      rememberUpgrade: true, // Remember transport upgrade
      randomizationFactor: 0.1, // Minimal randomization for instant reconnection
      // Optimize for instant connection
      withCredentials: false, // Faster connection without credentials check
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
    reconnectAttemptsRef.current = 0;
    hasJoinedRef.current = false;

    // Connection event
    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setIsConnected(true);
      reconnectAttemptsRef.current = 0; // Reset attempts on successful connection
      
      // Only join if not already joined (prevent duplicate joins)
      if (!hasJoinedRef.current && user?.id) {
        console.log(`🔌 Joining room for user ${user.id}`);
        hasJoinedRef.current = true;
        newSocket.emit('join', user.id);
      } else if (hasJoinedRef.current) {
        console.log('⚠️ User already joined, skipping duplicate join');
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('⚠️ Socket disconnected:', reason);
      setIsConnected(false);
      hasJoinedRef.current = false; // Reset join flag on disconnect
      
      // Log disconnect reason for debugging
      if (reason === 'io server disconnect') {
        console.log('📡 Server disconnected the socket, will attempt to reconnect');
        // Server disconnected the socket, try to reconnect manually
        newSocket.connect();
      } else if (reason === 'io client disconnect') {
        console.log('📱 Client intentionally disconnected');
        // Client disconnected intentionally, don't auto-reconnect
      } else if (reason === 'ping timeout') {
        console.log('⏱️ Connection timeout, will attempt to reconnect');
      } else if (reason === 'transport close') {
        console.log('🚫 Transport closed, will attempt to reconnect');
      } else if (reason === 'transport error') {
        console.log('❌ Transport error, will attempt to reconnect');
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
      
      // Re-join room after reconnection
      if (user?.id && !hasJoinedRef.current) {
        console.log(`🔌 Re-joining room for user ${user.id} after reconnect`);
        hasJoinedRef.current = true;
        newSocket.emit('join', user.id);
      }
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
      console.log('🔌 Cleaning up socket on unmount');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (socketRef.current) {
        // Remove all listeners before closing
        socketRef.current.removeAllListeners();
        socketRef.current.close();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
      hasJoinedRef.current = false;
    };
  }, [user?.id, token]); // Only depend on user.id and token to prevent unnecessary reconnects

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

