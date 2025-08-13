import { useState, useEffect } from 'react';

// Singleton WebSocket connection to prevent duplicates
const socketRef = { current: null as WebSocket | null };

// Export both old and new function names for compatibility
export function useWebSocket() {
  return useSingletonSocket();
}

export function useSingletonSocket() {
  const [ready, setReady] = useState(false);
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    // Prevent duplicate connections
    if (socketRef.current) {
      setReady(socketRef.current.readyState === WebSocket.OPEN);
      setConnected(socketRef.current.readyState === WebSocket.OPEN);
      return;
    }
    
    // Create WebSocket connection
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${location.host}`;
    
    try {
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      socket.onopen = () => {
        console.log('🔌 WebSocket connected (singleton)');
        setReady(true);
        setConnected(true);
      };
      
      socket.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setReady(false);
        setConnected(false);
        socketRef.current = null;
      };
      
      socket.onerror = (error) => {
        console.error('🔌 WebSocket error:', error);
        setReady(false);
        setConnected(false);
      };
      
      return () => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
        socketRef.current = null;
        setReady(false);
        setConnected(false);
      };
    } catch (error) {
      console.error('🔌 Failed to create WebSocket:', error);
      setReady(false);
      setConnected(false);
    }
  }, []);
  
  return { 
    socket: socketRef.current, 
    ready, 
    connected 
  };
}

// Export for cleanup if needed
export function cleanupWebSocket() {
  if (socketRef.current) {
    socketRef.current.close();
    socketRef.current = null;
  }
}