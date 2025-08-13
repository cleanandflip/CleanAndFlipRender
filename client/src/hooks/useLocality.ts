import { useQuery } from "@tanstack/react-query";

export function useLocality() {
  return useQuery({
    queryKey: ["locality"],
    queryFn: async () => {
      const r = await fetch("/api/locality/status");
      if (!r.ok) throw new Error("locality_fetch_failed");
      return r.json() as Promise<{
        isLocal: boolean; 
        distanceMiles?: number; 
        hasAddress: boolean; 
        defaultAddressId?: string;
      }>;
    },
    staleTime: 60_000
  });
}