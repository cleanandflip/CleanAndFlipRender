import { useQuery } from "@tanstack/react-query";
import React from "react";

export function useLocality() {
  const { data: locality, refetch } = useQuery({
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
    staleTime: 0, // Always fresh for immediate locality updates
    refetchOnWindowFocus: true,
    refetchInterval: 5_000, // Check every 5 seconds for address changes
    refetchOnMount: true, // Always refetch on component mount
    retry: false // Don't retry on auth failures
  });

  // Listen for address updates and refetch immediately
  React.useEffect(() => {
    const handleAddressUpdate = () => {
      refetch();
    };

    // Listen for address changes
    window.addEventListener('addressUpdated', handleAddressUpdate);
    window.addEventListener('defaultAddressChanged', handleAddressUpdate);
    
    return () => {
      window.removeEventListener('addressUpdated', handleAddressUpdate);
      window.removeEventListener('defaultAddressChanged', handleAddressUpdate);
    };
  }, [refetch]);

  return { data: locality };
}