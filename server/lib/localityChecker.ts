// ADDITIVE: Single source of truth for locality checking
import { Request } from 'express';

export type LocalityInfo = { 
  eligible: boolean; 
  zip: string; 
  source: 'DEFAULT_ADDRESS' | 'USER_CHECK' | 'NONE' | string; 
  userId?: string;
};

export async function getLocalityForRequest(req: Request): Promise<LocalityInfo> {
  const userId = req.session?.user?.id;
  
  try {
    // Use the existing locality logic from routes/locality.ts
    const { getLocalityStatus } = await import('../routes/locality');
    
    // Create a mock response object to capture the result
    let localityResult: any = { eligible: false, source: 'NONE', zip: 'none' };
    
    const mockRes = {
      json: (data: any) => { localityResult = data; },
      status: () => mockRes
    } as any;
    
    // Call the existing locality route handler
    await getLocalityStatus(req, mockRes, () => {});
    
    const result: LocalityInfo = {
      eligible: localityResult.eligible || false,
      zip: localityResult.zip || 'none',
      source: localityResult.source || 'NONE',
      userId: userId
    };
    
    console.log(`[LOCALITY] /status { eligible: ${result.eligible}, source: '${result.source}', zip: '${result.zip}', user: '${userId || 'guest'}' }`);
    
    return result;
    
  } catch (error) {
    console.error('[LOCALITY] Error checking locality:', error);
    const fallback: LocalityInfo = {
      eligible: false,
      zip: 'none', 
      source: 'ERROR',
      userId: userId
    };
    console.log(`[LOCALITY] /status (error fallback) { eligible: false, source: 'ERROR', zip: 'none', user: '${userId || 'guest'}' }`);
    return fallback;
  }
}