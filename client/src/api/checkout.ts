import type { Address, Quote } from "@/types";
import { apiJson } from "@/lib/api";

export async function getQuote(addr: Address): Promise<Quote> {
  return apiJson<Quote>("/api/checkout/quote", {
    method: "POST",
    body: JSON.stringify(addr),
  });
}