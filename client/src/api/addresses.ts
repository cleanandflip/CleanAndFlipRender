/**
 * SSOT Address System API Client - Single Source of Truth
 * Handles all frontend address operations with proper validation and integration
 */

import { apiRequest } from '@/lib/queryClient';

export interface Address {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  geoapifyPlaceId?: string;
  isDefault: boolean;
  isLocal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressRequest {
  firstName: string;
  lastName: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  geoapifyPlaceId?: string;
  setDefault?: boolean;
}

export interface AddressFieldErrors {
  [key: string]: string;
}

// API helper functions that match fix list requirements
const j = async (res: Response) => {
  if (!res.ok) throw new Error(await res.text() || `${res.status}`);
  return res.json();
};

export const setDefaultAddress = async (id: string) =>
  j(await fetch(`/api/addresses/${id}/default`, { method: 'PATCH', credentials: 'include' }));

export const deleteAddress = async (id: string) =>
  j(await fetch(`/api/addresses/${id}`, { method: 'DELETE', credentials: 'include' }));

export const fetchAddresses = async () =>
  j(await fetch('/api/addresses', { credentials: 'include' }));

export interface AddressApiError {
  error: string;
  fieldErrors?: AddressFieldErrors;
  message?: string;
}

// API client for address operations
export const addressApi = {
  // Get all user addresses
  async getAddresses(): Promise<Address[]> {
    const response = await apiRequest('GET', '/api/addresses');
    const result = await response.json();
    return result.data;
  },

  // Create new address
  async createAddress(addressData: CreateAddressRequest): Promise<Address> {
    const response = await apiRequest('POST', '/api/addresses', addressData);
    const result = await response.json();
    return result.data;
  },

  // Set address as default
  async setDefaultAddress(addressId: string): Promise<{ addresses: Address[]; profileAddressId: string }> {
    const response = await apiRequest('PATCH', `/api/addresses/${addressId}/default`);
    return response.json();
  },

  // Delete address
  async deleteAddress(addressId: string): Promise<{ addresses: Address[] }> {
    const response = await apiRequest('DELETE', `/api/addresses/${addressId}`);
    return response.json();
  },

  // Get default address
  async getDefaultAddress(): Promise<Address | null> {
    try {
      const response = await apiRequest('GET', '/api/addresses/default');
      return response.json();
    } catch (error: any) {
      if (error.message?.includes('404')) {
        return null; // No default address set
      }
      throw error;
    }
  },

  // Update address (future enhancement)
  async updateAddress(addressId: string, addressData: Partial<CreateAddressRequest>): Promise<Address> {
    const response = await apiRequest('PUT', `/api/addresses/${addressId}`, addressData);
    return response.json();
  }
};

// React Query keys for addresses
export const addressQueryKeys = {
  all: ['addresses'] as const,
  lists: () => [...addressQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, any> = {}) => [...addressQueryKeys.lists(), { filters }] as const,
  details: () => [...addressQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...addressQueryKeys.details(), id] as const,
};

// Utility functions
export const addressUtils = {
  // Format address for display
  formatAddressLine(address: Address): string {
    return `${address.street1}${address.street2 ? `, ${address.street2}` : ''}, ${address.city}, ${address.state} ${address.postalCode}`;
  },

  // Format full name
  formatFullName(address: Address): string {
    return `${address.firstName} ${address.lastName}`;
  },

  // Check if address is complete
  isAddressComplete(address: Partial<CreateAddressRequest>): boolean {
    return !!(
      address.firstName &&
      address.lastName &&
      address.street1 &&
      address.city &&
      address.state &&
      address.postalCode
    );
  },

  // Validate postal code format
  validatePostalCode(postalCode: string, country: string = 'US'): boolean {
    if (country === 'US') {
      return /^\d{5}(-\d{4})?$/.test(postalCode);
    }
    return postalCode.length >= 3; // Basic validation for other countries
  },

  // Validate state code
  validateStateCode(state: string): boolean {
    return /^[A-Z]{2}$/.test(state);
  },

  // Clean and normalize address data
  normalizeAddress(address: CreateAddressRequest): CreateAddressRequest {
    return {
      ...address,
      state: address.state.toUpperCase(),
      postalCode: address.postalCode.replace(/[^\d-]/g, ''),
      firstName: address.firstName.trim(),
      lastName: address.lastName.trim(),
      street1: address.street1.trim(),
      street2: address.street2?.trim() || undefined,
      city: address.city.trim(),
    };
  }
};

export default addressApi;