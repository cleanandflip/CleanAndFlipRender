declare module 'compression' {
  import { Request, Response, NextFunction } from 'express';
  
  interface CompressionOptions {
    filter?: (req: Request, res: Response) => boolean;
    level?: number;
    threshold?: number;
  }
  
  interface CompressionStatic {
    (options?: CompressionOptions): (req: Request, res: Response, next: NextFunction) => void;
    filter: (req: Request, res: Response) => boolean;
  }
  
  const compression: CompressionStatic;
  export = compression;
}