import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiJson } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useLocality } from "@/hooks/useLocality";

const getCart = () => apiJson("/api/cart");

const addToCartApi = (p: { productId: string; qty: number; variantId?: string | null }) => {
  console.log('🔧 API Call: POST /api/cart with:', { ...p, variantId: p.variantId ?? null });
  return apiJson("/api/cart", { 
    method: "POST", 
    body: JSON.stringify({ ...p, variantId: p.variantId ?? null }),
    headers: { 'Content-Type': 'application/json' }
  });
};

const removeByProductApi = (productId: string) =>
  apiJson(`/api/cart/product/${productId}`, { method: "DELETE" });

// Add updateCartItem API for quantity changes
const updateCartItemApi = (p: { productId: string; qty: number }) =>
  apiJson(`/api/cart/product/${p.productId}`, { 
    method: "PATCH", 
    body: JSON.stringify({ qty: p.qty }) 
  });

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

  const updateCartItemMut = useMutation({
    mutationFn: updateCartItemApi,
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

    // expected by AddToCartButton.tsx and CartPage:
    addToCart: (p: { productId: string; qty: number; variantId?: string | null }) => addToCartMut.mutateAsync(p),
    removeByProduct: (productId: string) => removeByProductMut.mutateAsync(productId),
    updateCartItem: (p: { productId: string; qty: number }) => updateCartItemMut.mutateAsync(p),
    isAddingToCart: addToCartMut.isPending,
    isRemovingByProduct: removeByProductMut.isPending,
    isUpdatingCartItem: updateCartItemMut.isPending,

    isInCart,
    getItemQuantity,
  };
}