import { useQuery } from "@tanstack/react-query";
// Import addresses API - using the existing endpoint
const getAddresses = async () => {
  const response = await fetch('/api/addresses');
  if (!response.ok) throw new Error('Failed to fetch addresses');
  return response.json();
};
import { useAuth } from "@/hooks/use-auth";

export function useAddresses() {
  const { user, isLoading: userLoading } = useAuth();
  
  const addrsQ = useQuery({
    queryKey: ["addresses"],
    queryFn: getAddresses,
    enabled: !!user,
  });

  const addresses = addrsQ.data ?? [];
  const defaultAddress = addresses.find(a => a.is_default) ?? addresses[0] ?? null;
  const isLocalUser = !!defaultAddress?.is_local;

  return {
    addresses,
    defaultAddress,       // may be null when user has none
    isLocalUser,
    isLoading: userLoading || addrsQ.isLoading,
    isError: addrsQ.isError,
  };
}