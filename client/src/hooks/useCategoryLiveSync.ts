import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocketState } from './useWebSocketState';

interface CategoryLiveSyncOptions {
  queryKey?: any[];
  categoryId?: string;
}

export function useCategoryLiveSync({ queryKey = [], categoryId }: CategoryLiveSyncOptions = {}) {
  const { subscribe } = useWebSocketState();
  const queryClient = useQueryClient();

  useEffect(() => {
    const offUpdate = subscribe("category:update", (payload: any) => {
      console.log('🔄 Live sync: Category update received', payload);
      console.log('🔄 Current queryKey:', queryKey);
      console.log('🔄 Matching categoryId:', categoryId, 'vs payload ids:', payload?.id, payload?.categoryId);
      
      if (!categoryId || payload?.id === categoryId || payload?.categoryId === categoryId) {
        console.log('🔥 INVALIDATING QUERIES due to category update');
        
        // Force invalidate ALL category-related queries
        queryClient.invalidateQueries({ queryKey: ["adminCategories"] });
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
        queryClient.invalidateQueries({ queryKey: ['/api/categories', 'active'] });
        queryClient.invalidateQueries({ queryKey });
        
        // If specific category ID, invalidate that too
        if (payload?.id) {
          queryClient.invalidateQueries({ queryKey: ["category", payload.id] });
          queryClient.invalidateQueries({ queryKey: ["/api/categories", payload.id] });
        }
        
        // Force immediate refetch for critical queries
        queryClient.refetchQueries({ queryKey: ['/api/categories', 'active'] });
        queryClient.refetchQueries({ queryKey: ['/api/categories'] });
      }
    });

    const offCreate = subscribe("category:create", () => {
      console.log('🔄 Live sync: Category create received');
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['/api/categories', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.refetchQueries({ queryKey: ['/api/categories', 'active'] });
    });

    const offDelete = subscribe("category:delete", () => {
      console.log('🔄 Live sync: Category delete received');
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['/api/categories', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.refetchQueries({ queryKey: ['/api/categories', 'active'] });
    });

    return () => {
      offUpdate?.(); 
      offCreate?.(); 
      offDelete?.();
    };
  }, [subscribe, JSON.stringify(queryKey), categoryId, queryClient]);
}