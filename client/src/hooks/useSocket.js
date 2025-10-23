import { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { getSocketUrl } from '../utils/platformConfig';

const useSocket = (url) => {
  const socketRef = useRef(null);
  // Use platformConfig if no URL provided
  const socketUrl = url || getSocketUrl();

  useEffect(() => {
    console.log('🔌 Connecting to socket:', socketUrl);
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return () => {
      if (socketRef.current) {
        console.log('🔌 Disconnecting socket');
        socketRef.current.disconnect();
      }
    };
  }, [socketUrl]);

  return socketRef.current;
};

export default useSocket;
