export function getFulfillmentFlags(p: any) {
  return {
    localDelivery: Boolean(p?.localDelivery ?? p?.fulfillment?.local ?? p?.isLocalDeliveryAvailable),
    nationwideShipping: Boolean(p?.nationwideShipping ?? p?.fulfillment?.shipping ?? p?.isShippingAvailable),
  };
}

export function isLocalOnly(p: any) {
  const f = getFulfillmentFlags(p);
  return f.localDelivery && !f.nationwideShipping;
}