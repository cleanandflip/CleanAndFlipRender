import { useQuery } from "@tanstack/react-query";

export function useLocality() {
  return useQuery({
    queryKey: ["locality"],
    queryFn: async () => {
      const r = await fetch("/api/locality/status");
      if (!r.ok) {
        // If not authenticated, return empty state instead of throwing
        if (r.status === 401) {
          return { isLocal: false, distanceMiles: null, hasAddress: false, defaultAddressId: null };
        }
        throw new Error("locality_fetch_failed");
      }
      return r.json() as Promise<{
        isLocal: boolean; 
        distanceMiles?: number; 
        hasAddress: boolean; 
        defaultAddressId?: string;
      }>;
    },
    staleTime: 2_000, // Very fresh data - 2 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 5_000, // Refetch every 5 seconds for live sync
    retry: false // Don't retry on auth failures
  });
}