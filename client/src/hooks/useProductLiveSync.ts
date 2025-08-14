import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocketState } from "@/hooks/useWebSocketState";

export function useProductLiveSync({ queryKey, productId }: { queryKey: any; productId?: string }) {
  const qc = useQueryClient();
  const { ready, subscribe } = useWebSocketState();
  
  useEffect(() => {
    if (!ready || typeof subscribe !== "function") return;
    
    const unsub = subscribe((msg: any) => {
      const t = msg?.type || msg?.data?.type;
      const payload = msg?.payload || msg?.data?.payload;
      
      if (!t) return;
      
      if (["products.updated", "products.created", "products.deleted", "product:update", "product:create", "product:delete"].includes(t)) {
        if (!productId || payload?.id === productId || payload?.productId === productId) {
          qc.invalidateQueries({ queryKey });
        }
      }
    });
    
    return () => { 
      try { 
        unsub?.(); 
      } catch {} 
    };
  }, [ready, subscribe, qc, JSON.stringify(queryKey), productId]);
}