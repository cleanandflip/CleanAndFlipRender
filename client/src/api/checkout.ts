import type { Address } from "./addresses";

export type Quote = {
  shippingMethods: Array<{ id: string; label: string; price: number }>;
  tax: number; 
  subtotal: number; 
  total: number;
};

export async function getQuote(addr: Address): Promise<Quote> {
  const res = await fetch("/api/checkout/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ address: addr }),
  });
  if (!res.ok) throw new Error("Failed to fetch quote");
  return res.json();
}