import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiJson } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useLocality } from "@/hooks/useLocality";
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const key = ["cart", user?.id ?? "guest"] as const;
  
  // Track locality status changes to clean up incompatible cart items
  const prevEligibleRef = useRef<boolean | null>(null);
  const isEligible = locality?.eligible ?? false;

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
    !!(cartQuery.data as any)?.items?.some((i: any) => i.productId === productId);

  const getItemQuantity = (productId: string) =>
    (cartQuery.data as any)?.items?.find((i: any) => i.productId === productId)?.qty ?? 0;

  // Clean up local-only items when user becomes ineligible for local delivery
  useEffect(() => {
    const wasEligible = prevEligibleRef.current;
    console.log('🔄 Locality change detected:', { wasEligible, isEligible, hasCartData: !!(cartQuery.data as any)?.items });
    
    // If user switched from eligible to ineligible, remove local-only items
    const cartItems = (cartQuery.data as any)?.items;
    if (wasEligible === true && isEligible === false && cartItems) {
      const localOnlyItems = cartItems.filter((item: any) => 
        item.product?.is_local_delivery_available && !item.product?.is_shipping_available
      );
      
      console.log('🔍 Found local-only items to remove:', localOnlyItems);
      
      if (localOnlyItems.length > 0) {
        console.log('🚨 User locality changed to ineligible, removing local-only items:', localOnlyItems);
        
        // Notify user about automatic removal
        const itemNames = localOnlyItems.map((item: any) => item.product?.name).join(', ');
        toast({
          title: "Cart Updated",
          description: `Removed local-only items: ${itemNames}. These items are only available for local delivery.`,
          variant: "default",
        });
        
        // Remove each local-only item
        localOnlyItems.forEach((item: any) => {
          console.log('🗑️ Removing item:', item.productId);
          removeByProductMut.mutate(item.productId, {
            onSuccess: () => {
              console.log(`✅ Removed local-only item: ${item.product?.name}`);
            },
            onError: (error) => {
              console.error(`❌ Failed to remove item: ${item.product?.name}`, error);
            }
          });
        });
      }
    }
    
    // Update the ref to track future changes
    prevEligibleRef.current = isEligible;
  }, [isEligible, (cartQuery.data as any)?.items, removeByProductMut, toast]);

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