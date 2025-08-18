// Admin dashboard utility functions
import { User } from "./schema";

// IP masking utility for PII protection
export const maskIp = (ip?: string, canViewFull?: boolean): string => {
  if (!ip) return '-';
  if (canViewFull) return ip;
  return ip.replace(/\.\d+$/, '.xxx');
};

// User agent parsing for display
export const parseUserAgent = (userAgent?: string) => {
  if (!userAgent) return { browser: 'Unknown', os: 'Unknown' };
  
  // Simple parsing - can be enhanced with a proper library if needed
  const browser = userAgent.includes('Chrome') ? 'Chrome' :
                  userAgent.includes('Firefox') ? 'Firefox' :
                  userAgent.includes('Safari') ? 'Safari' :
                  userAgent.includes('Edge') ? 'Edge' : 'Unknown';
                  
  const os = userAgent.includes('Windows') ? 'Windows' :
             userAgent.includes('Mac') ? 'macOS' :
             userAgent.includes('Linux') ? 'Linux' :
             userAgent.includes('Android') ? 'Android' :
             userAgent.includes('iOS') ? 'iOS' : 'Unknown';
             
  return { browser, os };
};

// Enhanced user type with computed fields for admin dashboard
export interface EnhancedUser extends User {
  // Computed fields that will be added by the API
  providers?: string[];
  sessionsCount?: number;
  ordersCount?: number;
  lifetimeValue?: number;
  lastOrderAt?: Date;
  joinedDaysAgo?: number;
}

// System health check type
export interface SystemHealth {
  ok: boolean;
  env: string;
  dbHost: string;
  database: string;
  uptime?: number;
  pid?: number;
  timezone?: string;
  dbLatency?: number;
  apiP95?: number;
  wsClients?: number;
  pendingMigrations?: number;
  searchIndexStatus?: string;
  lastWebhookAt?: Date;
  lastWebhookStatus?: string;
  lastWebhookError?: string;
  slowQueries?: Array<{
    query: string;
    avgTime: number;
    calls: number;
  }>;
}

// Stripe dashboard info
export interface StripeDashboardInfo {
  mode: 'test' | 'live';
  accountId?: string;
  lastWebhookAt?: Date;
  lastWebhookStatus?: string;
  lastError?: string;
  recentCharges?: Array<{
    id: string;
    amount: number;
    status: string;
    customerEmail?: string;
    created: Date;
  }>;
}

// User session for admin dashboard
export interface UserSession {
  sid: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  lastSeenAt: Date;
  expires: Date;
}

// Login event for admin dashboard
export interface LoginEventForAdmin {
  id: number;
  userId?: string;
  email?: string;
  provider: string;
  method: string;
  success: boolean;
  errorCode?: string;
  ip?: string;
  userAgent?: string;
  country?: string;
  region?: string;
  city?: string;
  riskScore?: number;
  sessionId?: string;
  createdAt: Date;
}

// Admin feature flags
export const ADMIN_FEATURES = {
  ENHANCED_DASHBOARD: process.env.ADMIN_ENHANCED === 'true',
  PII_REVEAL: true, // Always available for developers
  SESSION_MANAGEMENT: true,
  LOGIN_AUDIT: true,
  SYSTEM_MONITORING: true,
} as const;