import { db } from '../db';
import { serviceZones } from '../../shared/schema';
import { haversineKm } from '../lib/haversine';
import { eq } from 'drizzle-orm';

export interface Address {
  latitude?: number | string | null;
  longitude?: number | string | null;
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export async function /* SSOT-FORBIDDEN \bisLocal\( */ isLocal(address: Address): Promise<boolean> {
  if (!address.latitude || !address.longitude) {
    return false;
  }

  const lat = typeof address.latitude === 'string' ? parseFloat(address.latitude) : address.latitude;
  const lng = typeof address.longitude === 'string' ? parseFloat(address.longitude) : address.longitude;

  if (isNaN(lat) || isNaN(lng)) {
    return false;
  }

  try {
    // Get active service zones from database
    const zones = await db.select().from(serviceZones).where(eq(serviceZones.active, true));

    for (const zone of zones) {
      if (zone.polygon) {
        // TODO: Implement point-in-polygon for complex zones
        // For now, skip polygon zones
        continue;
      }

      if (zone.centerLat && zone.centerLng && zone.radiusKm) {
        const centerLat = typeof zone.centerLat === 'string' ? parseFloat(zone.centerLat) : zone.centerLat;
        const centerLng = typeof zone.centerLng === 'string' ? parseFloat(zone.centerLng) : zone.centerLng;
        const radiusKm = typeof zone.radiusKm === 'string' ? parseFloat(zone.radiusKm) : zone.radiusKm;

        const distance = haversineKm(lat, lng, centerLat, centerLng);
        if (distance <= radiusKm) {
          return true;
        }
      }
    }

    // Fallback to environment variables if no zones configured
    const fallbackLat = process.env.LOCAL_CENTER_LAT;
    const fallbackLng = process.env.LOCAL_CENTER_LNG;
    const fallbackRadius = process.env.LOCAL_RADIUS_KM;

    if (fallbackLat && fallbackLng && fallbackRadius) {
      const distance = haversineKm(
        lat,
        lng,
        parseFloat(fallbackLat),
        parseFloat(fallbackLng)
      );
      return distance <= parseFloat(fallbackRadius);
    }

    return false;
  } catch (error) {
    console.error('Error checking local status:', error);
    return false;
  }
}