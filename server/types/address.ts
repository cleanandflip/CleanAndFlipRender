import { z } from "zod";

export const AddressSchema = z.object({
  id: z.string().uuid().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  street1: z.string().min(1, "Street address is required"),
  street2: z.string().optional().nullable(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(3, "Postal code is required"),
  country: z.string().min(2).default("US"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isDefault: z.boolean().optional()
});

export type AddressDTO = z.infer<typeof AddressSchema>;

// Transform database address to DTO
export function toAddressDTO(addr: any): AddressDTO {
  return {
    id: addr.id,
    firstName: addr.firstName || addr.first_name || "",
    lastName: addr.lastName || addr.last_name || "", 
    street1: addr.street || addr.street1 || "",
    street2: addr.street2 || null,
    city: addr.city || "",
    state: addr.state || "",
    postalCode: addr.zipCode || addr.zip_code || addr.postalCode || "",
    country: addr.country || "US",
    latitude: addr.latitude ? Number(addr.latitude) : undefined,
    longitude: addr.longitude ? Number(addr.longitude) : undefined,
    isDefault: Boolean(addr.isDefault || addr.is_default)
  };
}