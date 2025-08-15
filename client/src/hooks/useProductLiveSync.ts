import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocketState } from "@/hooks/useWebSocketState";

type Opts = { queryKey: any[]; productId?: string };

export function useProductLiveSync({ queryKey, productId }: Opts) {
  const { subscribe } = useWebSocketState();
  const queryClient = useQueryClient();

  useEffect(() => {
    const offUpdate = subscribe("product:update", (payload: any) => {
      console.log('🔄 Live sync: Product update received', payload);
      console.log('🔄 Current queryKey:', queryKey);
      console.log('🔄 Matching productId:', productId, 'vs payload ids:', payload?.id, payload?.productId);
      
      if (!productId || payload?.id === productId || payload?.productId === productId) {
        console.log('🔥 INVALIDATING QUERIES due to product update');
        
        // Force invalidate ALL product-related queries with zero tolerance for stale data
        queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["products:featured"] });
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        queryClient.invalidateQueries({ queryKey: ["/api/products/featured"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
        queryClient.invalidateQueries({ queryKey });
        
        // If specific product ID, invalidate that too
        if (payload?.id) {
          queryClient.invalidateQueries({ queryKey: ["product", payload.id] });
          queryClient.invalidateQueries({ queryKey: ["/api/products", payload.id] });
        }
        
        // Force immediate refetch for critical queries
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
  }, [subscribe, JSON.stringify(queryKey), productId, queryClient]);
}