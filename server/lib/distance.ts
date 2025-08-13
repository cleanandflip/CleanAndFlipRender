/**
 * Distance calculations in miles for local delivery detection
 * SSOT for all distance-based features
 */

const EARTH_RADIUS_MILES = 3958.7613;

export interface Coordinates {
  lat: number;
  lon: number;
}

/**
 * Calculate distance between two points using Haversine formula (in miles)
 */
export function haversineMiles(a: Coordinates, b: Coordinates): number {
  const toRad = (v: number) => v * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

/**
 * Check if user location is within local delivery radius (50 miles)
 */
export function isLocalMiles(
  userCoords: { latitude: number | null; longitude: number | null }, 
  warehouseCoords: { latitude: number; longitude: number }, 
  radiusMiles: number = 50
): boolean {
  if (userCoords.latitude == null || userCoords.longitude == null) return false;
  
  return haversineMiles(
    { lat: userCoords.latitude, lon: userCoords.longitude },
    { lat: warehouseCoords.latitude, lon: warehouseCoords.longitude }
  ) <= radiusMiles;
}

/**
 * Get warehouse coordinates from environment
 */
export function getWarehouseCoords(): Coordinates {
  const lat = parseFloat(process.env.WAREHOUSE_LAT || '35.5951'); // Asheville, NC default
  const lon = parseFloat(process.env.WAREHOUSE_LON || '-82.5515');
  
  if (isNaN(lat) || isNaN(lon)) {
    throw new Error('Invalid warehouse coordinates in environment variables');
  }
  
  return { lat, lon };
}