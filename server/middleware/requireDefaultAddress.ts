import { Request, Response, NextFunction } from "express";

/** Use only for order creation/checkout submit, not for cart or browsing. */
export function requireDefaultAddress(req: Request, res: Response, next: NextFunction) {
  const user = req.user as any;
  if (!user?.id) return res.status(401).json({ message: "Auth required" });
  if (!user?.defaultAddressId) {
    return res.status(409).json({ code: "NO_DEFAULT_ADDRESS", message: "Please set a default shipping address before checking out." });
  }
  next();
}