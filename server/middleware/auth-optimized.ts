import { logger, shouldLog } from '../config/logger';

export function requireAuth(req: any, res: any, next: any) {
  const isAuthenticated = req.isAuthenticated?.();
  
  if (!isAuthenticated) {
    if (shouldLog('auth')) {
      logger.debug('Auth failed - no session', { 
        type: 'auth',
        ip: req.ip 
      });
    }
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please log in to access this resource'
    });
  }
  
  const user = req.user;
  if (!user) {
    if (shouldLog('auth')) {
      logger.debug('Auth failed - no user object', { type: 'auth' });
    }
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please log in to access this resource'
    });
  }
  
  // Only log essential info and only when auth logging is enabled
  if (shouldLog('auth')) {
    logger.debug(`Auth success: ${user.email}`, { 
      type: 'auth',
      userId: user.id,
      role: user.role 
    });
  }
  
  req.userId = user.id;
  next();
}

export function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    const isAuthenticated = req.isAuthenticated?.();
    
    if (!isAuthenticated) {
      if (shouldLog('auth')) {
        logger.debug('Role check failed - not authenticated', { type: 'auth' });
      }
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      });
    }
    
    const user = req.user;
    if (!user || !roles.includes(user.role)) {
      if (shouldLog('auth')) {
        logger.warn(`Role check failed - user ${user?.email} lacks required role`, { 
          type: 'auth',
          userRole: user?.role,
          requiredRoles: roles 
        });
      }
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: 'You do not have permission to access this resource'
      });
    }
    
    if (shouldLog('auth')) {
      logger.debug(`Role check success: ${user.email} (${user.role})`, { 
        type: 'auth',
        userId: user.id,
        role: user.role 
      });
    }
    
    req.userId = user.id;
    next();
  };
}