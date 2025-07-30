/**
 * Utility functions for data normalization and validation
 */

/**
 * Normalize email for case-insensitive comparison and storage
 */
export const normalizeEmail = (email: string): string => {
  return email?.toLowerCase().trim() || '';
};

/**
 * Normalize address components for consistent formatting
 */
export const normalizeAddress = (address: {
  city?: string;
  state?: string;
  zip?: string;
}) => {
  return {
    city: address.city?.trim(),
    state: address.state?.toUpperCase().trim(),
    zip: address.zip?.match(/\d{5}/)?.[0]
  };
};

/**
 * Parse and normalize city, state, ZIP string
 */
export const parseCityStateZip = (cityStateZip: string): {
  city: string;
  state: string;
  zip: string;
} | null => {
  if (!cityStateZip) return null;
  
  const trimmed = cityStateZip.trim();
  const parts = trimmed.split(',');
  
  if (parts.length !== 2) return null;
  
  const city = parts[0].trim();
  const stateZipPart = parts[1].trim();
  
  // Extract state (first 2 letters) and ZIP (5 digits)
  const stateMatch = stateZipPart.match(/^([A-Za-z]{2})/);
  const zipMatch = stateZipPart.match(/(\d{5})/);
  
  if (!stateMatch || !zipMatch) return null;
  
  return {
    city: city,
    state: stateMatch[1].toUpperCase(),
    zip: zipMatch[1]
  };
};

/**
 * Check if ZIP code is in Asheville, NC service area
 */
export const isLocalZip = (zip: string): boolean => {
  const localZips = [
    "28801", "28802", "28803", "28804", "28805", "28806", "28807", "28808", 
    "28810", "28813", "28814", "28815", "28816", "28817", "28818"
  ];
  return localZips.includes(zip);
};

/**
 * Validate city, state, ZIP format (case insensitive)
 */
export const validateCityStateZip = (cityStateZip: string): boolean => {
  const parsed = parseCityStateZip(cityStateZip);
  return parsed !== null;
};

/**
 * Normalize search terms for case-insensitive search
 */
export const normalizeSearchTerm = (term: string): string => {
  return term?.toLowerCase().trim() || '';
};

/**
 * Normalize brand names for case-insensitive comparison
 */
export const normalizeBrand = (brand: string): string => {
  return brand?.toLowerCase().trim() || '';
};

/**
 * Clean phone number (remove non-digits)
 */
export const normalizePhone = (phone: string): string => {
  return phone?.replace(/\D/g, '') || '';
};

/**
 * Validate state abbreviation (case insensitive)
 */
export const validateState = (state: string): boolean => {
  const validStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];
  return validStates.includes(state?.toUpperCase().trim());
};