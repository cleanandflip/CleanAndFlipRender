export type FulfillmentMode = 'LOCAL_ONLY' | 'LOCAL_AND_SHIPPING';

export const FULFILLMENT = {
  LOCAL_ONLY: 'LOCAL_ONLY',
  BOTH: 'LOCAL_AND_SHIPPING',
} as const;

export const isLocalOnly = (m: FulfillmentMode) => m === 'LOCAL_ONLY';
export const isShippable = (m: FulfillmentMode) => m === 'LOCAL_AND_SHIPPING';
export const labelFor = (m: FulfillmentMode) =>
  m === 'LOCAL_ONLY' ? 'Local delivery only' : 'Local delivery + Shipping';

export const modeFromProduct = (p: any): FulfillmentMode => {
  // Use new fulfillment_mode field if available
  if (p?.fulfillment_mode) {
    return p.fulfillment_mode as FulfillmentMode;
  }
  
  // Fallback to legacy boolean fields
  const local = p?.is_local_delivery_available ?? p?.isLocalDeliveryAvailable ?? false;
  const ship = p?.is_shipping_available ?? p?.isShippingAvailable ?? false;
  
  if (local && !ship) return 'LOCAL_ONLY';
  return 'LOCAL_AND_SHIPPING'; // Default to both
};

export const booleansFromMode = (m: FulfillmentMode) => ({
  isLocalDeliveryAvailable: m === 'LOCAL_ONLY' || m === 'LOCAL_AND_SHIPPING',
  isShippingAvailable: m === 'LOCAL_AND_SHIPPING',
});

export const getFulfillmentLabel = (mode: FulfillmentMode): string => {
  switch (mode) {
    case 'LOCAL_ONLY': return 'Local delivery only';
    case 'LOCAL_AND_SHIPPING': return 'Local delivery + Shipping';
  }
};

export const getFulfillmentDescription = (mode: FulfillmentMode): string => {
  switch (mode) {
    case 'LOCAL_ONLY': return 'Heavy/bulky items. Only purchasable by local customers.';
    case 'LOCAL_AND_SHIPPING': return 'Available for both local delivery and nationwide shipping.';
  }
};