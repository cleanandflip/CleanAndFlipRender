// server/lib/geo.ts - Geographic utilities for local customer determination

interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Determines if a location is within the local service area
 * Uses Haversine formula to calculate distance from headquarters
 */
export function isLocal({ lat, lng }: Coordinates): boolean {
  // Default HQ coordinates (Asheville, NC area - can be overridden via env)
  const HQ: Coordinates = {
    lat: parseFloat(process.env.HQ_LAT || '35.5951'),
    lng: parseFloat(process.env.HQ_LNG || '-82.5515')
  };
  
  const radiusMiles = parseFloat(process.env.LOCAL_RADIUS_MILES || '25');
  
  // Haversine distance calculation
  const R = 6371e3; // Earth radius in meters
  const φ1 = (HQ.lat * Math.PI) / 180;
  const φ2 = (lat * Math.PI) / 180;
  const Δφ = ((lat - HQ.lat) * Math.PI) / 180;
  const Δλ = ((lng - HQ.lng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) ** 2 + 
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceMeters = R * c;
  const distanceMiles = distanceMeters / 1609.34;

  const result = distanceMiles <= radiusMiles;
  
  // Log for debugging (can be removed in production)
  if (process.env.NODE_ENV === 'development') {
    console.log(`🌍 Local check: ${lat}, ${lng} is ${distanceMiles.toFixed(1)}mi from HQ (limit: ${radiusMiles}mi) → ${result ? 'LOCAL' : 'REMOTE'}`);
  }
  
  return result;
}

/**
 * Validates geographic coordinates
 */
export function isValidCoordinates({ lat, lng }: Coordinates): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    !isNaN(lat) && !isNaN(lng)
  );
}

/**
 * Normalizes coordinates to consistent precision
 */
export function normalizeCoordinates({ lat, lng }: Coordinates): Coordinates {
  return {
    lat: Math.round(lat * 1000000) / 1000000, // 6 decimal places
    lng: Math.round(lng * 1000000) / 1000000
  };
}