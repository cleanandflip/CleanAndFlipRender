export async function addToCart({
  productId,
  variantId,
  quantity = 1,
}: { productId: string; variantId?: string; quantity?: number }) {
  const res = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // needed for guest cart cookie
    body: JSON.stringify({ productId, variantId, quantity }),
  });
  
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Add to cart failed ${res.status}: ${text || "unknown error"}`);
  }
  
  return text ? JSON.parse(text) : {};
}

export async function removeFromCart(itemId: string) {
  const res = await fetch(`/api/cart/${itemId}`, {
    method: "DELETE",
    credentials: "include",
  });
  
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Remove from cart failed ${res.status}: ${text || "unknown error"}`);
  }
  
  return text ? JSON.parse(text) : {};
}

export async function updateCartQuantity(itemId: string, quantity: number) {
  const res = await fetch(`/api/cart/${itemId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ quantity }),
  });
  
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Update cart failed ${res.status}: ${text || "unknown error"}`);
  }
  
  return text ? JSON.parse(text) : {};
}

export async function getCart() {
  const res = await fetch("/api/cart", {
    method: "GET",
    credentials: "include",
  });
  
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Get cart failed ${res.status}: ${text || "unknown error"}`);
  }
  
  return text ? JSON.parse(text) : [];
}