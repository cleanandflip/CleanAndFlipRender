import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cacheManager } from "@/lib/cache-manager";

export function useRealtimeSync() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Create WebSocket connection for real-time updates
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}`;
    
    let ws: WebSocket;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('WebSocket connected for real-time sync');
          reconnectAttempts = 0;
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Received real-time update:', data);
            
            switch (data.type) {
              case 'product-updated':
                // Invalidate all queries containing this product
                cacheManager.refreshProduct(queryClient, data.productId);
                break;
                
              case 'wishlist-updated':
                queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
                break;
                
              case 'cart-updated':
                queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
                break;
                
              case 'price-changed':
                // Force refresh all product-related data
                cacheManager.invalidateProductCaches(queryClient);
                break;
                
              case 'inventory-updated':
                // Refresh product data for stock levels
                queryClient.invalidateQueries({ queryKey: ["/api/products"] });
                break;
                
              default:
                console.log('Unknown real-time event type:', data.type);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          
          // Attempt to reconnect if it wasn't a deliberate close
          if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);
            setTimeout(connect, reconnectDelay);
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
        
      } catch (error) {
        console.error('Failed to establish WebSocket connection:', error);
      }
    };

    // Initialize connection
    connect();
    
    // Cleanup on unmount
    return () => {
      if (ws) {
        ws.close(1000, 'Component unmounting');
      }
    };
  }, [queryClient]);
  
  // Additional custom event listeners for cross-tab communication
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'cache-invalidate') {
        const data = JSON.parse(event.newValue || '{}');
        
        switch (data.type) {
          case 'products':
            cacheManager.invalidateProductCaches(queryClient);
            break;
          case 'wishlist':
            queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
            break;
          case 'cart':
            queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
            break;
          case 'all':
            cacheManager.resetAllCaches(queryClient);
            break;
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [queryClient]);
}

// Utility function to trigger cache invalidation across tabs
export const triggerCacheInvalidation = (type: 'products' | 'wishlist' | 'cart' | 'all') => {
  localStorage.setItem('cache-invalidate', JSON.stringify({ 
    type, 
    timestamp: Date.now() 
  }));
  
  // Remove the item after a short delay to allow other tabs to read it
  setTimeout(() => {
    localStorage.removeItem('cache-invalidate');
  }, 100);
};