/**
 * Unified Address Schema - Single source of truth for all address validation
 * Used across signup, onboarding, profile, checkout, and cart
 */

import { z } from 'zod';

// Base address schema used everywhere
export const AddressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required').max(2, 'State must be 2 characters'),
  postalCode: z.string().min(5, 'ZIP code is required'),
  country: z.string().default('US'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  geoapifyPlaceId: z.string().optional(),
  label: z.string().optional()
});

// Extended schema for forms that include name and contact info
export const AddressWithContactSchema = AddressSchema.extend({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required').optional(),
  phone: z.string().optional()
});

// Checkout-specific schema
export const CheckoutAddressSchema = AddressWithContactSchema.extend({
  street2: z.string().optional(),
  isDefault: z.boolean().default(false),
  saveToProfile: z.boolean().default(true)
});

// Type exports
export type AddressData = z.infer<typeof AddressSchema>;
export type AddressWithContact = z.infer<typeof AddressWithContactSchema>;
export type CheckoutAddress = z.infer<typeof CheckoutAddressSchema>;

// Transform helpers for different API formats
export const transformToCheckoutFormat = (address: any): CheckoutAddress => ({
  firstName: address.firstName || '',
  lastName: address.lastName || '',
  email: address.email || '',
  phone: address.phone || '',
  street: address.street || '',
  street2: '',
  city: address.city || '',
  state: address.state || '',
  postalCode: address.postalCode || address.zipCode || '',
  country: address.country || 'US',
  latitude: address.latitude,
  longitude: address.longitude,
  geoapifyPlaceId: address.geoapifyPlaceId,
  isDefault: address.isDefault || false,
  saveToProfile: true
});

export const transformFromGeoapify = (result: any): Partial<AddressData> => ({
  street: result.housenumber ? `${result.housenumber} ${result.street}` : result.street || result.name || result.address_line1,
  city: result.city || result.county,
  state: result.state_code || result.state,
  postalCode: result.postcode,
  country: result.country_code?.toUpperCase() || 'US',
  latitude: result.lat ? parseFloat(result.lat) : undefined,
  longitude: result.lon ? parseFloat(result.lon) : undefined,
  geoapifyPlaceId: result.place_id
});