import { useEffect } from "react";
import { useWebSocketState } from "@/hooks/useWebSocketState";
import { queryClient } from "@/lib/queryClient";

type Opts = { queryKey: any[]; productId?: string };

export function useProductLiveSync({ queryKey, productId }: Opts) {
  const { subscribe } = useWebSocketState();

  useEffect(() => {
    const offUpdate = subscribe("product:update", (payload: any) => {
      console.log('🔄 Live sync: Product update received', payload);
      console.log('🔄 Current queryKey:', queryKey);
      console.log('🔄 Matching productId:', productId, 'vs payload ids:', payload?.id, payload?.productId);
      
      if (!productId || payload?.id === productId || payload?.productId === productId) {
        console.log('🔥 INVALIDATING QUERIES due to product update');
        queryClient.invalidateQueries({ queryKey });
        
        // ALWAYS invalidate featured products on any product update
        queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
        queryClient.refetchQueries({ queryKey: ['/api/products/featured'] });
      }
    });
    const offCreate = subscribe("product:create", () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
    });
    const offDelete = subscribe("product:delete", () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
    });
    return () => {
      offUpdate?.(); offCreate?.(); offDelete?.();
    };
  }, [subscribe, JSON.stringify(queryKey), productId]);
}