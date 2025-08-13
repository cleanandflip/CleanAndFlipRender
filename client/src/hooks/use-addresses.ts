// Safe address hook (no more null destructures) - from punch list
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useAddresses() {
  const qc = useQueryClient();

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => (await fetch('/api/addresses')).json(),
    staleTime: 60_000,
    select: (data) => {
      // API SHAPE FIX: Handle {ok, data} response structure from server
      if (Array.isArray(data)) return data;
      if (data?.ok && Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data?.addresses)) return data.addresses;
      return []; // never return null/undefined/object
    }
  });

  const addresses = Array.isArray(data) ? data : [];
  const defaultAddress = addresses.find((a: any) => a.is_default) ?? null;
  const defaultAddressId = data?.defaultAddressId ?? defaultAddress?.id ?? null;

  const setDefault = useMutation({
    mutationKey: ['addresses:setDefault'],
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/addresses/${id}/default`, { method: 'POST' });
      if (!r.ok) throw new Error('Failed to set default address');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] })
  });

  const remove = useMutation({
    mutationKey: ['addresses:remove'],
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/addresses/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Delete failed');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] })
  });

  return { addresses, defaultAddress, defaultAddressId, isLoading, isFetching, error, setDefault, remove };
}