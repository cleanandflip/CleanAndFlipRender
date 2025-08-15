// shared/geo.ts - Geographic utilities SSOT (client + server compatible)

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Calculates distance between two coordinates using Haversine formula
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in miles
 */
export function calculateDistanceMiles(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) ** 2 + 
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceMeters = R * c;
  
  return distanceMeters / 1609.34; // Convert to miles
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

/**
 * Default HQ coordinates for distance calculations (Asheville, NC)
 */
export const DEFAULT_HQ: Coordinates = {
  lat: 35.5951,
  lng: -82.5515
};

/**
 * Default service radius in miles
 */
export const DEFAULT_RADIUS_MILES = 25;

/**
 * Determines if coordinates are within service area from HQ
 */
export function isWithinServiceRadius(
  coords: Coordinates, 
  hq: Coordinates = DEFAULT_HQ,
  radiusMiles: number = DEFAULT_RADIUS_MILES
): boolean {
  const distance = calculateDistanceMiles(coords, hq);
  return distance <= radiusMiles;
}