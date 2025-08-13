import { milesBetween } from "./distance";
import { getWarehouseConfig } from "../config/shipping";

export type LocalityResult = {
  isLocal: boolean;
  distanceMiles: number | null;
  reason: "RADIUS" | "NO_COORDS";
};

export function isLocalMiles(lat?: number | null, lng?: number | null): LocalityResult {
  const { lat: whLat, lng: whLng, radiusMiles } = getWarehouseConfig();
  
  console.log('LOCALITY CALC - Input coords:', { lat, lng });
  console.log('LOCALITY CALC - Warehouse coords:', { whLat, whLng, radiusMiles });
  
  if (lat == null || lng == null) {
    console.log('LOCALITY CALC - Missing coordinates, returning false');
    return { isLocal: false, distanceMiles: null, reason: "NO_COORDS" };
  }
  
  const miles = milesBetween({ lat, lng }, { lat: whLat, lng: whLng });
  const isLocal = miles <= radiusMiles;
  
  console.log('LOCALITY CALC - Distance:', miles, 'miles, isLocal:', isLocal);
  
  return { isLocal, distanceMiles: miles, reason: "RADIUS" };
}

export async function computeAddressLocality(addr: { latitude?: number | null; longitude?: number | null; }) {
  return isLocalMiles(addr.latitude ?? null, addr.longitude ?? null);
}