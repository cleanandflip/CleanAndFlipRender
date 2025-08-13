import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { apiRequest } from "@/lib/queryClient";

type Product = {
  id: string;
  name: string;
  price: string | number;
  stockQuantity?: number;
};

function optimisticAdd(oldCart: any, product: Product) {
  if (!oldCart) return { items: [{ productId: product.id, quantity: 1, product }] };
  
  const existingItem = oldCart.items?.find((item: any) => item.productId === product.id);
  if (existingItem) {
    return {
      ...oldCart,
      items: oldCart.items.map((item: any) =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ),
    };
  }
  
  return {
    ...oldCart,
    items: [...(oldCart.items || []), { productId: product.id, quantity: 1, product }],
  };
}

function optimisticRemove(oldCart: any, productId: string) {
  if (!oldCart) return { items: [] };
  
  return {
    ...oldCart,
    items: oldCart.items?.filter((item: any) => item.productId !== productId) || [],
  };
}

export default function AddToCartButton({ product }: { product: Product }) {
  const qc = useQueryClient();
  const { cart } = useCart();
  const inCart = !!cart?.items?.some((i: any) => i.productId === product.id);

  const addM = useMutation({
    mutationFn: () => apiRequest("/api/cart", {
      method: 'POST',
      body: JSON.stringify({ productId: product.id, quantity: 1 })
    }),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["/api/cart"] });
      const prev = qc.getQueryData(["/api/cart"]);
      qc.setQueryData(["/api/cart"], (old: any) => optimisticAdd(old, product));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["/api/cart"], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const removeM = useMutation({
    mutationFn: () => apiRequest(`/api/cart/items/${product.id}`, {
      method: 'DELETE'
    }),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["/api/cart"] });
      const prev = qc.getQueryData(["/api/cart"]);
      qc.setQueryData(["/api/cart"], (old: any) => optimisticRemove(old, product.id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["/api/cart"], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  return (
    <div className="relative">
      {!inCart ? (
        <Button
          className="btn btn-primary w-full bg-blue-600 hover:bg-blue-700"
          onClick={() => addM.mutate()}
          disabled={addM.isPending || (product.stockQuantity !== undefined && product.stockQuantity <= 0)}
          aria-label="Add to cart"
          data-testid="button-add-to-cart"
        >
          {addM.isPending ? "Adding…" : "Add to Cart"}
        </Button>
      ) : (
        <Button
          className="btn w-full bg-green-600 hover:bg-green-700 text-white"
          disabled
          aria-label="In cart"
          data-testid="button-in-cart"
        >
          In Cart
        </Button>
      )}

      {inCart && (
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-red-600 hover:bg-red-700 text-white
                     flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
          title="Remove from cart"
          onClick={(e) => {
            e.stopPropagation();
            removeM.mutate();
          }}
          data-testid="button-remove-from-cart"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}