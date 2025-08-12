// Centralized, typed API for cart operations
export type AddCartPayload = {
  productId: string;
  variantId?: string;
  quantity?: number;
};

export type UpdateCartPayload = {
  itemId: string;
  quantity: number; // 0 will delete
};

async function json<T>(res: Response): Promise<T> {
  const txt = await res.text();
  return txt ? JSON.parse(txt) : ({} as any);
}

export const cartApi = {
  async get() {
    const res = await fetch("/api/cart", {
      credentials: "include",
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });
    if (!res.ok) throw new Error(`Get cart failed ${res.status}: ${await res.text()}`);
    return json(res);
  },

  async add({ productId, variantId, quantity = 1 }: AddCartPayload) {
    const res = await fetch("/api/cart", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, variantId, quantity }),
    });
    if (!res.ok) throw new Error(`Add to cart failed ${res.status}: ${await res.text()}`);
    return json(res);
  },

  async update({ itemId, quantity }: UpdateCartPayload) {
    const method = quantity === 0 ? "DELETE" : "PUT";
    const res = await fetch(`/api/cart/${itemId}`, {
      method,
      credentials: "include",
      headers: quantity === 0 ? {} : { "Content-Type": "application/json" },
      body: quantity === 0 ? undefined : JSON.stringify({ quantity }),
    });
    if (!res.ok) throw new Error(`Update cart failed ${res.status}: ${await res.text()}`);
    return json(res);
  },

  async remove(itemId: string) {
    const res = await fetch(`/api/cart/${itemId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Remove cart item failed ${res.status}: ${await res.text()}`);
    return json(res);
  },
};