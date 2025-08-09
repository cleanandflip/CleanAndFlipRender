// COMPLETE FIXED WEBSOCKET HOOK - NO SYNTAX ERRORS
import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface WebSocketMessage {
  type: string;
  action?: string;
  timestamp?: string;
  [key: string]: any;
}

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const messageQueue = useRef<WebSocketMessage[]>([]);
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
        console.log('✅ WebSocket connected');
        
        // Send authentication
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user?.id) {
              ws.current?.send(JSON.stringify({
                type: 'auth',
                userId: user.id,
                role: user.role
              }));
            }
          } catch (e) {
            console.error('Failed to parse user data:', e);
          }
        }
        
        // Send queued messages
        while (messageQueue.current.length > 0) {
          const msg = messageQueue.current.shift();
          if (msg) {
            ws.current?.send(JSON.stringify(msg));
          }
        }

        // Connection established - no toast needed
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          handleMessage(data);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      ws.current.onclose = (event) => {
        setStatus('disconnected');
        console.log('❌ WebSocket disconnected:', event.code, event.reason);
        
        // Auto-reconnect with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        setReconnectAttempts(prev => prev + 1);
        
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
        }
        
        reconnectTimeout.current = setTimeout(() => {
          if (reconnectAttempts < 5) { // Limit reconnection attempts
            console.log(`Reconnecting... (attempt ${reconnectAttempts + 1})`);
            connect();
          }
        }, delay);
      };

      ws.current.onerror = (error) => {
        setStatus('error');
        console.error('WebSocket error:', error);
      };
      
    } catch (error) {
      setStatus('error');
      console.error('WebSocket connection failed:', error);
    }
  }, []); // Stable connect function - no dependencies to prevent cycling

  const handleMessage = useCallback((data: WebSocketMessage) => {
    console.log('📨 WebSocket message:', data);
    
    // Handle different message types
    switch (data.type) {
      case 'connection':
        // Connection status handled by status state - no toast needed
        break;
        
      case 'product_update':
        window.dispatchEvent(new CustomEvent('refresh_products', { detail: data }));
        // Only show toast for external updates, not self-initiated ones
        break;
        
      case 'category_update':
        window.dispatchEvent(new CustomEvent('refresh_categories', { detail: data }));
        // Only show toast for external updates, not self-initiated ones
        break;
        
      case 'user_update':
        window.dispatchEvent(new CustomEvent('refresh_users', { detail: data }));
        // Only show toast for external updates, not self-initiated ones
        break;
        
      case 'submission_update':
        window.dispatchEvent(new CustomEvent('refresh_submissions', { detail: data }));
        break;
        
      case 'wishlist_update':
        window.dispatchEvent(new CustomEvent('refresh_wishlist', { detail: data }));
        break;
        
      case 'order_update':
        window.dispatchEvent(new CustomEvent('refresh_orders', { detail: data }));
        break;
        
      case 'stripe_sync_complete':
        window.dispatchEvent(new CustomEvent('refresh_stripe', { detail: data }));
        // Stripe sync notification only when needed
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  }, []);

  const send = useCallback((data: WebSocketMessage) => {
    const message = {
      ...data,
      timestamp: new Date().toISOString()
    };
    
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      // Queue message if not connected
      messageQueue.current.push(message);
      
      // Try to reconnect if disconnected
      if (status === 'disconnected') {
        connect();
      }
    }
  }, [status]);

  useEffect(() => {
    connect();

    return () => {
      console.log('🧹 Cleaning up WebSocket');
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, []); // Empty dependency to prevent reconnection cycles

  return { 
    send,
    sendMessage: send,  // Add alias for compatibility
    status,
    isConnected: status === 'connected',
    reconnectAttempts,
    lastMessage
  };
}