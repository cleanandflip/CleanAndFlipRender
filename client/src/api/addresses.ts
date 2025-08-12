export type Address = {
  id?: string;
  firstName: string; 
  lastName: string; 
  email: string; 
  phone?: string;
  street1: string; 
  street2?: string; 
  city: string; 
  state: string;
  postalCode: string; 
  country: string; 
  isDefault?: boolean;
};

export async function fetchDefaultAddress(): Promise<Address | null> {
  const res = await fetch("/api/addresses?default=true", { credentials: "include" });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.[0] ?? null;
}

export async function saveAddress(addr: Address): Promise<void> {
  await fetch("/api/addresses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ address: addr, setDefault: true }),
  });
}