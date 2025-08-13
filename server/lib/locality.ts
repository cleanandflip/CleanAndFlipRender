import { milesBetween } from "./distance";
import { getWarehouseConfig } from "../config/shipping";

export type LocalityResult = {
  isLocal: boolean;
  distanceMiles: number | null;
  reason: "RADIUS" | "NO_COORDS";
};

export function isLocalMiles(lat?: number | null, lng?: number | null): LocalityResult {
  const { lat: whLat, lng: whLng, radiusMiles } = getWarehouseConfig();
  
  if (lat == null || lng == null) {
    return { isLocal: false, distanceMiles: null, reason: "NO_COORDS" };
  }
  
  const miles = milesBetween({ lat, lng }, { lat: whLat, lng: whLng });
  const isLocal = miles <= radiusMiles;
  
  return { isLocal, distanceMiles: miles, reason: "RADIUS" };
}

export async function computeAddressLocality(addr: { latitude?: number | null; longitude?: number | null; }) {
  return isLocalMiles(addr.latitude ?? null, addr.longitude ?? null);
}