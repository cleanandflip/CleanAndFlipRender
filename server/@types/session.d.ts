// Extended session interface for Google Auth and user sessions
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    email?: string;
    google?: {
      state: string;
      verifier: string;
      nonce: string;
    };
  }
}