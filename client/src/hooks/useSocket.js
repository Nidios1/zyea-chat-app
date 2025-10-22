import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

const useSocket = (url = 'http://192.168.0.101:5000') => {
  const socketRef = useRef(null);

  useEffect(() => {
    console.log('Connecting to socket:', url);
    socketRef.current = io(url, {
      transports: ['websocket', 'polling']
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
        console.log('Disconnecting socket');
        socketRef.current.disconnect();
      }
    };
  }, [url]);

  return socketRef.current;
};

export default useSocket;
