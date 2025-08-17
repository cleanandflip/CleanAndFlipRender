// ADDITIVE: Single source of truth for locality checking
import { Request } from 'express';

export type LocalityInfo = { 
  eligible: boolean; 
  zip: string; 
  source: 'default' | 'zip' | 'address' | 'ERROR' | string; 
  userId?: string;
};

export async function getLocalityForRequest(req: Request): Promise<LocalityInfo> {
  const userId = (req as any).user?.id || (req.session as any)?.passport?.user || (req.session as any)?.userId || null;
  
  try {
    // Use the existing locality logic from routes/locality.controller.ts
    const { getLocalityStatus } = await import('../locality/locality.controller');
    
    // Create a mock response object to capture the result
    let localityResult: any = { eligible: false, source: 'NONE', zip: 'none' };
    
    const mockRes = {
      json: (data: any) => { localityResult = data; return mockRes; },
      status: () => mockRes
    } as any;
    
    // Call the existing locality route handler
    await getLocalityStatus(req as any, mockRes);
    
    const result: LocalityInfo = {
      eligible: Boolean(localityResult.eligible),
      zip: localityResult.zip || 'none',
      source: localityResult.source || 'NONE',
      userId: userId || undefined
    };
    
    console.log(`[LOCALITY] /status { eligible: ${result.eligible}, source: '${result.source}', zip: '${result.zip}', user: '${result.userId || 'guest'}' }`);
    
    return result;
    
  } catch (error) {
    console.error('[LOCALITY] Error checking locality:', error);
    const fallback: LocalityInfo = {
      eligible: false,
      zip: 'none', 
      source: 'ERROR',
      userId: userId || undefined
    };
    console.log(`[LOCALITY] /status (error fallback) { eligible: false, source: 'ERROR', zip: 'none', user: '${userId || 'guest'}' }`);
    return fallback;
  }
}