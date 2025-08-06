import { User } from '@shared/schema';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      firstName?: string | null;
      lastName?: string | null;
      role: string;
      isAdmin: boolean;
    }
    
    interface Request {
      user?: User;
      userId?: string;
      isAuthenticated(): boolean;
    }
  }
}