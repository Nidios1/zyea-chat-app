import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';

const useSocket = () => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user || !token) {
      return;
    }

    // Initialize socket
    const newSocket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection event
    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      
      // Join user's room
      newSocket.emit('join', user.id);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Cleanup
    return () => {
      newSocket.close();
      socketRef.current = null;
      setSocket(null);
    };
  }, [user, token]);

  return {
    socket,
    isConnected,
    emit: (event: string, data: any) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit(event, data);
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

