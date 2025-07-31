import type { ParsedAddress } from "@/components/ui/address-autocomplete";

// Asheville, NC and surrounding zip codes (within ~25 miles)
const ASHEVILLE_ZIP_CODES = [
  // Asheville proper
  '28801', '28802', '28803', '28804', '28805', '28806', '28810', '28813', '28814', '28815', '28816',
  // Surrounding areas within 25 miles
  '28704', '28711', '28715', '28732', '28748', '28753', '28759', '28772', '28778', '28787', '28791', '28792', '28803', '28806',
  // Black Mountain
  '28711',
  // Swannanoa  
  '28778',
  // Weaverville
  '28787',
  // Fletcher
  '28732',
  // Arden
  '28704',
  // Mills River
  '28759',
  // Hendersonville (close)
  '28739', '28791', '28792',
  // Candler
  '28715',
  // Leicester
  '28748',
  // Marshall
  '28753',
  // Fairview
  '28730'
];

// Asheville coordinates for distance calculation
const ASHEVILLE_COORDS = {
  lat: 35.5951,
  lng: -82.5515
};

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in miles
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Determine if a customer is local to Asheville, NC
 * Uses both zip code lookup and coordinate distance calculation
 */
export function isLocalCustomer(address: ParsedAddress): boolean {
  // First check zip code (fastest method)
  if (address.zipCode && ASHEVILLE_ZIP_CODES.includes(address.zipCode)) {
    return true;
  }

  // If coordinates are available, check distance
  if (address.coordinates) {
    const distance = calculateDistance(
      ASHEVILLE_COORDS.lat,
      ASHEVILLE_COORDS.lng,
      address.coordinates.lat,
      address.coordinates.lng
    );
    
    // Consider local if within 25 miles
    return distance <= 25;
  }

  // If no coordinates and zip not in list, assume not local
  return false;
}

/**
 * Get distance from Asheville in miles
 */
export function getDistanceFromAsheville(address: ParsedAddress): number | null {
  if (!address.coordinates) {
    return null;
  }

  return Math.round(
    calculateDistance(
      ASHEVILLE_COORDS.lat,
      ASHEVILLE_COORDS.lng,
      address.coordinates.lat,
      address.coordinates.lng
    )
  );
}

/**
 * Format address for display
 */
export function formatAddress(address: ParsedAddress): string {
  if (address.fullAddress) {
    return address.fullAddress;
  }

  const parts = [
    address.street,
    address.city && address.state ? `${address.city}, ${address.state}` : address.city || address.state,
    address.zipCode
  ].filter(Boolean);

  return parts.join(', ');
}

/**
 * Validate if address is complete
 */
export function isAddressComplete(address: ParsedAddress): boolean {
  return !!(
    address.street &&
    address.city &&
    address.state &&
    address.zipCode
  );
}

/**
 * Get state abbreviation from full state name
 */
export function getStateAbbreviation(stateName: string): string {
  const stateMap: Record<string, string> = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
    'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
    'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
    'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
    'District of Columbia': 'DC'
  };

  return stateMap[stateName] || stateName;
}