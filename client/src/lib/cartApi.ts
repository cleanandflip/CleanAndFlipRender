import { apiJson } from "@/lib/api";

// V2 Cart API Client - unified qty field, single endpoint pattern
export const getCart = () => apiJson("/api/cart");

export const addToCartApi = (p: { productId: string; qty: number; variantId?: string | null }) =>
  apiJson("/api/cart", { 
    method: "POST", 
    body: JSON.stringify({ 
      ...p, 
      variantId: p.variantId ?? null 
    }) 
  });

export const setQtyByProduct = (productId: string, qty: number) =>
  apiJson(`/api/cart/product/${productId}`, { 
    method: "PATCH", 
    body: JSON.stringify({ qty }) 
  });

export const removeByProduct = (productId: string) =>
  apiJson(`/api/cart/product/${productId}`, { method: "DELETE" });