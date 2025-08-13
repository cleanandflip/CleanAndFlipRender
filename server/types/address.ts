import { z } from "zod";

// SSOT AddressSchema - canonical validation for all address operations
export const AddressSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"), 
  street1: z.string().min(1, "Street address is required"),
  street2: z.string().optional().default(""),
  city: z.string().min(1, "City is required"),
  state: z.string().length(2, "State must be 2-letter code"),
  postalCode: z.string().min(5, "Postal code must be at least 5 characters").max(10),
  country: z.string().default("US"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  setAsDefault: z.boolean().optional().default(true)
});

export type AddressFormData = z.infer<typeof AddressSchema>;

// Enhanced phone validation schema (E.164 format)
export const PhoneSchema = z.string()
  .optional()
  .refine((phone) => {
    if (!phone || phone.trim() === '') return true; // Optional field
    // E.164 pattern: +?[1-9]\d{7,14}
    const phoneRegex = /^\+?[1-9]\d{7,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }, {
    message: "Phone must be valid (10-15 digits, optional + prefix)"
  });

// SSOT DTO for client-server communication
export interface AddressDTO {
  id?: string;
  userId?: string;
  firstName: string;
  lastName: string;
  fullName?: string; // Computed field
  street1: string;
  street2?: string;
  street: string; // Legacy compatibility  
  city: string;
  state: string;
  zipCode: string; // Client field name
  postalCode: string; // Server field name
  country: string;
  latitude?: number;
  longitude?: number;
  isLocal?: boolean; // Computed field
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// User DTO with address information
export interface UserWithAddressDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileAddress?: AddressDTO;
  isLocal?: boolean;
  onboardingCompleted?: boolean;
  profileComplete?: boolean;
  role?: string;
}

// Convert database row to client DTO
export function toAddressDTO(dbRow: any): AddressDTO {
  const firstName = dbRow.firstName || dbRow.first_name;
  const lastName = dbRow.lastName || dbRow.last_name;
  const zipCode = dbRow.zipCode || dbRow.zip_code;
  
  return {
    id: dbRow.id,
    userId: dbRow.userId || dbRow.user_id,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    street1: dbRow.street1 || dbRow.street,
    street2: dbRow.street2 || "",
    street: dbRow.street1 || dbRow.street, // Legacy field
    city: dbRow.city,
    state: dbRow.state,
    zipCode,
    postalCode: zipCode,
    country: dbRow.country || "US",
    latitude: dbRow.latitude ? parseFloat(dbRow.latitude) : undefined,
    longitude: dbRow.longitude ? parseFloat(dbRow.longitude) : undefined,
    isLocal: Boolean(dbRow.isLocal || dbRow.is_local),
    isDefault: Boolean(dbRow.isDefault || dbRow.is_default),
    createdAt: dbRow.createdAt || dbRow.created_at,
    updatedAt: dbRow.updatedAt || dbRow.updated_at
  };
}