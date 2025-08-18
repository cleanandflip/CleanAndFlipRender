// src/config/env.ts
import { URL } from 'url';

type AppEnv = 'development' | 'preview' | 'staging' | 'production';

export const APP_ENV: AppEnv =
  (process.env.APP_ENV as AppEnv) ||
  (process.env.REPLIT_ENV ? 'development' : (process.env.NODE_ENV === 'production' ? 'production' : 'development'));

function must(...names: string[]) {
  for (const n of names) {
    const v = process.env[n];
    if (v) return v;
  }
  throw new Error(`Missing required env: one of ${names.join(', ')}`);
}

// Always expose exactly ONE DB URL to the app
export const DATABASE_URL =
  APP_ENV === 'production'
    ? must('DATABASE_URL', 'PROD_DATABASE_URL')
    : must('DEV_DATABASE_URL', 'DATABASE_URL'); // in preview/dev, prefer DEV_DATABASE_URL

export const EXPECTED_DB_HOST = process.env.EXPECTED_DB_HOST || ''; // set per env
export const API_BASE =
  APP_ENV === 'production'
    ? must('API_BASE_URL_PROD', 'API_BASE_URL')       // e.g., https://api.prod-domain.com
    : (process.env.API_BASE_URL_DEV || process.env.API_BASE_URL || ''); // For dev, API_BASE is optional (uses relative paths)

export function dbHostFromUrl(u = DATABASE_URL) {
  return new URL(u).host;
}

console.log(`[ENV_CONFIG] APP_ENV=${APP_ENV}, DATABASE_URL host=${dbHostFromUrl()}`);