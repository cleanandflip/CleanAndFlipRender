// shared/availability.ts - SSOT for product availability computation

import { UserMode } from './locality';

export type ProductMode = 'LOCAL_ONLY' | 'LOCAL_AND_SHIPPING';
export type EffectiveAvailability = 'ADD_ALLOWED' | 'PICKUP_ONLY' | 'SHIPPING_ONLY' | 'BLOCKED';

/**
 * Single source of truth for computing effective availability
 * Intersects product fulfillment mode with user locality mode
 * 
 * Business Rules Matrix:
 * User Mode         | Product LOCAL_ONLY | Product LOCAL_AND_SHIPPING
 * -----------------|-------------------|-------------------------
 * LOCAL_ONLY       | ADD_ALLOWED       | PICKUP_ONLY
 * SHIPPING_ONLY    | BLOCKED           | SHIPPING_ONLY  
 * LOCAL_AND_SHIPPING| ADD_ALLOWED      | ADD_ALLOWED
 * NONE             | BLOCKED           | BLOCKED
 */
export function computeEffectiveAvailability(
  productMode: ProductMode,
  userMode: UserMode
): EffectiveAvailability {
  // CRITICAL FIX: Allow LOCAL_AND_SHIPPING items for NONE users (guests with shipping)
  if (userMode === 'NONE' && productMode === 'LOCAL_AND_SHIPPING') {
    return 'SHIPPING_ONLY';  // Guest can ship but not pickup
  }
  
  // Block LOCAL_ONLY for NONE users
  if (userMode === 'NONE') {
    return 'BLOCKED';
  }
  
  // LOCAL_ONLY products
  if (productMode === 'LOCAL_ONLY') {
    // Only LOCAL_ONLY and LOCAL_AND_SHIPPING users can get LOCAL_ONLY items
    return (userMode === 'LOCAL_ONLY' || userMode === 'LOCAL_AND_SHIPPING') 
      ? 'ADD_ALLOWED' 
      : 'BLOCKED';
  }
  
  // LOCAL_AND_SHIPPING products
  if (productMode === 'LOCAL_AND_SHIPPING') {
    switch (userMode) {
      case 'LOCAL_ONLY':
        return 'PICKUP_ONLY';      // Can pickup but not ship
      case 'SHIPPING_ONLY':
        return 'SHIPPING_ONLY';    // Can ship but not pickup
      case 'LOCAL_AND_SHIPPING':
        return 'ADD_ALLOWED';      // Full access
      default:
        return 'BLOCKED';
    }
  }
  
  // Fallback for unknown modes
  return 'BLOCKED';
}

/**
 * Get human-readable reason for availability decision
 */
export function getAvailabilityReason(
  productMode: ProductMode,
  userMode: UserMode,
  availability: EffectiveAvailability
): string {
  switch (availability) {
    case 'ADD_ALLOWED':
      return 'Available for purchase and delivery';
      
    case 'PICKUP_ONLY':
      return 'Available for local pickup only';
      
    case 'SHIPPING_ONLY':
      return 'Available for shipping only';
      
    case 'BLOCKED':
      if (userMode === 'NONE') {
        return 'Not available - locality unknown';
      }
      if (productMode === 'LOCAL_ONLY' && userMode === 'SHIPPING_ONLY') {
        return 'This item is only available for local delivery';
      }
      return 'Not available in your area';
      
    default:
      return 'Availability unknown';
  }
}

/**
 * Check if item can be added to cart
 */
export function canAddToCart(
  productMode: ProductMode,
  userMode: UserMode
): boolean {
  const availability = computeEffectiveAvailability(productMode, userMode);
  return availability !== 'BLOCKED';
}

/**
 * Check if item supports local pickup
 */
export function supportsPickup(
  productMode: ProductMode,
  userMode: UserMode
): boolean {
  const availability = computeEffectiveAvailability(productMode, userMode);
  return availability === 'ADD_ALLOWED' || availability === 'PICKUP_ONLY';
}

/**
 * Check if item supports shipping
 */
export function supportsShipping(
  productMode: ProductMode,
  userMode: UserMode
): boolean {
  const availability = computeEffectiveAvailability(productMode, userMode);
  return availability === 'ADD_ALLOWED' || availability === 'SHIPPING_ONLY';
}