// WEBSOCKET HOOK FOR LIVE SYNC
import { useEffect, useRef, useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp: string;
}

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected for live sync');
    };

    ws.current.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);
        
        // Handle different message types
        switch (message.type) {
          case 'product_update':
            toast({
              title: "Live Update",
              description: "Product data updated in real-time",
            });
            break;
          case 'user_update':
            toast({
              title: "Live Update", 
              description: "User data updated in real-time",
            });
            break;
          case 'stripe_sync_complete':
            toast({
              title: "Sync Complete",
              description: "Stripe synchronization finished",
            });
            break;
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
      
      // Auto-reconnect after 3 seconds
      setTimeout(() => {
        console.log('Attempting WebSocket reconnection...');
        if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
          const newWs = new WebSocket(wsUrl);
          ws.current = newWs;
          
          // Re-bind event handlers
          newWs.onopen = () => {
            setIsConnected(true);
            console.log('WebSocket reconnected successfully');
          };
          
          newWs.onmessage = (event) => {
            try {
              const message: WebSocketMessage = JSON.parse(event.data);
              setLastMessage(message);
              
              // Handle different message types
              switch (message.type) {
                case 'product_update':
                  toast({
                    title: "Live Update",
                    description: "Product data updated in real-time",
                  });
                  break;
                case 'user_update':
                  toast({
                    title: "Live Update", 
                    description: "User data updated in real-time",
                  });
                  break;
                case 'stripe_sync_complete':
                  toast({
                    title: "Sync Complete",
                    description: "Stripe synchronization finished",
                  });
                  break;
              }
            } catch (error) {
              console.error('WebSocket message parse error:', error);
            }
          };
          
          newWs.onclose = () => {
            setIsConnected(false);
            console.log('WebSocket disconnected again');
          };
          
          newWs.onerror = (error) => {
            console.error('WebSocket reconnection error:', error);
            setIsConnected(false);
          };
        }
      }, 3000);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, []);

  const sendMessage = (message: Omit<WebSocketMessage, 'timestamp'>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const fullMessage: WebSocketMessage = {
        ...message,
        timestamp: new Date().toISOString()
      };
      ws.current.send(JSON.stringify(fullMessage));
    }
  };

  return {
    isConnected,
    lastMessage,
    sendMessage,
    ws: ws.current
  };
}