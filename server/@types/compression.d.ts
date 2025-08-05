declare module 'compression' {
  import { RequestHandler } from 'express';
  
  interface CompressionOptions {
    threshold?: number;
    level?: number;
    filter?: (req: any, res: any) => boolean;
  }
  
  function compression(options?: CompressionOptions): RequestHandler;
  export = compression;
}