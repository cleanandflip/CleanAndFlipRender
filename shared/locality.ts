// Single Source of Truth for Locality - Server/Client Isomorphic
export type LocalityStatus = {
  eligible: boolean;              // in local zone?
  zone: 'LOCAL' | 'NON_LOCAL';
  zip?: string;
  reason?: string;                // e.g., 'outside-zone', 'no-default-address', etc.
  source: 'DEFAULT_ADDRESS' | 'ZIP' | 'IP';
};

export interface User {
  id: string;
  defaultAddressId?: string;
}

export interface Address {
  id: string;
  postalCode: string;
  isDefault?: boolean;
}

// Local ZIP codes for Asheville, NC area
const LOCAL_ZIPS = new Set([
  '28801', '28803', '28804', '28805', '28806', '28808'
]);

export function isLocalZip(zip: string | undefined): boolean {
  if (!zip) return false;
  const cleanZip = zip.split('-')[0].trim();
  return LOCAL_ZIPS.has(cleanZip);
}

// Core locality evaluation logic (isomorphic)
export async function evaluateLocality({
  user,
  zipOverride,
  ip,
  getDefaultAddress, // function to fetch default address
}: {
  user?: User;
  zipOverride?: string;
  ip?: string;
  getDefaultAddress?: (userId: string) => Promise<Address | null>;
}): Promise<LocalityStatus> {
  
  // Priority 1: User has default address
  if (user?.defaultAddressId && getDefaultAddress) {
    try {
      const defaultAddr = await getDefaultAddress(user.id);
      if (defaultAddr?.postalCode) {
        const eligible = isLocalZip(defaultAddr.postalCode);
        return {
          eligible,
          zone: eligible ? 'LOCAL' : 'NON_LOCAL',
          zip: defaultAddr.postalCode,
          reason: eligible ? 'default-address' : 'outside-zone',
          source: 'DEFAULT_ADDRESS'
        };
      }
    } catch (error) {
      console.warn('Failed to fetch default address:', error);
    }
  }
  
  // Priority 2: ZIP override from user input
  if (zipOverride) {
    const eligible = isLocalZip(zipOverride);
    return {
      eligible,
      zone: eligible ? 'LOCAL' : 'NON_LOCAL',
      zip: zipOverride,
      reason: eligible ? 'zip-override' : 'outside-zone',
      source: 'ZIP'
    };
  }
  
  // Priority 3: IP fallback (best effort, assume non-local for safety)
  return {
    eligible: false,
    zone: 'NON_LOCAL',
    reason: 'no-default-address',
    source: 'IP'
  };
}