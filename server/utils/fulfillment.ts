const EARTH_R = 3958.8; // miles
const HQ = { lat: 35.5951, lng: -82.5515 }; // Asheville, NC (example)
const RADIUS = 50; // miles

function toRad(v: number) { return (v * Math.PI) / 180; }

export function isLocalMiles(lat: number, lng: number, center = HQ, radius = RADIUS) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { isLocal: false, miles: Infinity };
  const dLat = toRad(lat - center.lat);
  const dLng = toRad(lng - center.lng);
  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(toRad(center.lat)) * Math.cos(toRad(lat)) * Math.sin(dLng/2)**2;
  const miles = 2 * EARTH_R * Math.asin(Math.sqrt(a));
  return { isLocal: miles <= radius, miles };
}

export function guardCartItemAgainstLocality(opts: {
  userIsLocal: boolean;
  product: { is_local_delivery_available: boolean; is_shipping_available: boolean };
}) {
  const { userIsLocal, product } = opts;
  const localOnly = !!product.is_local_delivery_available && !product.is_shipping_available;
  if (localOnly && !userIsLocal) {
    const err: any = new Error("LOCAL_ONLY_PRODUCT_OUTSIDE_ZONE");
    err.status = 400;
    err.code = "LOCAL_ONLY";
    throw err;
  }
}