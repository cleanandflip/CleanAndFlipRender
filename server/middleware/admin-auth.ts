// Enhanced admin authentication middleware with role-based access control
import { Response, NextFunction } from "express";
import { Logger } from "../utils/logger";

export type AdminRole = 'user' | 'support' | 'developer';

export const adminAuth = {
  // Require specific roles for admin access
  requireRole: (...allowedRoles: AdminRole[]) => {
    return (req: any, res: Response, next: NextFunction) => {
      // Check authentication first
      if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get user role from session/user object
      const userRole = req.user?.role || req.session?.role || 'user';
      
      // Check if user has required role
      if (!allowedRoles.includes(userRole as AdminRole)) {
        // Log unauthorized admin access attempt
        Logger.warn(`[ADMIN] Unauthorized access attempt`, {
          userId: req.user?.id,
          userRole,
          requiredRoles: allowedRoles,
          path: req.path,
          ip: req.ip,
          userAgent: req.get('User-Agent')?.substring(0, 100)
        });
        
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: allowedRoles,
          current: userRole
        });
      }

      // Set role on request for downstream middleware
      req.adminRole = userRole;
      next();
    };
  },

  // Log admin actions for audit trail
  auditLog: (action: string, targetType?: string) => {
    return (req: any, res: Response, next: NextFunction) => {
      // Store original end function
      const originalEnd = res.end;
      
      res.end = function(...args: any[]) {
        // Only log successful admin actions (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          Logger.info(`[ADMIN AUDIT] ${action}`, {
            actorUserId: req.user?.id,
            actorRole: req.adminRole,
            action,
            targetType,
            targetId: req.params?.id,
            path: req.path,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent')?.substring(0, 100),
            statusCode: res.statusCode
          });
        }
        
        return originalEnd.apply(this, args as any);
      };
      
      next();
    };
  },

  // Check if user can view PII (full IPs, emails, etc.)
  canViewPII: (req: any): boolean => {
    return req.adminRole === 'developer';
  },

  // Mask sensitive data based on role
  maskIP: (ip?: string, canViewFull?: boolean): string => {
    if (!ip) return '-';
    if (canViewFull) return ip;
    return ip.replace(/\.\d+$/, '.xxx');
  },

  maskEmail: (email?: string, canViewFull?: boolean): string => {
    if (!email) return '-';
    if (canViewFull) return email;
    const [local, domain] = email.split('@');
    return `${local.substring(0, 2)}***@${domain}`;
  },

  maskUserAgent: (userAgent?: string, canViewFull?: boolean): string => {
    if (!userAgent) return '-';
    if (canViewFull) return userAgent;
    return userAgent.substring(0, 50) + '...';
  }
};

// Export type for TypeScript
declare global {
  namespace Express {
    interface Request {
      adminRole?: AdminRole;
    }
  }
}