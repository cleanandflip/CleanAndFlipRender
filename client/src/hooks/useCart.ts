import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cartKeys } from "@/lib/cartKeys";
import { addToCartApi, deleteByProduct } from "@/lib/cartApi";
import { useLocality } from "@/hooks/useLocality";
import { useAuth } from "@/hooks/use-auth";
import { apiJson } from "@/lib/api";

export function useCart() {
  const qc = useQueryClient();
  const { data: locality, localityVersion } = useLocality();
  const { user } = useAuth();
  const key = cartKeys.scoped(user?.id ?? null, locality?.ssotVersion ?? localityVersion.toString());

  const cartQuery = useQuery({
    queryKey: key,
    queryFn: async () => await apiJson("/api/cart"),
    staleTime: 0,
  });

  const addMutation = useMutation({
    mutationFn: addToCartApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const removeByProduct = useMutation({
    mutationFn: (productId: string) => deleteByProduct(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { ...cartQuery, addMutation, removeByProduct };
}