// Distance calculation in miles (not km)
export function haversineMiles(
  a: { lat: number; lon: number }, 
  b: { lat: number; lon: number }
): number {
  const R = 3958.7613; // Earth radius in miles
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lon - a.lon) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  
  const h = Math.sin(dLat / 2) ** 2 + 
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  
  return 2 * R * Math.asin(Math.sqrt(h));
}