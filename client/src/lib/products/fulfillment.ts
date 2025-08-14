export type AnyProduct = Record<string, any>;

export function getFulfillment(p: AnyProduct) {
  // normalize different shapes from server/older clients
  const local =
    p.is_local_delivery_available ??
    p.isLocalDeliveryAvailable ??
    p.localDelivery ??
    false;

  const shipping =
    p.is_shipping_available ??
    p.isShippingAvailable ??
    p.shipping ??
    false;

  return { local: !!local, shipping: !!shipping };
}