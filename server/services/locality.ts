// Simple locality service for LOCAL_ONLY fulfillment validation
export class LocalityService {
  private localZipCodes = new Set([
    '28801', '28803', '28804', '28805', '28806', '28808'  // Asheville, NC area
  ]);

  async isLocalZipCode(zipCode: string | undefined): Promise<boolean> {
    if (!zipCode) return false;
    
    // Clean zip code (remove any extensions like 28801-1234)
    const cleanZip = zipCode.split('-')[0].trim();
    
    return this.localZipCodes.has(cleanZip);
  }
}

export const localityService = new LocalityService();