// Shared fulfillment/delivery types and utilities for the comprehensive system

export type FulfillmentMode = 'LOCAL_ONLY' | 'LOCAL_AND_SHIPPING';

// Product type interface for fulfillment system
export interface ProductFulfillment {
  fulfillmentMode?: FulfillmentMode;
  isLocalDeliveryAvailable?: boolean;
  isShippingAvailable?: boolean;
}

// Legacy field mapping for backward compatibility
export function modeFromProduct(product: any): FulfillmentMode | null {
  // Primary: check for new fulfillmentMode field
  if (product?.fulfillmentMode) {
    return product.fulfillmentMode as FulfillmentMode;
  }
  
  // Fallback: derive from legacy boolean fields
  const hasLocal = product?.isLocalDeliveryAvailable || product?.is_local_delivery_available;
  const hasShipping = product?.isShippingAvailable || product?.is_shipping_available;
  
  if (hasLocal && hasShipping) {
    return 'LOCAL_AND_SHIPPING';
  } else if (hasLocal && !hasShipping) {
    return 'LOCAL_ONLY';
  } else {
    // Default fallback
    return 'LOCAL_AND_SHIPPING';
  }
}

// Get display label for a fulfillment mode
export function getFulfillmentLabel(mode: FulfillmentMode): string {
  switch (mode) {
    case 'LOCAL_ONLY':
      return 'Local delivery only';
    case 'LOCAL_AND_SHIPPING':
      return 'Local delivery & shipping';
    default:
      return 'Local delivery & shipping';
  }
}

// Validation helpers
export function isValidFulfillmentMode(mode: any): mode is FulfillmentMode {
  return mode === 'LOCAL_ONLY' || mode === 'LOCAL_AND_SHIPPING';
}

// Convert mode to boolean flags (for legacy compatibility)
export function modeToFlags(mode: FulfillmentMode): { 
  isLocalDeliveryAvailable: boolean; 
  isShippingAvailable: boolean; 
} {
  switch (mode) {
    case 'LOCAL_ONLY':
      return {
        isLocalDeliveryAvailable: true,
        isShippingAvailable: false,
      };
    case 'LOCAL_AND_SHIPPING':
      return {
        isLocalDeliveryAvailable: true,
        isShippingAvailable: true,
      };
    default:
      return {
        isLocalDeliveryAvailable: true,
        isShippingAvailable: true,
      };
  }
}

// Constants for enum values
export const FULFILLMENT_MODES = {
  LOCAL_ONLY: 'LOCAL_ONLY' as const,
  LOCAL_AND_SHIPPING: 'LOCAL_AND_SHIPPING' as const,
} as const;

// Alias for compatibility with EnhancedProductModal
export const FULFILLMENT = FULFILLMENT_MODES;

// Alias for compatibility 
export const booleansFromMode = modeToFlags;

export function getFulfillmentModeFromProduct(product: {
  isLocalDeliveryAvailable?: boolean;
  isShippingAvailable?: boolean;
}): FulfillmentMode {
  const { isLocalDeliveryAvailable = false, isShippingAvailable = false } = product;
  
  if (isLocalDeliveryAvailable && isShippingAvailable) {
    return FULFILLMENT_MODES.LOCAL_AND_SHIPPING;
  } else if (isLocalDeliveryAvailable && !isShippingAvailable) {
    return FULFILLMENT_MODES.LOCAL_ONLY;
  } else {
    // Default to LOCAL_AND_SHIPPING if unclear - never support "shipping only"
    return FULFILLMENT_MODES.LOCAL_AND_SHIPPING;
  }
}

export function isLocalOnlyBlocked(fulfillmentMode: FulfillmentMode, isLocal: boolean | undefined): boolean {
  return fulfillmentMode === 'LOCAL_ONLY' && isLocal === false;
}

// Missing export for getFulfillmentDescription
export function getFulfillmentDescription(mode: FulfillmentMode): string {
  switch (mode) {
    case 'LOCAL_ONLY':
      return 'Available for local pickup/delivery only';
    case 'LOCAL_AND_SHIPPING':
      return 'Available for local delivery and shipping';
    default:
      return 'Available for local delivery and shipping';
  }
}

export default {
  modeFromProduct,
  getFulfillmentModeFromProduct,
  isLocalOnlyBlocked,
  getFulfillmentLabel,
  getFulfillmentDescription,
  isValidFulfillmentMode,
  modeToFlags,
  booleansFromMode,
  FULFILLMENT_MODES,
  FULFILLMENT,
};