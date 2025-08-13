// server/services/cartGuard.ts
export function guardCartItemAgainstLocality({
  userIsLocal,
  product
}: {
  userIsLocal: boolean;
  product: { is_local_delivery_available?: boolean; is_shipping_available?: boolean };
}) {
  const localOnly = product.is_local_delivery_available && !product.is_shipping_available;
  if (!userIsLocal && localOnly) {
    const err: any = new Error("Local Delivery only. This item isn't available to ship to your address.");
    err.code = "LOCALITY_RESTRICTED";
    err.http = 409;
    throw err;
  }
}