import { apiJson } from "@/lib/api";

export async function addToCartApi(opts: { productId: string; qty: number; variantId?: string | null }) {
  try {
    return await apiJson<{ ok: boolean; status: string; qty: number; available: number; warning?: string }>(
      "/api/cart",
      { method: "POST", body: JSON.stringify(opts) }
    );
  } catch (e: any) {
    // Graceful fallback during rollout if V2 path not wired yet on env
    if (e?.status === 404) {
      return await apiJson<any>("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId: opts.productId, quantity: opts.qty, variantId: opts.variantId ?? null }),
      });
    }
    throw e;
  }
}

export async function deleteByProduct(productId: string) {
  return apiJson<{ ok: boolean }>(`/api/cart/product/${productId}`, { method: "DELETE" });
}