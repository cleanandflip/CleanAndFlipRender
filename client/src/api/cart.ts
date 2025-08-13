import { apiRequest } from "@/lib/queryClient";
import { Address } from "./addresses";

export interface CartShippingResponse {
  ok: boolean;
  shippingAddress: Address;
}

export const cartApi = {
  // Set shipping address by ID
  setShippingAddressById: async (addressId: string): Promise<CartShippingResponse> => {
    return apiRequest(`/api/cart/shipping-address`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addressId })
    });
  },

  // Create new address and set as shipping
  createShippingAddress: async (addressData: any): Promise<Address> => {
    return apiRequest(`/api/cart/shipping-address`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addressData)
    });
  }
};