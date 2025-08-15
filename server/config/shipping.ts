// Unified warehouse and shipping configuration
export function getWarehouseConfig() {
  return {
    lat: Number(process.env.WH_LAT ?? 35.5951),
    lng: Number(process.env.WH_LNG ?? -82.5515),
    radiusMiles: Number(process.env.LOCAL_RADIUS_MILES ?? 30),
  };
}

// Legacy exports for backwards compatibility (will be removed)
export const WAREHOUSE = { lat: 35.5951, lng: -82.5515 }; // Asheville, NC
export const LOCAL_RADIUS_MILES = 30;