import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiJson } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useLocality } from "@/hooks/useLocality";

const getCart = () => apiJson("/api/cart");

const addToCartApi = (p: { productId: string; qty: number; variantId?: string | null }) =>
  apiJson("/api/cart", { method: "POST", body: JSON.stringify({ ...p, variantId: p.variantId ?? null }) });

const removeByProductApi = (productId: string) =>
  apiJson(`/api/cart/product/${productId}`, { method: "DELETE" });

export function useCart() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: locality } = useLocality();
  const key = ["cart", user?.id ?? "guest", locality?.localityVersion ?? "0"] as const;

  const cartQuery = useQuery({ queryKey: key, queryFn: getCart, staleTime: 0 });

  const addToCartMut = useMutation({
    mutationFn: addToCartApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: key })
  });

  const removeByProductMut = useMutation({
    mutationFn: removeByProductApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: key })
  });

  const isInCart = (productId: string) =>
    !!cartQuery.data?.items?.some((i: any) => i.productId === productId);

  const getItemQuantity = (productId: string) =>
    cartQuery.data?.items?.find((i: any) => i.productId === productId)?.qty ?? 0;

  return {
    data: cartQuery.data,
    isLoading: cartQuery.isLoading,
    isError: cartQuery.isError,

    // expected by AddToCartButton.tsx:
    addToCart: (p: { productId: string; qty: number; variantId?: string | null }) => addToCartMut.mutateAsync(p),
    removeByProduct: (productId: string) => removeByProductMut.mutateAsync(productId),
    isAddingToCart: addToCartMut.isPending,
    isRemovingByProduct: removeByProductMut.isPending,

    isInCart,
    getItemQuantity,
  };
}