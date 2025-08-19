import { Request, Response, NextFunction } from "express";

export function requireAdmin(req: any, res: Response, next: NextFunction) {
  // Check if user is authenticated and has admin role
  const isAdmin = req.user?.role === "admin" || 
                  req.user?.role === "developer" || 
                  req.session?.role === "admin" ||
                  req.session?.role === "developer";
  
  if (!isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  next();
}