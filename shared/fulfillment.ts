export type FulfillmentMode = 'local_only' | 'shipping_only' | 'both';

export const modeFromProduct = (p: any): FulfillmentMode => {
  const local = p?.is_local_delivery_available ?? p?.isLocalDeliveryAvailable ?? false;
  const ship = p?.is_shipping_available ?? p?.isShippingAvailable ?? false;
  if (local && ship) return 'both';
  if (local) return 'local_only';
  return 'shipping_only';
};

export const booleansFromMode = (m: FulfillmentMode) => ({
  isLocalDeliveryAvailable: m !== 'shipping_only',
  isShippingAvailable: m !== 'local_only',
});

export const getFulfillmentLabel = (mode: FulfillmentMode): string => {
  switch (mode) {
    case 'local_only': return 'Local delivery only';
    case 'shipping_only': return 'Shipping only';
    case 'both': return 'Local delivery + Shipping';
  }
};

export const getFulfillmentDescription = (mode: FulfillmentMode): string => {
  switch (mode) {
    case 'local_only': return 'Only free local delivery (50 miles).';
    case 'shipping_only': return 'Nationwide shipping only.';
    case 'both': return 'Local delivery + nationwide shipping.';
  }
};