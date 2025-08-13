import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useLocality() {
  return useQuery({ 
    queryKey: ["locality"], 
    queryFn: () => apiRequest("/api/locality/status")
  });
}