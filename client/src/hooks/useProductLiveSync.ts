import { useEffect } from "react";
import { useWebSocketState } from "@/hooks/useWebSocketState";
import { queryClient } from "@/lib/queryClient";

type Opts = { queryKey: any[]; productId?: string };

export function useProductLiveSync({ queryKey, productId }: Opts) {
  const { subscribe } = useWebSocketState();

  useEffect(() => {
    const offUpdate = subscribe("product:update", (payload: any) => {
      if (!productId || payload?.id === productId) {
        queryClient.invalidateQueries({ queryKey });
      }
    });
    const offCreate = subscribe("product:create", () =>
      queryClient.invalidateQueries({ queryKey })
    );
    const offDelete = subscribe("product:delete", () =>
      queryClient.invalidateQueries({ queryKey })
    );
    return () => {
      offUpdate?.(); offCreate?.(); offDelete?.();
    };
  }, [subscribe, JSON.stringify(queryKey), productId]);
}