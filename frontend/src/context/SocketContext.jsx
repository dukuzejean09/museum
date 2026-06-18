import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useVisitor } from './VisitorContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

export const SocketProvider = ({ children }) => {
  const { admin, token: adminToken } = useAuth();
  const { token: visitorToken } = useVisitor();
  const [connected, setConnected] = useState(false);
  const [connectionCount, setConnectionCount] = useState(0);
  const socketRef = useRef(null);
  const listenersRef = useRef(new Map()); // event -> Set<callback>

  // Determine auth for socket connection
  const getAuth = useCallback(() => {
    if (adminToken && admin) {
      return { token: adminToken, type: 'admin' };
    }
    if (visitorToken) {
      return { token: visitorToken, type: 'visitor' };
    }
    return {};
  }, [adminToken, admin, visitorToken]);

  // Connect/reconnect socket
  useEffect(() => {
    const auth = getAuth();

    const socket = io(SOCKET_URL, {
      auth,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('stats:connections', ({ count }) => {
      setConnectionCount(count);
    });

    // Re-attach all registered listeners to new socket
    for (const [event, callbacks] of listenersRef.current) {
      for (const cb of callbacks) {
        socket.on(event, cb);
      }
    }

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [adminToken, visitorToken, admin]);

  // Subscribe to a socket event - returns unsubscribe function
  const on = useCallback((event, callback) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event).add(callback);

    // Attach to current socket if connected
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }

    // Return unsubscribe function
    return () => {
      listenersRef.current.get(event)?.delete(callback);
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
    };
  }, []);

  // Emit an event
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  // Join an entity room (e.g., to get updates for a specific exhibition)
  const joinEntity = useCallback((type, id) => {
    emit('join:entity', { type, id });
    return () => emit('leave:entity', { type, id });
  }, [emit]);

  return (
    <SocketContext.Provider value={{
      connected,
      connectionCount,
      on,
      emit,
      joinEntity,
      socket: socketRef.current,
    }}>
      {children}
    </SocketContext.Provider>
  );
};
