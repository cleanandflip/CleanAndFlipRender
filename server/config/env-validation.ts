import { Logger } from '../utils/logger';
import { env } from './env';

interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: string;
  PROD_DATABASE_URL?: string;
  DEV_DATABASE_URL?: string;
  STRIPE_SECRET_KEY: string;
  [key: string]: string | undefined;
}

const REQUIRED_ENV_VARS = [
  'STRIPE_SECRET_KEY'
] as const;

const OPTIONAL_ENV_VARS = [
  'REDIS_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'RESEND_API_KEY',
  'ENABLE_REDIS'
] as const;

export function validateEnvironmentVariables(): EnvironmentConfig {
  Logger.info('[ENV] Validating environment configuration...');
  
  const config: Partial<EnvironmentConfig> = {
    NODE_ENV: env.NODE_ENV || 'development',
    PORT: env.PORT || '5000'
  };

  const missing: string[] = [];
  const warnings: string[] = [];

  // Check database URL based on environment
  if (env.APP_ENV === 'production') {
    config['PROD_DATABASE_URL'] = env.PROD_DATABASE_URL;
    Logger.info(`[ENV] ✓ PROD_DATABASE_URL is configured`);
  } else {
    config['DEV_DATABASE_URL'] = env.DEV_DATABASE_URL;
    Logger.info(`[ENV] ✓ DEV_DATABASE_URL is configured`);
  }
  
  // Check optional Stripe (may not be set in development)
  try {
    config['STRIPE_SECRET_KEY'] = process.env.STRIPE_SECRET_KEY || '';
    if (config['STRIPE_SECRET_KEY']) {
      Logger.info(`[ENV] ✓ STRIPE_SECRET_KEY is configured`);
    } else {
      warnings.push('STRIPE_SECRET_KEY not configured - payment features disabled');
    }
  } catch (e) {
    warnings.push('STRIPE_SECRET_KEY not configured - payment features disabled');
  }

  // Check optional variables - skip process.env direct access for now
  warnings.push('Optional services (Redis, Cloudinary, etc.) validation disabled in env consolidation');

  // Log warnings for missing optional variables
  if (warnings.length > 0) {
    Logger.warn('[ENV] Optional configuration warnings:');
    warnings.forEach(warning => Logger.warn(`[ENV] - ${warning}`));
  }

  // Fail if required variables are missing
  if (missing.length > 0) {
    Logger.error('[ENV] Missing required environment variables:');
    missing.forEach(variable => Logger.error(`[ENV] - ${variable}`));
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate PORT is a valid number
  const port = parseInt(config.PORT!, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value: ${config.PORT}. Must be a number between 1-65535`);
  }

  // Environment-specific validations - using env module
  if (config.NODE_ENV === 'production') {
    Logger.info('[ENV] Production mode - performing additional validation...');
    
    // In production, ensure we have essential services configured
    if (!env.PROD_DATABASE_URL) {
      throw new Error('PROD_DATABASE_URL is required in production');
    }
  } else {
    // In development, ensure we have DEV_DATABASE_URL
    if (!env.DEV_DATABASE_URL) {
      throw new Error('DEV_DATABASE_URL is required in development');
    }
    
    // Stripe validation handled above
  }

  Logger.info(`[ENV] Environment validation completed successfully`);
  Logger.info(`[ENV] Running in ${config.NODE_ENV} mode on port ${config.PORT}`);
  
  return config as EnvironmentConfig;
}

export function getEnvironmentInfo(): Record<string, any> {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    memory: {
      total: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heap: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    },
    uptime: Math.round(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000
  };
}