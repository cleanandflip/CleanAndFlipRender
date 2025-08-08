// COMPLETE WEBSOCKET HOOK WITH CONNECTION STATUS AND LIVE SYNC
import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp: string;
  sourceClient?: string;
}

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const messageQueue = useRef<any[]>([]);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;
    
    setStatus('connecting');
    console.log('🔄 Connecting to WebSocket...');
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setStatus('connected');
        setReconnectAttempts(0);
        console.log('✅ WebSocket connected successfully');
        
        // Send authentication if user is logged in
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user.id) {
              ws.current?.send(JSON.stringify({
                type: 'auth',
                userId: user.id,
                role: user.role || 'user'
              }));
            }
          } catch (e) {
            console.log('No valid user data for auth');
          }
        }
        
        // Send queued messages
        while (messageQueue.current.length > 0) {
          const msg = messageQueue.current.shift();
          ws.current?.send(JSON.stringify(msg));
        }
        
        toast({
          title: "Live Sync Active",
          description: "Real-time updates enabled",
        });
      };

      ws.current.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(data);
          handleMessage(data);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      ws.current.onclose = (event) => {
        setStatus('disconnected');
        console.log(`❌ WebSocket disconnected: ${event.code} - ${event.reason}`);
        
        // Auto-reconnect with exponential backoff (max 30 seconds)
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        setReconnectAttempts(prev => prev + 1);
        
        reconnectTimeout.current = setTimeout(() => {
          console.log(`🔄 Reconnecting... (attempt ${reconnectAttempts + 1})`);
          connect();
        }, delay);
      };

      ws.current.onerror = (error) => {
        setStatus('error');
        console.error('❌ WebSocket error:', error);
      };
      
    } catch (error) {
      setStatus('error');
      console.error('❌ WebSocket connection failed:', error);
    }
  }, [reconnectAttempts]);

  const handleMessage = (data: WebSocketMessage) => {
    console.log('📨 WebSocket message:', data.type, data);
    
    // Dispatch custom events for different update types
    switch (data.type) {
      case 'connection':
        if (data.status === 'connected') {
          console.log('🔗 Connection confirmed');
        }
        break;
        
      case 'product_update':
        window.dispatchEvent(new CustomEvent('refresh_products', { detail: data }));
        if (data.sourceClient) {
          toast({
            title: "Products Updated",
            description: "Product data synchronized",
          });
        }
        break;
        
      case 'category_update':
        window.dispatchEvent(new CustomEvent('refresh_categories', { detail: data }));
        if (data.sourceClient) {
          toast({
            title: "Categories Updated", 
            description: "Category data synchronized",
          });
        }
        break;
        
      case 'user_update':
        window.dispatchEvent(new CustomEvent('refresh_users', { detail: data }));
        if (data.sourceClient) {
          toast({
            title: "Users Updated",
            description: "User data synchronized",
          });
        }
        break;
        
      case 'submission_update':
        window.dispatchEvent(new CustomEvent('refresh_submissions', { detail: data }));
        if (data.sourceClient) {
          toast({
            title: "Submissions Updated",
            description: "Submission data synchronized",
          });
        }
        break;
        
      case 'wishlist_update':
        window.dispatchEvent(new CustomEvent('refresh_wishlist', { detail: data }));
        break;
        
      case 'order_update':
        window.dispatchEvent(new CustomEvent('refresh_orders', { detail: data }));
        break;
        
      case 'stripe_sync_complete':
        window.dispatchEvent(new CustomEvent('refresh_stripe', { detail: data }));
        toast({
          title: "Stripe Sync Complete",
          description: "Payment data synchronized",
        });
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const send = useCallback((data: any) => {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(message);
      console.log('📤 Sent message:', data.type || 'unknown');
    } else {
      // Queue message if not connected
      console.log('📋 Queuing message (not connected):', data.type);
      messageQueue.current.push(data);
      
      // Try to reconnect if disconnected
      if (status === 'disconnected') {
        connect();
      }
    }
  }, [status, connect]);

  useEffect(() => {
    connect();

    return () => {
      console.log('🧹 Cleaning up WebSocket');
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  return { 
    send, 
    status,
    isConnected: status === 'connected',
    reconnectAttempts,
    lastMessage
  };
}
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