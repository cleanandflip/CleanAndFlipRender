import compression from 'compression';
import { Express } from 'express';

export function setupCompression(app: Express) {
  app.use(compression({
    filter: (req: any, res: any) => {
      // Don't compress if explicitly disabled
      if (req.headers['x-no-compression']) {
        return false;
      }
      // Use default compression for everything else
      return true;
    },
    level: 6, // Good balance between speed and compression ratio
    threshold: 1024, // Only compress responses larger than 1KB
  }));
  
  console.log('✅ Response compression configured');
}